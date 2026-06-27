// Package markets owns the markets + runners catalog for a match: Betfair
// markets (Match Odds, Bookmaker, ...) and Line markets, with manual creation,
// activation and publish/unpublish. Powers Manage Betfair Market and Manage
// Session (Line) Fancy.
package markets

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/internal/catalog"
	"bsf2020/internal/odds"
	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// Market is a betting market under a match.
type Market struct {
	ID           int64      `db:"id" json:"id"`
	MatchID      int64      `db:"match_id" json:"matchId"`
	MarketID     string     `db:"market_id" json:"marketId"`
	Name         string     `db:"name" json:"name"`
	Category     string     `db:"category" json:"category"`
	IsManual     bool       `db:"is_manual" json:"isManual"`
	Active       bool       `db:"active" json:"active"`
	IsPublished  bool       `db:"is_published" json:"isPublished"`
	TotalMatched float64    `db:"total_matched" json:"totalMatched"`
	StartTime    *time.Time `db:"start_time" json:"startTime"`
	CreatedAt    time.Time  `db:"created_at" json:"createdAt"`
}

// Runner is a selection within a market.
type Runner struct {
	ID          int64  `db:"id" json:"id"`
	MarketRowID int64  `db:"market_row_id" json:"marketRowId"`
	SelectionID string `db:"selection_id" json:"selectionId"`
	Name        string `db:"name" json:"name"`
	SortOrder   int    `db:"sort_order" json:"sortOrder"`
}

// Module is the markets catalog module.
type Module struct {
	db       *sqlx.DB
	registry *odds.Registry // published-market set the odds publisher streams
}

// New builds the markets module.
func New(db *sqlx.DB, registry *odds.Registry) *Module { return &Module{db: db, registry: registry} }

// Register mounts routes: views open to any tier, mutations SDA-only.
func (m *Module) Register(api fiber.Router, requireAuth, requireSDA fiber.Handler) {
	v := api.Group("/markets", requireAuth)
	v.Get("", m.list)
	v.Get("/match/:matchId/state", m.matchState) // Activate Matches: Publish/F/B/T state
	v.Get("/:id/runners", m.runners)

	a := api.Group("/markets", requireSDA)
	a.Post("", m.create)                                 // create a manual market (+ runners)
	a.Put("/:id/activate", m.activate)                   // activate/deactivate
	a.Put("/:id/publish", m.publish)                     // publish/unpublish data
	a.Post("/match/:matchId/feature", m.toggleFeature)   // Publish Data / Fancy / Bookmaker / Toss toggles
}

// matchState reports which match-level betting features are on (Activate Matches
// page): published data, fancy, bookmaker and toss. Derived from the markets and
// fancy tables so no extra schema is needed.
func (m *Module) matchState(c *fiber.Ctx) error {
	matchID := c.Params("matchId")
	has := func(q string) bool {
		var n int
		_ = m.db.GetContext(c.Context(), &n, q, matchID)
		return n > 0
	}
	return httpx.OK(c, fiber.Map{
		"isPublished":  has(`SELECT COUNT(*) FROM markets WHERE match_id=? AND is_published=1`),
		"hasBookmaker": has(`SELECT COUNT(*) FROM markets WHERE match_id=? AND category='bookmaker'`),
		"hasToss":      has(`SELECT COUNT(*) FROM markets WHERE match_id=? AND category='toss'`),
		"hasFancy":     has(`SELECT COUNT(*) FROM fancy WHERE match_id=?`),
	})
}

