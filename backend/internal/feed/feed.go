// Package feed is the third-party events wrapper. It hides the upstream API
// shape behind our own normalized model and fails over across multiple feed URLs
// so that a provider going down — or its response structure changing — never
// reaches the rest of the system. Only the Super Duper Admin may call it.
package feed

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/httpx"
)

// --- Normalized model (what the rest of the system sees) ---

// Sport / Series / Match / Market / Runner are our internal, provider-agnostic
// shapes. If the upstream feed changes, only normalize() below changes.
type Sport struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
type Series struct {
	ID      string `json:"id"`
	SportID string `json:"sportId"`
	Name    string `json:"name"`
	// Set by the wrapper after cross-referencing our DB.
	Activated bool  `json:"activated"`
	LocalID   int64 `json:"localId"` // our series.id once activated
}
type Match struct {
	ID        string   `json:"id"`
	SportID   string   `json:"sportId"`
	SeriesID  string   `json:"seriesId"`
	Name      string   `json:"name"`
	StartTime string   `json:"startTime"`
	InPlay    bool     `json:"inPlay"`
	Markets   []Market `json:"markets"`
	// Set by the wrapper after cross-referencing our DB.
	Activated bool  `json:"activated"`
	LocalID   int64 `json:"localId"` // our matches.id once activated
}
type Market struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Type    string   `json:"type"`
	Status  string   `json:"status"`
	Runners []Runner `json:"runners"`
}
type Runner struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

// Snapshot is the deduplicated catalog (sports/series/matches) for the GUI.
type Snapshot struct {
	Source  string   `json:"source"` // which feed URL served this
	Sports  []Sport  `json:"sports"`
	Series  []Series `json:"series"`
	Matches []Match  `json:"matches"`
}

// Provider returns a normalized snapshot of the live events catalog.
type Provider interface {
	Events(ctx context.Context) (*Snapshot, error)
}

// MultiProvider tries each URL in priority order and returns the first success —
// the failover. The wrapper is the single point that knows the upstream shape.
type MultiProvider struct {
	urls   []string
	client *http.Client
}

// New builds a failover provider over the given URLs (primary first).
func New(urls []string) *MultiProvider {
	return &MultiProvider{urls: urls, client: &http.Client{Timeout: 8 * time.Second}}
}

// Events fetches from the primary URL, falling back to the next on any error.
func (m *MultiProvider) Events(ctx context.Context) (*Snapshot, error) {
	var lastErr error
	for _, url := range m.urls {
		snap, err := m.fetch(ctx, url)
		if err != nil {
			lastErr = err
			continue // provider down → try the next
		}
		snap.Source = url
		return snap, nil
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("no feed urls configured")
	}
	return nil, lastErr
}

func (m *MultiProvider) fetch(ctx context.Context, url string) (*Snapshot, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	res, err := m.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("feed %s: status %d", url, res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 32<<20))
	if err != nil {
		return nil, err
	}
	return normalize(body)
}

// --- Upstream shape (kept private; the ONLY place that knows the API JSON) ---

type rawEvent struct {
	EID  string       `json:"eid"`
	Name string       `json:"na"`
	Le   string       `json:"le"` // series/league name
	Si   json.Number  `json:"si"` // sport id
	Li   string       `json:"li"` // series/league id
	St   string       `json:"st"` // start time
	IP   bool         `json:"ip"`
	Odds []rawMarket  `json:"odds"`
}
type rawMarket struct {
	Mid    string      `json:"mid"`
	Name   string      `json:"na"`
	Type   string      `json:"ty"`
	Status string      `json:"s"`
	R      []rawRunner `json:"r"`
}
type rawRunner struct {
	Rid    string `json:"rid"`
	Name   string `json:"na"`
	Status string `json:"s"`
}
type rawResponse struct {
	Data map[string][]rawEvent `json:"data"`
}

