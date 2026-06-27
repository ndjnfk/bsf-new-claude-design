// Package sports owns the catalog: sports, series, matches, markets and results.
package sports

import (
	"context"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/internal/catalog"
	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

func id64(v int64) string { return strconv.FormatInt(v, 10) }

// Sport is a top-level sport (Cricket, Soccer, Tennis...).
type Sport struct {
	ID        int64  `db:"id" json:"id"`
	Name      string `db:"name" json:"name"`
	Active    bool   `db:"active" json:"active"`
	IsBetfair bool   `db:"is_betfair" json:"isBetfair"`
}

// Match is an event under a sport.
type Match struct {
	ID        int64     `db:"id" json:"id"`
	SportID   int64     `db:"sport_id" json:"sportId"`
	Name      string    `db:"name" json:"name"`
	StartTime time.Time `db:"start_time" json:"startTime"`
	Status    string    `db:"status" json:"status"`
	Blocked   bool      `db:"blocked" json:"blocked"`
	Active    bool      `db:"active" json:"active"`
	SeriesID  *int64    `db:"series_id" json:"seriesId"`
}

// Series is a tournament/series under a sport (doc §18).
type Series struct {
	ID       int64  `db:"id" json:"id"`
	SportID  int64  `db:"sport_id" json:"sportId"`
	Name     string `db:"name" json:"name"`
	IsManual bool   `db:"is_manual" json:"isManual"`
	Active   bool   `db:"active" json:"active"`
}

// Result is a declared market result (doc §22).
type Result struct {
	ID            int64     `db:"id" json:"id"`
	MatchID       int64     `db:"match_id" json:"matchId"`
	SportID       int64     `db:"sport_id" json:"sportId"`
	MarketID      string    `db:"market_id" json:"marketId"`
	MarketName    *string   `db:"market_name" json:"marketName"`
	SelectionName *string   `db:"selection_name" json:"selectionName"`
	DeclaredBy    *string   `db:"declared_by" json:"declaredBy"`
	Status        string    `db:"status" json:"status"`
	DeclaredAt    time.Time `db:"declared_at" json:"declaredAt"`
}

// Settler settles a market's bets and distributes P&L. Implemented by the
// settlement engine; declaring a result calls it. Optional (nil = no settlement).
type Settler interface {
	SettleMarket(ctx context.Context, matchID int64, marketID, winning string) (int, error)
}

// Module is the sports catalog module.
type Module struct {
	db      *sqlx.DB
	settler Settler
}

// New builds the sports module.
func New(db *sqlx.DB, settler Settler) *Module { return &Module{db: db, settler: settler} }

// Register mounts sports routes. Views are open to any tier; platform-global
// mutations (block/activate/series/results) require Super Duper Admin.
func (m *Module) Register(api fiber.Router, requireAuth, requireSDA fiber.Handler) {
	// Read-only views (all management tiers).
	v := api.Group("/sports", requireAuth)
	v.Get("", m.listSports)
	v.Get("/matches", m.listMatches)         // Live Matches (doc §3)
	v.Get("/matches/completed", m.completed) // Completed Matches (doc §6)
	v.Get("/series", m.listSeries)           // Manage Series (doc §18)
	v.Get("/results", m.listResults)         // Results list (doc §22)

	// Platform-global mutations (Super Duper Admin only). Helpers acting for an
	// SDA additionally need the matching permission (doc §24).
	const (
		permMatchOnOff = "Match On and Off"
		permManage     = "Active Matches and Manage Series"
		permResult     = "Match Result Declare"
	)
	a := api.Group("/sports", requireSDA)
	a.Put("/:id", middleware.RequirePermission(permMatchOnOff), m.toggleSport)                    // Block Market (doc §8)
	a.Put("/matches/:id/block", middleware.RequirePermission(permMatchOnOff), m.blockMatch)       // block/unblock a match
	a.Post("/matches", middleware.RequirePermission(permManage), m.createMatch)                   // create manual match (§18)
	a.Put("/matches/:id/activate", middleware.RequirePermission(permManage), m.activateMatch)     // activate (§19)
	a.Post("/series", middleware.RequirePermission(permManage), m.createSeries)
	a.Put("/series/:id", middleware.RequirePermission(permManage), m.toggleSeries)
	a.Post("/results", middleware.RequirePermission(permResult), m.declareResult) // declare → settles the match
	a.Post("/results/:id/revoke", middleware.RequirePermission(permResult), m.revokeResult)
}

func (m *Module) listSports(c *fiber.Ctx) error {
	var rows []Sport
	if err := m.db.SelectContext(c.Context(), &rows,
		`SELECT id, name, active, is_betfair FROM sports ORDER BY id`); err != nil {
		return httpx.Internal(c, "failed to load sports")
	}
	// Hide sports blocked by any panel above the caller.
	blocked, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, middleware.User(c).UserID, catalog.Sport)
	out := make([]Sport, 0, len(rows))
	for _, s := range rows {
		if !blocked[id64(s.ID)] {
			out = append(out, s)
		}
	}
	return httpx.OK(c, out)
}

