package userpanel

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"bsf2020/internal/catalog"
	"bsf2020/pkg/middleware"
)

// sportRow is the slice of the `sports` catalog table the User Panel needs.
type sportRow struct {
	ID     int64  `db:"id"`
	Name   string `db:"name"`
	Active bool   `db:"active"`
}

// visibleActiveSports loads active sports and drops any sport blocked by a panel
// above the caller (the parent block cascade). A bettor must not see a sport an
// upline has blocked — mirroring the legacy Adonis SportsController, which hid
// sports blocked by the user's parents while keeping the rest visible.
func (m *Module) visibleActiveSports(c *fiber.Ctx) ([]fiber.Map, error) {
	var rows []sportRow
	if err := m.db.SelectContext(c.Context(), &rows,
		`SELECT id, name, active FROM sports WHERE active = 1 ORDER BY name ASC`); err != nil {
		return nil, err
	}
	blocked, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, middleware.User(c).UserID, catalog.Sport)
	out := make([]fiber.Map, 0, len(rows))
	for _, s := range rows {
		if blocked[strconv.FormatInt(s.ID, 10)] {
			continue
		}
		out = append(out, fiber.Map{"id": s.ID, "name": s.Name, "is_active": s.Active})
	}
	return out, nil
}

// sports serves GET /api/user/sports — the active sports the bettor may bet on,
// already filtered by the parent block cascade.
func (m *Module) sports(c *fiber.Ctx) error {
	data, err := m.visibleActiveSports(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load sports"})
	}
	// message stays null: this is a background fetch, so the client must not pop a
	// success toast for it (the axios interceptor toasts any status:true + message).
	return c.JSON(fiber.Map{
		"status":  true,
		"message": nil,
		"data":    data,
	})
}

// matchRow is the dashboard match shape. The JSON tags reproduce the legacy
// Adonis DashboardController response exactly, because the React user panel reads
// those field names (matchid, marketid, sportid, matchName, …) and, crucially,
// drops any row without a `marketid` (see useMatchDashboard.ts).
type matchRow struct {
	MatchID    int64     `db:"matchid" json:"matchid"`
	MarketID   *string   `db:"marketid" json:"marketid"`
	SportID    int64     `db:"sportid" json:"sportid"`
	SportName  string    `db:"sportname" json:"sportname"`
	MatchName  string    `db:"matchName" json:"matchName"`
	SeriesID   *int64    `db:"series_id" json:"-"`
	SeriesName *string   `db:"series_name" json:"series_name"`
	MstDate    time.Time `db:"MstDate" json:"MstDate"`
	RunnerJSON *string   `db:"runner_json" json:"runner_json"`

	// Display fields the card reads but that aren't part of the base query.
	// Live odds / inplay / fav are layered on by the socket on the client; bet
	// counts default to 0 here (the panel renders them as-is).
	HasBookmaker int  `db:"-" json:"has_bookmaker"`
	IsFancy      int  `db:"-" json:"isfancy"`
	MatchBets    int  `db:"-" json:"match_bets_count"`
	SessionBets  int  `db:"-" json:"session_bets_count"`
	InPlay       bool `db:"-" json:"inPlay"`
}

// dashboard serves GET /api/user/dashboard[?sport_id=N] — the bettor's live match
// list for a sport (all sports when sport_id is omitted/0). This returns MATCHES,
// not the sports list. Matches the parent block cascade hides (a blocked match,
// or a match whose sport/series an upline blocked) are dropped from the response,
// mirroring the legacy Adonis DashboardController.index.
func (m *Module) dashboard(c *fiber.Ctx) error {
	sportID := c.QueryInt("sport_id", 0)

	// Only live, bettable fixtures: active, not self-blocked, not yet settled,
	// under an active sport. marketid is the match's primary market code (prefer
	// "Match Odds", else any market) — the panel needs it to render the row and
	// to join the live-odds socket room. runner_json carries that market's runners.
	q := `SELECT
	        m.id         AS matchid,
	        m.sport_id   AS sportid,
	        m.name       AS matchName,
	        m.start_time AS MstDate,
	        m.series_id  AS series_id,
	        s.name       AS sportname,
	        se.name      AS series_name,
	        (SELECT mk.market_id FROM markets mk
	           WHERE mk.match_id = m.id
	           ORDER BY (mk.name = 'Match Odds') DESC, mk.is_published DESC, mk.id ASC
	           LIMIT 1) AS marketid,
	        (SELECT JSON_ARRAYAGG(JSON_OBJECT('selectionId', r.selection_id, 'runnerName', r.name))
	           FROM runners r
	           JOIN markets mk2 ON mk2.id = r.market_row_id
	          WHERE mk2.match_id = m.id AND mk2.name = 'Match Odds') AS runner_json
	      FROM matches m
	      JOIN sports s ON s.id = m.sport_id
	      LEFT JOIN series se ON se.id = m.series_id
	     WHERE m.active = 1 AND m.blocked = 0 AND m.status <> 'SETTLED' AND s.active = 1`
	var args []any
	if sportID > 0 {
		q += ` AND m.sport_id = ?`
		args = append(args, sportID)
	}
	q += ` ORDER BY m.start_time ASC LIMIT 200`

	var rows []matchRow
	if err := m.db.SelectContext(c.Context(), &rows, q, args...); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load matches"})
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": nil,
		"data":    m.visibleMatches(c, rows),
	})
}

// visibleMatches drops any match blocked by a panel above the caller — the match
// itself, or its parent sport/series. The caller's own blocks are not applied
// (AncestorBlockedIDs only walks STRICT ancestors).
func (m *Module) visibleMatches(c *fiber.Ctx, rows []matchRow) []matchRow {
	uid := middleware.User(c).UserID
	bMatch, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Match)
	bSport, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Sport)
	bSeries, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Series)
	out := make([]matchRow, 0, len(rows))
	for _, mt := range rows {
		if bMatch[strconv.FormatInt(mt.MatchID, 10)] || bSport[strconv.FormatInt(mt.SportID, 10)] {
			continue
		}
		if mt.SeriesID != nil && bSeries[strconv.FormatInt(*mt.SeriesID, 10)] {
			continue
		}
		out = append(out, mt)
	}
	return out
}