// toggleFeature turns a match-level feature on/off (reference publishData /
// activateFancy / addBookmaker(Bookmaker|Toss)).
func (m *Module) toggleFeature(c *fiber.Ctx) error {
	matchID, err := c.ParamsInt("matchId")
	if err != nil {
		return httpx.BadRequest(c, "invalid matchId")
	}
	var body struct {
		Feature string `json:"feature"`
		On      bool   `json:"on"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	id := int64(matchID)
	switch body.Feature {
	case "bookmaker":
		err = m.toggleMarket(c, id, "bookmaker", "Bookmaker", body.On)
	case "toss":
		err = m.toggleMarket(c, id, "toss", "Toss", body.On)
	case "fancy":
		err = m.toggleFancy(c, id, body.On)
	case "publish":
		err = m.togglePublish(c, id, body.On)
	default:
		return httpx.BadRequest(c, "unknown feature")
	}
	if err != nil {
		return httpx.Internal(c, "failed to update feature")
	}
	return httpx.OK(c, fiber.Map{"feature": body.Feature, "on": body.On})
}

// toggleMarket adds/removes a bookmaker or toss market for a match.
func (m *Module) toggleMarket(c *fiber.Ctx, matchID int64, category, name string, on bool) error {
	if !on {
		_, err := m.db.ExecContext(c.Context(), `DELETE FROM markets WHERE match_id=? AND category=?`, matchID, category)
		return err
	}
	var n int
	_ = m.db.GetContext(c.Context(), &n, `SELECT COUNT(*) FROM markets WHERE match_id=? AND category=?`, matchID, category)
	if n > 0 {
		return nil
	}
	_, err := m.db.ExecContext(c.Context(),
		`INSERT INTO markets (match_id, market_id, name, category, is_manual, active) VALUES (?,?,?,?,1,1)`,
		matchID, fmt.Sprintf("%s-%d", category, matchID), name, category)
	return err
}

// toggleFancy adds/removes a manual fancy head for a match.
func (m *Module) toggleFancy(c *fiber.Ctx, matchID int64, on bool) error {
	if !on {
		_, err := m.db.ExecContext(c.Context(), `DELETE FROM fancy WHERE match_id=? AND is_manual=1`, matchID)
		return err
	}
	var n int
	_ = m.db.GetContext(c.Context(), &n, `SELECT COUNT(*) FROM fancy WHERE match_id=?`, matchID)
	if n > 0 {
		return nil
	}
	_, err := m.db.ExecContext(c.Context(),
		`INSERT INTO fancy (match_id, head_name, selection_id, is_manual, status) VALUES (?,?,?,1,'ACTIVE')`,
		matchID, "Fancy", fmt.Sprintf("FANCY-%d", matchID))
	return err
}

// togglePublish publishes/unpublishes the match's markets (a 'main' marker row is
// created if the match has none yet, so publish is meaningful at match level).
func (m *Module) togglePublish(c *fiber.Ctx, matchID int64, on bool) error {
	if !on {
		if _, err := m.db.ExecContext(c.Context(), `UPDATE markets SET is_published=0 WHERE match_id=?`, matchID); err != nil {
			return err
		}
		return m.syncPublished(c, matchID)
	}
	res, err := m.db.ExecContext(c.Context(), `UPDATE markets SET is_published=1 WHERE match_id=?`, matchID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		if _, err = m.db.ExecContext(c.Context(),
			`INSERT INTO markets (match_id, market_id, name, category, is_manual, active, is_published) VALUES (?,?,?,?,1,1,1)`,
			matchID, fmt.Sprintf("MAIN-%d", matchID), "Main", "main"); err != nil {
			return err
		}
	}
	return m.syncPublished(c, matchID)
}

// syncPublished reconciles the Redis published-odds set for a match: published
// markets are added to the stream (with their runner meta cached), unpublished
// ones removed.
func (m *Module) syncPublished(c *fiber.Ctx, matchID int64) error {
	var pub, unpub []string
	_ = m.db.SelectContext(c.Context(), &pub, `SELECT market_id FROM markets WHERE match_id=? AND is_published=1`, matchID)
	_ = m.db.SelectContext(c.Context(), &unpub, `SELECT market_id FROM markets WHERE match_id=? AND is_published=0`, matchID)
	for _, mid := range pub {
		m.cacheMeta(c.Context(), mid)
	}
	_ = m.registry.Add(c.Context(), pub...)
	for _, mid := range unpub {
		_ = m.registry.DelMeta(c.Context(), mid)
	}
	_ = m.registry.Remove(c.Context(), unpub...)
	return nil
}

// cacheMeta stores a market's runners + matchId in Redis (read once here at
// publish time) so the odds publisher never queries MySQL on the hot path.
func (m *Module) cacheMeta(ctx context.Context, marketID string) {
	var row struct {
		ID      int64  `db:"id"`
		MatchID int64  `db:"match_id"`
		Name    string `db:"name"`
	}
	if err := m.db.GetContext(ctx, &row,
		`SELECT id, match_id, name FROM markets WHERE market_id = ? LIMIT 1`, marketID); err != nil {
		return
	}
	var rs []struct {
		SelectionID string `db:"selection_id"`
		Name        string `db:"name"`
	}
	_ = m.db.SelectContext(ctx, &rs,
		`SELECT selection_id, name FROM runners WHERE market_row_id = ? ORDER BY sort_order`, row.ID)
	meta := odds.MarketMeta{MarketID: marketID, MatchID: row.MatchID, Name: row.Name}
	for _, r := range rs {
		meta.Runners = append(meta.Runners, odds.MetaRunner{SelectionID: r.SelectionID, Name: r.Name})
	}
	_ = m.registry.SetMeta(ctx, meta)
}

func (m *Module) list(c *fiber.Ctx) error {
	matchID := c.QueryInt("matchId")
	// Block cascade: if the match (or its sport/series) is blocked by a panel
	// above the caller, expose no markets at all.
	uid := middleware.User(c).UserID
	if m.matchBlocked(c, uid, int64(matchID)) {
		return httpx.OK(c, []Market{})
	}
	q := `SELECT id, match_id, market_id, name, category, is_manual, active, is_published,
	             total_matched, start_time, created_at FROM markets WHERE match_id = ?`
	args := []any{matchID}
	if cat := c.Query("category"); cat != "" {
		q += ` AND category = ?`
		args = append(args, cat)
	}
	q += ` ORDER BY id`
	var rows []Market
	if err := m.db.SelectContext(c.Context(), &rows, q, args...); err != nil {
		return httpx.Internal(c, "failed to load markets")
	}
	// Drop individually-blocked markets (by market_id).
	bMarket, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Market)
	out := make([]Market, 0, len(rows))
	for _, mk := range rows {
		if !bMarket[mk.MarketID] {
			out = append(out, mk)
		}
	}
	return httpx.OK(c, out)
}

// matchBlocked reports whether the match — or its parent series/sport — is
// blocked by any panel above the caller.
func (m *Module) matchBlocked(c *fiber.Ctx, uid, matchID int64) bool {
	if matchID == 0 {
		return false
	}
	var row struct {
		SportID  int64  `db:"sport_id"`
		SeriesID *int64 `db:"series_id"`
	}
	if err := m.db.GetContext(c.Context(), &row,
		`SELECT sport_id, series_id FROM matches WHERE id = ?`, matchID); err != nil {
		return false
	}
	bMatch, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Match)
	if bMatch[strconv.FormatInt(matchID, 10)] {
		return true
	}
	bSport, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Sport)
	if bSport[strconv.FormatInt(row.SportID, 10)] {
		return true
	}
	if row.SeriesID != nil {
		bSeries, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Series)
		if bSeries[strconv.FormatInt(*row.SeriesID, 10)] {
			return true
		}
	}
	return false
}

func (m *Module) runners(c *fiber.Ctx) error {
	var rows []Runner
	err := m.db.SelectContext(c.Context(), &rows,
		`SELECT id, market_row_id, selection_id, name, sort_order
		   FROM runners WHERE market_row_id = ? ORDER BY sort_order`, c.Params("id"))
	if err != nil {
		return httpx.Internal(c, "failed to load runners")
	}
	return httpx.OK(c, rows)
}

func (m *Module) create(c *fiber.Ctx) error {
	var body struct {
		MatchID  int64  `json:"matchId"`
		MarketID string `json:"marketId"`
		Name     string `json:"name"`
		Category string `json:"category"`
		Runners  []struct {
			SelectionID string `json:"selectionId"`
			Name        string `json:"name"`
		} `json:"runners"`
	}
	if err := c.BodyParser(&body); err != nil || body.MatchID == 0 || body.Name == "" {
		return httpx.BadRequest(c, "matchId and name are required")
	}
	if body.Category == "" {
		body.Category = "default"
	}
	if body.MarketID == "" {
		body.MarketID = body.Name
	}
	tx, err := m.db.BeginTxx(c.Context(), nil)
	if err != nil {
		return httpx.Internal(c, "tx error")
	}
	defer tx.Rollback() //nolint:errcheck
	res, err := tx.ExecContext(c.Context(), `
		INSERT INTO markets (match_id, market_id, name, category, is_manual, active)
		VALUES (?,?,?,?,1,1)`, body.MatchID, body.MarketID, body.Name, body.Category)
	if err != nil {
		return httpx.Internal(c, "failed to create market")
	}
	marketRowID, _ := res.LastInsertId()
	for i, r := range body.Runners {
		if r.Name == "" {
			continue
		}
		sel := r.SelectionID
		if sel == "" {
			sel = "M-" + r.Name
		}
		if _, err := tx.ExecContext(c.Context(),
			`INSERT INTO runners (market_row_id, selection_id, name, sort_order) VALUES (?,?,?,?)`,
			marketRowID, sel, r.Name, i+1); err != nil {
			return httpx.Internal(c, "failed to add runner")
		}
	}
	if err := tx.Commit(); err != nil {
		return httpx.Internal(c, "commit error")
	}
	return httpx.Created(c, fiber.Map{"id": marketRowID})
}

func (m *Module) activate(c *fiber.Ctx) error {
	var body struct {
		Active bool `json:"active"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE markets SET active = ? WHERE id = ?`, body.Active, c.Params("id")); err != nil {
		return httpx.Internal(c, "failed to update market")
	}
	return httpx.OK(c, fiber.Map{"active": body.Active})
}

func (m *Module) publish(c *fiber.Ctx) error {
	var body struct {
		Published bool `json:"published"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	id := c.Params("id")
	var marketID string
	_ = m.db.GetContext(c.Context(), &marketID, `SELECT market_id FROM markets WHERE id = ?`, id)
	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE markets SET is_published = ? WHERE id = ?`, body.Published, id); err != nil {
		return httpx.Internal(c, "failed to update market")
	}
	// Add/remove from the Redis stream the odds publisher reads (+ cache meta).
	if marketID != "" {
		if body.Published {
			m.cacheMeta(c.Context(), marketID)
			_ = m.registry.Add(c.Context(), marketID)
		} else {
			_ = m.registry.DelMeta(c.Context(), marketID)
			_ = m.registry.Remove(c.Context(), marketID)
		}
	}
	return httpx.OK(c, fiber.Map{"published": body.Published})
}