func (m *Module) toggleSport(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Active bool `json:"active"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE sports SET active = ? WHERE id = ?`, body.Active, id); err != nil {
		return httpx.Internal(c, "failed to update sport")
	}
	return httpx.OK(c, fiber.Map{"id": id, "active": body.Active})
}

func (m *Module) listMatches(c *fiber.Ctx) error {
	q := `SELECT id, sport_id, name, start_time, status, blocked, active, series_id FROM matches WHERE 1=1`
	var args []any
	if sid := c.QueryInt("sportId"); sid > 0 {
		q += ` AND sport_id = ?`
		args = append(args, sid)
	}
	if ser := c.QueryInt("seriesId"); ser > 0 {
		q += ` AND series_id = ?`
		args = append(args, ser)
	}
	q += ` ORDER BY start_time ASC LIMIT 200`
	var rows []Match
	if err := m.db.SelectContext(c.Context(), &rows, q, args...); err != nil {
		return httpx.Internal(c, "failed to load matches")
	}
	return httpx.OK(c, m.visibleMatches(c, rows))
}

func (m *Module) completed(c *fiber.Ctx) error {
	var rows []Match
	if err := m.db.SelectContext(c.Context(), &rows,
		`SELECT id, sport_id, name, start_time, status, blocked, active, series_id FROM matches
		   WHERE status = 'SETTLED' ORDER BY start_time DESC LIMIT 200`); err != nil {
		return httpx.Internal(c, "failed to load completed matches")
	}
	return httpx.OK(c, m.visibleMatches(c, rows))
}

// visibleMatches drops matches whose match/series/sport is blocked by any panel
// above the caller (the block cascade).
func (m *Module) visibleMatches(c *fiber.Ctx, rows []Match) []Match {
	uid := middleware.User(c).UserID
	bMatch, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Match)
	bSport, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Sport)
	bSeries, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Series)
	out := make([]Match, 0, len(rows))
	for _, mt := range rows {
		if bMatch[id64(mt.ID)] || bSport[id64(mt.SportID)] {
			continue
		}
		if mt.SeriesID != nil && bSeries[id64(*mt.SeriesID)] {
			continue
		}
		out = append(out, mt)
	}
	return out
}

func (m *Module) listResults(c *fiber.Ctx) error {
	q := `SELECT id, match_id, sport_id, market_id, market_name, selection_name,
	             declared_by, status, declared_at FROM results`
	var args []any
	if sid := c.QueryInt("sportId"); sid > 0 {
		q += ` WHERE sport_id = ?`
		args = append(args, sid)
	}
	q += ` ORDER BY declared_at DESC LIMIT 200`
	var rows []Result
	if err := m.db.SelectContext(c.Context(), &rows, q, args...); err != nil {
		return httpx.Internal(c, "failed to load results")
	}
	return httpx.OK(c, rows)
}

func (m *Module) declareResult(c *fiber.Ctx) error {
	var body struct {
		MatchID       int64  `json:"matchId"`
		SportID       int64  `json:"sportId"`
		MarketID      string `json:"marketId"`
		MarketName    string `json:"marketName"`
		SelectionName string `json:"selectionName"`
	}
	if err := c.BodyParser(&body); err != nil || body.MatchID == 0 || body.SelectionName == "" {
		return httpx.BadRequest(c, "matchId and selectionName are required")
	}
	by := middleware.User(c).Username
	tx, err := m.db.BeginTxx(c.Context(), nil)
	if err != nil {
		return httpx.Internal(c, "tx error")
	}
	defer tx.Rollback() //nolint:errcheck
	if _, err := tx.ExecContext(c.Context(), `
		INSERT INTO results (match_id, sport_id, market_id, market_name, selection_name, declared_by)
		VALUES (?,?,?,?,?,?)`,
		body.MatchID, body.SportID, body.MarketID, body.MarketName, body.SelectionName, by); err != nil {
		return httpx.Internal(c, "failed to declare result")
	}
	if _, err := tx.ExecContext(c.Context(),
		`UPDATE matches SET status = 'SETTLED' WHERE id = ?`, body.MatchID); err != nil {
		return httpx.Internal(c, "failed to settle match")
	}
	if err := tx.Commit(); err != nil {
		return httpx.Internal(c, "commit error")
	}
	// Settle the market's bets and distribute partnership P&L.
	settled := 0
	if m.settler != nil && body.MarketID != "" {
		settled, _ = m.settler.SettleMarket(c.Context(), body.MatchID, body.MarketID, body.SelectionName)
	}
	return httpx.Created(c, fiber.Map{"matchId": body.MatchID, "result": body.SelectionName, "settledBets": settled})
}