// sportNames maps known Betfair sport ids to display names. Unknown ids fall
// back to "Sport <id>".
var sportNames = map[string]string{
	"1": "Soccer", "2": "Tennis", "4": "Cricket", "7": "Horse Racing",
	"4339": "Greyhound", "7522": "Basketball", "11": "Election",
}

func sportName(id string) string {
	if n, ok := sportNames[id]; ok {
		return n
	}
	return "Sport " + id
}

// normalize converts the upstream JSON into our Snapshot, deduplicating sports
// and series. THIS is the swap point: a new provider only needs a new normalize.
func normalize(body []byte) (*Snapshot, error) {
	var raw rawResponse
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("decode feed: %w", err)
	}
	sportSet := map[string]Sport{}
	seriesSet := map[string]Series{}
	var matches []Match

	for sportKey, events := range raw.Data {
		for _, e := range events {
			sid := sportKey
			if e.Si.String() != "" {
				sid = e.Si.String()
			}
			sportSet[sid] = Sport{ID: sid, Name: sportName(sid)}
			if e.Li != "" {
				seriesSet[e.Li] = Series{ID: e.Li, SportID: sid, Name: e.Le}
			}
			markets := make([]Market, 0, len(e.Odds))
			for _, o := range e.Odds {
				runners := make([]Runner, 0, len(o.R))
				for _, r := range o.R {
					runners = append(runners, Runner{ID: r.Rid, Name: r.Name, Status: r.Status})
				}
				markets = append(markets, Market{ID: o.Mid, Name: o.Name, Type: o.Type, Status: o.Status, Runners: runners})
			}
			matches = append(matches, Match{
				ID: e.EID, SportID: sid, SeriesID: e.Li, Name: e.Name,
				StartTime: e.St, InPlay: e.IP, Markets: markets,
			})
		}
	}

	snap := &Snapshot{
		Sports:  mapValues(sportSet),
		Series:  mapValuesSeries(seriesSet),
		Matches: matches,
	}
	sort.Slice(snap.Sports, func(i, j int) bool { return snap.Sports[i].Name < snap.Sports[j].Name })
	sort.Slice(snap.Series, func(i, j int) bool { return snap.Series[i].Name < snap.Series[j].Name })
	return snap, nil
}

func mapValues(m map[string]Sport) []Sport {
	out := make([]Sport, 0, len(m))
	for _, v := range m {
		out = append(out, v)
	}
	return out
}
func mapValuesSeries(m map[string]Series) []Series {
	out := make([]Series, 0, len(m))
	for _, v := range m {
		out = append(out, v)
	}
	return out
}

// --- HTTP (Super Duper Admin only; mounted under requireSDA) ---

// Module exposes the feed over HTTP and imports ("activates") feed events into
// our own catalog. It holds a DB handle to mark which feed events are already
// activated and to perform the import.
type Module struct {
	provider Provider
	db       *sqlx.DB
}

// NewModule wires the HTTP handlers to a provider and the catalog DB.
func NewModule(p Provider, db *sqlx.DB) *Module { return &Module{provider: p, db: db} }

// Register mounts the feed routes under requireSDA (real Super Duper Admin only).
func (m *Module) Register(api fiber.Router, requireSDA fiber.Handler) {
	g := api.Group("/feed", requireSDA)
	g.Get("/events", m.events)
	g.Get("/sports", m.sports)
	g.Get("/series", m.series)      // Series Activate page (feed-only, legacy)
	g.Post("/activate", m.activate) // Direct Activate — match + markets (untouched)

	// Streamlined Series/Match Activate: a merged view of the feed AND our own
	// catalog (so manual items show too), with an activate/deactivate toggle.
	g.Get("/series-list", m.seriesList)
	g.Get("/match-list", m.matchList)
	g.Post("/toggle-series", m.toggleSeries)
	g.Post("/toggle-match", m.toggleMatch)
}

