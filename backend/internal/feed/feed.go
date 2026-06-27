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
	g.Post("/activate", m.activate) // import a feed event into our catalog
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
	id, err := m.importMatch(c.Context(), snap, match)
	if err != nil {
		return httpx.Internal(c, "failed to activate: "+err.Error())
	}
	return httpx.Created(c, fiber.Map{"matchId": id, "activated": true})
}

func (m *Module) importMatch(ctx context.Context, snap *Snapshot, mt *Match) (int64, error) {
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
