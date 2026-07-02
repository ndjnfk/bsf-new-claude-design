package userpanel

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// thirdPartyFancy is one session fancy mapped from the provider feed — a faithful
// port of bsf-activemq/start/fancy_Data.ts (data[matchId].fancy.fancy2[]).
type thirdPartyFancy struct {
	SelectionID string
	HeadName    string
	Yes         float64 // BackPrice1  (feed b)
	YesSize     float64 // BackSize1   (feed br)
	No          float64 // LayPrice1   (feed l)
	NoSize      float64 // LaySize1    (feed lr)
	Status      string  // "" = open | SUSPENDED | BALL RUNNING | Result Awaiting
	Priority    int     // in_priority: Over Runs 1 / Player Run 2 / Wkt 3 / Others 4
	HasResult   bool
}

// fancyFeedBase is the provider base URL. Defaults to the reference "rama" feed;
// override with FANCY_FEED_BASE (e.g. the cbtf :3002 / diamond :3003 mirror).
func fancyFeedBase() string {
	if v := os.Getenv("FANCY_FEED_BASE"); v != "" {
		return v
	}
	return "http://139.59.162.241:3000"
}

var fancyFeedClient = &http.Client{Timeout: 4 * time.Second}

// StartFancyPoller runs a background loop that polls the third-party feed for every
// cricket match that has a feed id and publishes live session rates to the native-WS
// room FANCY:<matchId>. The event page subscribes to that room, so fancy rates tick
// in real time without any REST polling. Blocks until ctx is cancelled — call in a
// goroutine.
func (m *Module) StartFancyPoller(ctx context.Context) {
	if m.pub == nil {
		return
	}
	ticker := time.NewTicker(1500 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			m.pollAndPublishFancies(ctx)
		}
	}
}

func (m *Module) pollAndPublishFancies(ctx context.Context) {
	var matches []struct {
		ID     int64  `db:"id"`
		FeedID string `db:"feed_id"`
	}
	if err := m.db.SelectContext(ctx, &matches,
		`SELECT id, feed_id FROM matches
		  WHERE sport_id = 4 AND feed_id IS NOT NULL AND feed_id <> '' AND status <> 'CLOSED'`); err != nil {
		return
	}
	for _, mt := range matches {
		fctx, cancel := context.WithTimeout(ctx, 4*time.Second)
		tp, err := fetchThirdPartyFancies(fctx, mt.FeedID)
		cancel()
		if err != nil || len(tp) == 0 {
			continue
		}
		// Payload shape the frontend's updateFancyData merge expects.
		data := make([]map[string]any, 0, len(tp))
		for _, f := range tp {
			data = append(data, map[string]any{
				"SelectionId": f.SelectionID,
				"GameStatus":  f.Status,
				"BackPrice1":  f.Yes,
				"BackSize1":   f.YesSize,
				"LayPrice1":   f.No,
				"LaySize1":    f.NoSize,
			})
		}
		_ = m.pub.Publish(ctx, fmt.Sprintf("FANCY:%d", mt.ID),
			map[string]any{"type": "FANCY_DATA", "marketId": mt.ID, "data": data})
	}
}

// fetchThirdPartyFancies pulls the provider's session fancies for a feed match id.
// Best-effort: any error/timeout returns (nil, err) so the caller falls back to the
// manual fancies in the DB.
func fetchThirdPartyFancies(ctx context.Context, feedID string) ([]thirdPartyFancy, error) {
	url := fmt.Sprintf("%s/api/multiEvents/%s", fancyFeedBase(), feedID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	res, err := fancyFeedClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("feed status %d", res.StatusCode)
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	// Payload: { data: { <matchId>: { fancy: { fancy2: [...] } } } } — or the same
	// without the outer "data" wrapper.
	var root map[string]json.RawMessage
	if err := json.Unmarshal(body, &root); err != nil {
		return nil, err
	}
	container := root
	if d, ok := root["data"]; ok {
		var inner map[string]json.RawMessage
		if json.Unmarshal(d, &inner) == nil && len(inner) > 0 {
			container = inner
		}
	}
	raw, ok := container[feedID]
	if !ok {
		for _, v := range container { // fall back to the first match present
			raw = v
			break
		}
	}
	if len(raw) == 0 {
		return nil, nil
	}
	var md struct {
		Fancy struct {
			Fancy2 []map[string]any `json:"fancy2"`
		} `json:"fancy"`
	}
	if err := json.Unmarshal(raw, &md); err != nil {
		return nil, err
	}

	out := make([]thirdPartyFancy, 0, len(md.Fancy.Fancy2))
	for _, f := range md.Fancy.Fancy2 {
		name := strings.ToLower(feedStr(f["na"]))
		if name == "" {
			continue
		}
		// Sub-lines: keep only the ".3" variant, skip other dotted ones (reference).
		if strings.Contains(name, ".") && !strings.Contains(name, ".3") {
			continue
		}
		priority := 4
		switch {
		case strings.Contains(name, "over"):
			priority = 1
		case strings.Contains(name, "run"):
			priority = 2
		case strings.Contains(name, "wkt"):
			priority = 3
		}
		gstatus := strings.ToUpper(strings.TrimSpace(feedStr(f["s"])))
		sb := feedStr(f["sb"])
		resultAwaiting := feedFloat(f["go"]) > 0 ||
			(strings.Contains(name, "adv") && (gstatus == "SUSPENDED" || sb == "S"))
		status := ""
		switch {
		case resultAwaiting:
			status = "Result Awaiting"
		case gstatus == "SUSPENDED", sb == "S":
			status = "SUSPENDED"
		case gstatus == "BALL RUNNING":
			status = "BALL RUNNING"
		case gstatus != "" && gstatus != "OPEN":
			status = gstatus
		}
		out = append(out, thirdPartyFancy{
			SelectionID: feedStr(f["i"]),
			HeadName:    name,
			Yes:         feedFloat(f["b"]),
			YesSize:     feedFloat(f["br"]),
			No:          feedFloat(f["l"]),
			NoSize:      feedFloat(f["lr"]),
			Status:      status,
			Priority:    priority,
			HasResult:   resultAwaiting,
		})
	}
	return out, nil
}

// feedStr / feedFloat read a JSON value that may arrive as a string OR a number.
func feedStr(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case json.Number:
		return t.String()
	case float64:
		return strconv.FormatFloat(t, 'f', -1, 64)
	case nil:
		return ""
	default:
		return fmt.Sprintf("%v", t)
	}
}

func feedFloat(v any) float64 {
	switch t := v.(type) {
	case float64:
		return t
	case json.Number:
		f, _ := t.Float64()
		return f
	case string:
		f, _ := strconv.ParseFloat(strings.TrimSpace(t), 64)
		return f
	default:
		return 0
	}
}