// CatalogRow is one row of the merged (feed + our catalog) activate views.
type CatalogRow struct {
	FeedID     string `json:"feedId"`  // feed id ("" = manual/local-only)
	LocalID    int64  `json:"localId"` // our row id (0 = not in our catalog)
	Name       string `json:"name"`
	Active     bool   `json:"active"`
	SeriesName string `json:"seriesName,omitempty"`
	StartTime  string `json:"startTime,omitempty"`
	InPlay     bool   `json:"inPlay,omitempty"`
}

func (m *Module) seriesList(c *fiber.Ctx) error {
	sportID := c.Query("sportId")
	sid, _ := strconv.ParseInt(sportID, 10, 64)

	// Feed series for this sport (best-effort: feed may be down).
	var feed []Series
	if snap, err := m.provider.Events(c.Context()); err == nil {
		for _, s := range snap.Series {
			if s.SportID == sportID {
				feed = append(feed, s)
			}
		}
	}
	// Our catalog series for this sport (manual + already-activated).
	var dbRows []struct {
		ID     int64   `db:"id"`
		Name   string  `db:"name"`
		FeedID *string `db:"feed_id"`
		Active bool    `db:"active"`
	}
	_ = m.db.SelectContext(c.Context(), &dbRows, `SELECT id, name, feed_id, active FROM series WHERE sport_id = ?`, sid)

	byFeed := map[string]int{} // feed_id → index into dbRows
	for i, d := range dbRows {
		if d.FeedID != nil && *d.FeedID != "" {
			byFeed[*d.FeedID] = i
		}
	}
	rows := make([]CatalogRow, 0, len(feed)+len(dbRows))
	usedDB := map[int64]bool{}
	for _, f := range feed {
		row := CatalogRow{FeedID: f.ID, Name: f.Name}
		if idx, ok := byFeed[f.ID]; ok {
			d := dbRows[idx]
			row.LocalID, row.Active = d.ID, d.Active
			usedDB[d.ID] = true
		}
		rows = append(rows, row)
	}
	for _, d := range dbRows { // manual / activated-but-not-in-current-feed
		if usedDB[d.ID] {
			continue
		}
		fid := ""
		if d.FeedID != nil {
			fid = *d.FeedID
		}
		rows = append(rows, CatalogRow{FeedID: fid, LocalID: d.ID, Name: d.Name, Active: d.Active})
	}
	return httpx.OK(c, rows)
}

func (m *Module) matchList(c *fiber.Ctx) error {
	sportID := c.Query("sportId")
	sid, _ := strconv.ParseInt(sportID, 10, 64)

	feedSeriesName := map[string]string{}
	var feed []Match
	if snap, err := m.provider.Events(c.Context()); err == nil {
		for _, s := range snap.Series {
			feedSeriesName[s.ID] = s.Name
		}
		for _, mt := range snap.Matches {
			if mt.SportID == sportID {
				feed = append(feed, mt)
			}
		}
	}
	var dbRows []struct {
		ID        int64      `db:"id"`
		Name      string     `db:"name"`
		FeedID    *string    `db:"feed_id"`
		Active    bool       `db:"active"`
		SeriesNm  *string    `db:"series_name"`
		StartTime *time.Time `db:"start_time"`
	}
	_ = m.db.SelectContext(c.Context(), &dbRows, `
		SELECT mt.id, mt.name, mt.feed_id, mt.active, s.name AS series_name, mt.start_time
		  FROM matches mt LEFT JOIN series s ON s.id = mt.series_id
		 WHERE mt.sport_id = ?`, sid)

	byFeed := map[string]int{}
	for i, d := range dbRows {
		if d.FeedID != nil && *d.FeedID != "" {
			byFeed[*d.FeedID] = i
		}
	}
	rows := make([]CatalogRow, 0, len(feed)+len(dbRows))
	usedDB := map[int64]bool{}
	for _, f := range feed {
		row := CatalogRow{FeedID: f.ID, Name: f.Name, SeriesName: feedSeriesName[f.SeriesID], StartTime: f.StartTime, InPlay: f.InPlay}
		if idx, ok := byFeed[f.ID]; ok {
			d := dbRows[idx]
			row.LocalID, row.Active = d.ID, d.Active
			usedDB[d.ID] = true
		}
		rows = append(rows, row)
	}
	for _, d := range dbRows {
		if usedDB[d.ID] {
			continue
		}
		fid := ""
		if d.FeedID != nil {
			fid = *d.FeedID
		}
		row := CatalogRow{FeedID: fid, LocalID: d.ID, Name: d.Name, Active: d.Active}
		if d.SeriesNm != nil {
			row.SeriesName = *d.SeriesNm
		}
		if d.StartTime != nil {
			row.StartTime = d.StartTime.Format(time.RFC3339)
		}
		rows = append(rows, row)
	}
	return httpx.OK(c, rows)
}