func (m *Module) revokeResult(c *fiber.Ctx) error {
	id := c.Params("id")
	tx, err := m.db.BeginTxx(c.Context(), nil)
	if err != nil {
		return httpx.Internal(c, "tx error")
	}
	defer tx.Rollback() //nolint:errcheck
	var matchID int64
	if err := tx.GetContext(c.Context(), &matchID,
		`SELECT match_id FROM results WHERE id = ?`, id); err != nil {
		return httpx.NotFound(c, "result not found")
	}
	if _, err := tx.ExecContext(c.Context(),
		`UPDATE results SET status = 'REVOKED' WHERE id = ?`, id); err != nil {
		return httpx.Internal(c, "failed to revoke")
	}
	if _, err := tx.ExecContext(c.Context(),
		`UPDATE matches SET status = 'OPEN' WHERE id = ?`, matchID); err != nil {
		return httpx.Internal(c, "failed to reopen match")
	}
	if err := tx.Commit(); err != nil {
		return httpx.Internal(c, "commit error")
	}
	return httpx.OK(c, fiber.Map{"id": id, "status": "REVOKED"})
}

func (m *Module) createMatch(c *fiber.Ctx) error {
	var body struct {
		SportID   int64   `json:"sportId"`
		Name      string  `json:"name"`
		SeriesID  *int64  `json:"seriesId"`
		StartTime *string `json:"startTime"`
	}
	if err := c.BodyParser(&body); err != nil || body.SportID == 0 || body.Name == "" {
		return httpx.BadRequest(c, "sportId and name are required")
	}
	var start any
	if body.StartTime != nil && *body.StartTime != "" {
		start = *body.StartTime
	} else {
		start = nil
	}
	q := `INSERT INTO matches (sport_id, name, series_id, start_time, status, active)
	      VALUES (?,?,?,COALESCE(?, CURRENT_TIMESTAMP),'OPEN',1)`
	res, err := m.db.ExecContext(c.Context(), q, body.SportID, body.Name, body.SeriesID, start)
	if err != nil {
		return httpx.Internal(c, "failed to create match")
	}
	id, _ := res.LastInsertId()
	return httpx.Created(c, fiber.Map{"id": id})
}

func (m *Module) activateMatch(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Active bool `json:"active"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE matches SET active = ? WHERE id = ?`, body.Active, id); err != nil {
		return httpx.Internal(c, "failed to activate match")
	}
	return httpx.OK(c, fiber.Map{"id": id, "active": body.Active})
}

func (m *Module) listSeries(c *fiber.Ctx) error {
	q := `SELECT id, sport_id, name, is_manual, active FROM series`
	var args []any
	if sid := c.QueryInt("sportId"); sid > 0 {
		q += ` WHERE sport_id = ?`
		args = append(args, sid)
	}
	q += ` ORDER BY id DESC`
	var rows []Series
	if err := m.db.SelectContext(c.Context(), &rows, q, args...); err != nil {
		return httpx.Internal(c, "failed to load series")
	}
	// Hide series whose series or parent sport is blocked above the caller.
	uid := middleware.User(c).UserID
	bSeries, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Series)
	bSport, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Sport)
	out := make([]Series, 0, len(rows))
	for _, s := range rows {
		if !bSeries[id64(s.ID)] && !bSport[id64(s.SportID)] {
			out = append(out, s)
		}
	}
	return httpx.OK(c, out)
}

func (m *Module) createSeries(c *fiber.Ctx) error {
	var body struct {
		SportID int64  `json:"sportId"`
		Name    string `json:"name"`
	}
	if err := c.BodyParser(&body); err != nil || body.SportID == 0 || body.Name == "" {
		return httpx.BadRequest(c, "sportId and name are required")
	}
	res, err := m.db.ExecContext(c.Context(),
		`INSERT INTO series (sport_id, name, is_manual, active) VALUES (?,?,1,1)`, body.SportID, body.Name)
	if err != nil {
		return httpx.Internal(c, "failed to create series")
	}
	id, _ := res.LastInsertId()
	return httpx.Created(c, fiber.Map{"id": id})
}

func (m *Module) toggleSeries(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Active bool `json:"active"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE series SET active = ? WHERE id = ?`, body.Active, id); err != nil {
		return httpx.Internal(c, "failed to update series")
	}
	return httpx.OK(c, fiber.Map{"id": id, "active": body.Active})
}

func (m *Module) blockMatch(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Blocked bool `json:"blocked"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE matches SET blocked = ? WHERE id = ?`, body.Blocked, id); err != nil {
		return httpx.Internal(c, "failed to update match")
	}
	return httpx.OK(c, fiber.Map{"id": id, "blocked": body.Blocked})
}