// toggleSeries activates (import or re-enable) / deactivates a series.
func (m *Module) toggleSeries(c *fiber.Ctx) error {
	var body struct {
		FeedID  string `json:"feedId"`
		LocalID int64  `json:"localId"`
		On      bool   `json:"on"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if !body.On {
		if body.LocalID == 0 {
			return httpx.BadRequest(c, "localId required")
		}
		// Cascade: deactivating a series deactivates its matches and their markets.
		tx, err := m.db.BeginTxx(c.Context(), nil)
		if err != nil {
			return httpx.Internal(c, "tx error")
		}
		defer tx.Rollback() //nolint:errcheck
		_, _ = tx.ExecContext(c.Context(), `UPDATE series SET active = 0 WHERE id = ?`, body.LocalID)
		_, _ = tx.ExecContext(c.Context(),
			`UPDATE markets SET active = 0 WHERE match_id IN (SELECT id FROM matches WHERE series_id = ?)`, body.LocalID)
		_, _ = tx.ExecContext(c.Context(), `UPDATE matches SET active = 0 WHERE series_id = ?`, body.LocalID)
		if err := tx.Commit(); err != nil {
			return httpx.Internal(c, "commit error")
		}
		return httpx.OK(c, fiber.Map{"active": false})
	}
	if body.LocalID != 0 { // re-enable existing
		_, _ = m.db.ExecContext(c.Context(), `UPDATE series SET active = 1 WHERE id = ?`, body.LocalID)
		return httpx.OK(c, fiber.Map{"active": true})
	}
	if body.FeedID == "" {
		return httpx.BadRequest(c, "feedId required to import")
	}
	snap, err := m.provider.Events(c.Context())
	if err != nil {
		return httpx.Err(c, fiber.StatusBadGateway, "feed unavailable")
	}
	for i := range snap.Series {
		if snap.Series[i].ID == body.FeedID {
			id, e := m.importSeries(c.Context(), snap.Series[i].SportID, snap.Series[i].ID, snap.Series[i].Name)
			if e != nil {
				return httpx.Internal(c, "failed to activate series")
			}
			return httpx.Created(c, fiber.Map{"seriesId": id, "active": true})
		}
	}
	return httpx.NotFound(c, "series not found in feed")
}

// toggleMatch activates (import match-only or re-enable) / deactivates a match.
func (m *Module) toggleMatch(c *fiber.Ctx) error {
	var body struct {
		FeedID  string `json:"feedId"`
		LocalID int64  `json:"localId"`
		On      bool   `json:"on"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if !body.On {
		if body.LocalID == 0 {
			return httpx.BadRequest(c, "localId required")
		}
		// Cascade: deactivating a match deactivates its markets too.
		tx, err := m.db.BeginTxx(c.Context(), nil)
		if err != nil {
			return httpx.Internal(c, "tx error")
		}
		defer tx.Rollback() //nolint:errcheck
		_, _ = tx.ExecContext(c.Context(), `UPDATE markets SET active = 0 WHERE match_id = ?`, body.LocalID)
		_, _ = tx.ExecContext(c.Context(), `UPDATE matches SET active = 0 WHERE id = ?`, body.LocalID)
		if err := tx.Commit(); err != nil {
			return httpx.Internal(c, "commit error")
		}
		return httpx.OK(c, fiber.Map{"active": false})
	}
	if body.LocalID != 0 {
		_, _ = m.db.ExecContext(c.Context(), `UPDATE matches SET active = 1 WHERE id = ?`, body.LocalID)
		return httpx.OK(c, fiber.Map{"active": true})
	}
	if body.FeedID == "" {
		return httpx.BadRequest(c, "feedId required to import")
	}
	snap, err := m.provider.Events(c.Context())
	if err != nil {
		return httpx.Err(c, fiber.StatusBadGateway, "feed unavailable")
	}
	for i := range snap.Matches {
		if snap.Matches[i].ID == body.FeedID {
			id, e := m.importMatch(c.Context(), snap, &snap.Matches[i], false) // match only
			if e != nil {
				return httpx.Internal(c, "failed to activate match")
			}
			return httpx.Created(c, fiber.Map{"matchId": id, "active": true})
		}
	}
	return httpx.NotFound(c, "event not found in feed")
}

// series returns the feed's series for a sport, each flagged activated if it is
// already in our catalog (by feed_id). Powers the Series Activate page.
func (m *Module) series(c *fiber.Ctx) error {
	snap, err := m.provider.Events(c.Context())
	if err != nil {
		return httpx.Err(c, fiber.StatusBadGateway, "all feeds unavailable")
	}
	out := snap.Series
	if sid := c.Query("sportId"); sid != "" {
		out = out[:0]
		for _, s := range snap.Series {
			if s.SportID == sid {
				out = append(out, s)
			}
		}
	}
	m.annotateSeries(c.Context(), out)
	return httpx.OK(c, out)
}

func (m *Module) events(c *fiber.Ctx) error {
	snap, err := m.provider.Events(c.Context())
	if err != nil {
		return httpx.Err(c, fiber.StatusBadGateway, "all feeds unavailable")
	}
	// Optional ?sportId= filter for the Activate-Matches drill-down.
	if sid := c.Query("sportId"); sid != "" {
		filtered := make([]Match, 0)
		for _, mt := range snap.Matches {
			if mt.SportID == sid {
				filtered = append(filtered, mt)
			}
		}
		snap.Matches = filtered
	}
	m.annotate(c.Context(), snap) // flag already-activated matches
	return httpx.OK(c, snap)
}

func (m *Module) sports(c *fiber.Ctx) error {
	snap, err := m.provider.Events(c.Context())
	if err != nil {
		return httpx.Err(c, fiber.StatusBadGateway, "all feeds unavailable")
	}
	return httpx.OK(c, snap.Sports)
}

// annotate flags each feed match that is already in our catalog (by feed_id) and
// attaches our local match id so the GUI can show "Activated" + drive F/B/T.
func (m *Module) annotate(ctx context.Context, snap *Snapshot) {
	if len(snap.Matches) == 0 {
		return
	}
	eids := make([]string, 0, len(snap.Matches))
	for _, mt := range snap.Matches {
		eids = append(eids, mt.ID)
	}
	q, args, err := sqlx.In(`SELECT feed_id, id FROM matches WHERE feed_id IN (?)`, eids)
	if err != nil {
		return
	}
	rows, err := m.db.QueryContext(ctx, m.db.Rebind(q), args...)
	if err != nil {
		return
	}
	defer rows.Close()
	local := map[string]int64{}
	for rows.Next() {
		var fid string
		var id int64
		if rows.Scan(&fid, &id) == nil {
			local[fid] = id
		}
	}
	for i := range snap.Matches {
		if id, ok := local[snap.Matches[i].ID]; ok {
			snap.Matches[i].Activated = true
			snap.Matches[i].LocalID = id
		}
	}
}

// annotateSeries flags each feed series already in our catalog (by feed_id).
func (m *Module) annotateSeries(ctx context.Context, list []Series) {
	if len(list) == 0 {
		return
	}
	ids := make([]string, 0, len(list))
	for _, s := range list {
		ids = append(ids, s.ID)
	}
	q, args, err := sqlx.In(`SELECT feed_id, id FROM series WHERE feed_id IN (?)`, ids)
	if err != nil {
		return
	}
	rows, err := m.db.QueryContext(ctx, m.db.Rebind(q), args...)
	if err != nil {
		return
	}
	defer rows.Close()
	local := map[string]int64{}
	for rows.Next() {
		var fid string
		var id int64
		if rows.Scan(&fid, &id) == nil {
			local[fid] = id
		}
	}
	for i := range list {
		if id, ok := local[list[i].ID]; ok {
			list[i].Activated = true
			list[i].LocalID = id
		}
	}
}

// activate imports a feed event (its sport, series, match, markets and runners)
// into our catalog. Idempotent: a re-activate returns the existing match id.
func (m *Module) activate(c *fiber.Ctx) error {
	var body struct {
		EID string `json:"eid"`
	}
	if err := c.BodyParser(&body); err != nil || body.EID == "" {
		return httpx.BadRequest(c, "eid is required")
	}
	snap, err := m.provider.Events(c.Context())
	if err != nil {
		return httpx.Err(c, fiber.StatusBadGateway, "feed unavailable")
	}
	var match *Match
	for i := range snap.Matches {
		if snap.Matches[i].ID == body.EID {
			match = &snap.Matches[i]
			break
		}
	}
	if match == nil {
		return httpx.NotFound(c, "event not found in feed")
	}
	id, err := m.importMatch(c.Context(), snap, match, true)
	if err != nil {
		return httpx.Internal(c, "failed to activate: "+err.Error())
	}
	return httpx.Created(c, fiber.Map{"matchId": id, "activated": true})
}

// activateSeries imports a feed series (and its sport) into our catalog — series
// only, no matches. Idempotent.
func (m *Module) activateSeries(c *fiber.Ctx) error {
	var body struct {
		SeriesID string `json:"seriesId"`
	}
	if err := c.BodyParser(&body); err != nil || body.SeriesID == "" {
		return httpx.BadRequest(c, "seriesId is required")
	}
	snap, err := m.provider.Events(c.Context())
	if err != nil {
		return httpx.Err(c, fiber.StatusBadGateway, "feed unavailable")
	}
	var s *Series
	for i := range snap.Series {
		if snap.Series[i].ID == body.SeriesID {
			s = &snap.Series[i]
			break
		}
	}
	if s == nil {
		return httpx.NotFound(c, "series not found in feed")
	}
	id, err := m.importSeries(c.Context(), s.SportID, s.ID, s.Name)
	if err != nil {
		return httpx.Internal(c, "failed to activate series: "+err.Error())
	}
	return httpx.Created(c, fiber.Map{"seriesId": id, "activated": true})
}

// activateMatch imports a feed event as a MATCH ONLY (no markets) — Match Odds /
// other markets are fetched on demand later. Idempotent.
func (m *Module) activateMatch(c *fiber.Ctx) error {
	var body struct {
		EID string `json:"eid"`
	}
	if err := c.BodyParser(&body); err != nil || body.EID == "" {
		return httpx.BadRequest(c, "eid is required")
	}
	snap, err := m.provider.Events(c.Context())
	if err != nil {
		return httpx.Err(c, fiber.StatusBadGateway, "feed unavailable")
	}
	var match *Match
	for i := range snap.Matches {
		if snap.Matches[i].ID == body.EID {
			match = &snap.Matches[i]
			break
		}
	}
	if match == nil {
		return httpx.NotFound(c, "event not found in feed")
	}
	id, err := m.importMatch(c.Context(), snap, match, false) // no markets
	if err != nil {
		return httpx.Internal(c, "failed to activate match: "+err.Error())
	}
	return httpx.Created(c, fiber.Map{"matchId": id, "activated": true})
}

// importSeries upserts a feed series (and its sport). Returns the series id.
func (m *Module) importSeries(ctx context.Context, sportIDStr, seriesID, name string) (int64, error) {
	var existing int64
	_ = m.db.GetContext(ctx, &existing, `SELECT id FROM series WHERE feed_id = ? LIMIT 1`, seriesID)
	if existing != 0 {
		return existing, nil
	}
	sportID, _ := strconv.ParseInt(sportIDStr, 10, 64)
	if sportID != 0 {
		_, _ = m.db.ExecContext(ctx,
			`INSERT INTO sports (id, name, active, is_betfair) VALUES (?,?,1,1) ON DUPLICATE KEY UPDATE name = name`,
			sportID, sportName(sportIDStr))
	}
	res, err := m.db.ExecContext(ctx,
		`INSERT INTO series (sport_id, name, is_manual, active, feed_id) VALUES (?,?,0,1,?)`,
		sportID, name, seriesID)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (m *Module) importMatch(ctx context.Context, snap *Snapshot, mt *Match, withMarkets bool) (int64, error) {
	var existing int64
	_ = m.db.GetContext(ctx, &existing, `SELECT id FROM matches WHERE feed_id = ? LIMIT 1`, mt.ID)
	if existing != 0 {
		return existing, nil
	}
	tx, err := m.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback() //nolint:errcheck

	sportID, _ := strconv.ParseInt(mt.SportID, 10, 64)
	if sportID != 0 {
		_, _ = tx.ExecContext(ctx,
			`INSERT INTO sports (id, name, active, is_betfair) VALUES (?,?,1,1) ON DUPLICATE KEY UPDATE name = name`,
			sportID, sportName(mt.SportID))
	}

	var seriesID *int64
	if mt.SeriesID != "" {
		var sid int64
		if err := tx.GetContext(ctx, &sid, `SELECT id FROM series WHERE feed_id = ? LIMIT 1`, mt.SeriesID); err != nil {
			name := mt.SeriesID
			for _, s := range snap.Series {
				if s.ID == mt.SeriesID {
					name = s.Name
					break
				}
			}
			res, e := tx.ExecContext(ctx,
				`INSERT INTO series (sport_id, name, is_manual, active, feed_id) VALUES (?,?,0,1,?)`,
				sportID, name, mt.SeriesID)
			if e != nil {
				return 0, e
			}
			sid, _ = res.LastInsertId()
		}
		seriesID = &sid
	}

	res, err := tx.ExecContext(ctx,
		`INSERT INTO matches (sport_id, name, series_id, start_time, status, active, feed_id)
		 VALUES (?,?,?,COALESCE(?,CURRENT_TIMESTAMP),'OPEN',1,?)`,
		sportID, mt.Name, seriesID, isoToMySQL(mt.StartTime), mt.ID)
	if err != nil {
		return 0, err
	}
	matchID, _ := res.LastInsertId()

	if withMarkets {
		for _, mk := range mt.Markets {
			mres, e := tx.ExecContext(ctx,
				`INSERT INTO markets (match_id, market_id, name, category, is_manual, active, feed_id) VALUES (?,?,?,?,0,1,?)`,
				matchID, mk.ID, mk.Name, marketCategory(mk.Type), mk.ID)
			if e != nil {
				return 0, e
			}
			mrid, _ := mres.LastInsertId()
			for i, r := range mk.Runners {
				if _, e := tx.ExecContext(ctx,
					`INSERT INTO runners (market_row_id, selection_id, name, sort_order) VALUES (?,?,?,?)`,
					mrid, r.ID, r.Name, i+1); e != nil {
					return 0, e
				}
			}
		}
	}
	return matchID, tx.Commit()
}

// isoToMySQL turns "2026-06-27T18:00:00.000Z" into "2026-06-27 18:00:00" (nil if blank).
func isoToMySQL(iso string) any {
	if len(iso) < 19 {
		return nil
	}
	return strings.Replace(iso[:19], "T", " ", 1)
}

// marketCategory maps the feed market type to our market category.
func marketCategory(ty string) string {
	switch ty {
	case "match-odd", "match_odd", "match-odds":
		return "match"
	case "goals", "over-under", "line":
		return "line"
	case "":
		return "default"
	default:
		return ty
	}
}
