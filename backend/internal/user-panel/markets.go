package userpanel

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"bsf2020/internal/catalog"
	"bsf2020/pkg/middleware"
)

// marketLimit is a caller's effective stake/profit limit for one market type,
// resolved from sport_limits (the nearest ancestor that configured it wins).
type marketLimit struct {
	MinStake  float64
	MaxStake  float64
	MaxProfit float64
	Volume    float64
}

// defaultMarketLimit mirrors the sport_limits column defaults — used when no
// ancestor has set a limit for the sport+type.
var defaultMarketLimit = marketLimit{MinStake: 100, MaxStake: 100000, MaxProfit: 2500000, Volume: 1}

// limitTypeFor maps a market category onto its sport_limits.type bucket
// (mirrors the reference CASE on market.Id/name).
func limitTypeFor(category string) string {
	switch category {
	case "bookmaker":
		return "BOOKMAKER"
	case "toss":
		return "TOSS"
	default:
		return "MARKET"
	}
}

// matchMarkets serves GET /api/user/matches/:id/markets — every active betting
// market for a match, filtered by the parent block cascade (a market or its
// sport blocked by an upline is hidden) and stamped with the caller's resolved
// stake/profit limits. Mirrors the legacy MatchesController.markets.
func (m *Module) matchMarkets(c *fiber.Ctx) error {
	matchID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": false, "message": "invalid match id"})
	}
	uid := middleware.User(c).UserID

	// The match's sport — needed for the sport-block check and the limit lookup.
	var sportID int64
	if err := m.db.GetContext(c.Context(), &sportID,
		`SELECT sport_id FROM matches WHERE id = ?`, matchID); err != nil {
		// Unknown match → empty list (not an error for the panel).
		return c.JSON(fiber.Map{"status": true, "data": []any{}})
	}

	// Parent block cascade: hide a sport or market an upline has blocked.
	bSport, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Sport)
	if bSport[strconv.FormatInt(sportID, 10)] {
		return c.JSON(fiber.Map{"status": true, "data": []any{}})
	}
	bMarket, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Market)

	// Active markets for the match (Player view). Each row carries the match info
	// the panel header needs (name/start time/sport) denormalised, mirroring the
	// legacy markets response. runner_json carries the market's selections; live
	// prices arrive over the socket.
	type marketRow struct {
		MarketID   string    `db:"market_id"`
		Name       string    `db:"name"`
		Category   string    `db:"category"`
		Active     bool      `db:"active"`
		MatchName  string    `db:"match_name"`
		MatchDate  time.Time `db:"match_date"`
		SportName  string    `db:"sport_name"`
		RunnerJSON *string   `db:"runner_json"`
	}
	var rows []marketRow
	if err := m.db.SelectContext(c.Context(), &rows, `
		SELECT mk.market_id, mk.name, mk.category, mk.active,
		       mt.name       AS match_name,
		       mt.start_time AS match_date,
		       s.name        AS sport_name,
		       COALESCE(
		         (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', r.selection_id, 'name', r.name))
		            FROM runners r WHERE r.market_row_id = mk.id AND r.name <> 'The Draw'),
		         (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', r2.selection_id, 'name', r2.name))
		            FROM runners r2
		            JOIN markets mo ON mo.id = r2.market_row_id
		           WHERE mo.match_id = mk.match_id AND mo.name = 'Match Odds' AND r2.name <> 'The Draw')
		       ) AS runner_json
		  FROM markets mk
		  JOIN matches mt ON mt.id = mk.match_id
		  JOIN sports  s  ON s.id  = mt.sport_id
		 WHERE mk.match_id = ? AND mk.active = 1
		 ORDER BY mk.created_at ASC`, matchID); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load markets"})
	}

	limits := m.resolveSportLimits(c, uid, sportID)

	data := make([]fiber.Map, 0, len(rows))
	for _, mk := range rows {
		if bMarket[mk.MarketID] {
			continue
		}
		lim, ok := limits[limitTypeFor(mk.Category)]
		if !ok {
			lim = defaultMarketLimit
		}
		volume := lim.Volume
		if volume <= 0 {
			volume = 1
		}
		var runnerJSON any
		if mk.RunnerJSON != nil {
			runnerJSON = *mk.RunnerJSON
		}
		data = append(data, fiber.Map{
			"marketid":          mk.MarketID,
			"market_name":       mk.Name,
			"min_stack":         lim.MinStake,
			"max_stack":         lim.MaxStake,
			"max_market_profit": lim.MaxProfit,
			"volume":            volume,
			"odds_limit":        0,
			"active":            boolToInt(mk.Active),
			"status":            "",
			"runner_json":       runnerJSON,
			"matchid":           matchID,
			"matchName":         mk.MatchName,
			"MstDate":           mk.MatchDate.Format(time.RFC3339),
			"matchdate":         mk.MatchDate.Format(time.RFC3339),
			"sportname":         mk.SportName,
			"sportid":           sportID,
			"inPlay":            false,
		})
	}

	return c.JSON(fiber.Map{"status": true, "data": data})
}

// resolveSportLimits returns the caller's effective sport_limits per market type
// (MARKET/BOOKMAKER/TOSS) for a sport. It walks the ancestor chain (the caller
// included) and keeps, per type, the value from the NEAREST ancestor that has a
// row — the Go equivalent of the reference's `user_id IN (parents) … ORDER BY
// user_id DESC LIMIT 1` per-type pick.
func (m *Module) resolveSportLimits(c *fiber.Ctx, uid, sportID int64) map[string]marketLimit {
	type limitRow struct {
		Type      string  `db:"type"`
		MinStake  float64 `db:"min_stake"`
		MaxStake  float64 `db:"max_stake"`
		MaxProfit float64 `db:"max_profit"`
		Volume    float64 `db:"market_volume"`
		Depth     int     `db:"depth"`
	}
	var rows []limitRow
	_ = m.db.SelectContext(c.Context(), &rows, `
		WITH RECURSIVE chain (id, depth) AS (
		  SELECT id, 0 FROM users WHERE id = ?
		  UNION ALL
		  SELECT u.parent_id, c.depth + 1
		    FROM users u JOIN chain c ON u.id = c.id
		   WHERE u.parent_id IS NOT NULL
		)
		SELECT sl.type AS type, sl.min_stake, sl.max_stake, sl.max_profit,
		       sl.market_volume, c.depth AS depth
		  FROM sport_limits sl
		  JOIN chain c ON c.id = sl.user_id
		 WHERE sl.sport_id = ?
		 ORDER BY c.depth ASC`, uid, sportID)

	out := make(map[string]marketLimit, 3)
	best := make(map[string]int)
	for _, r := range rows {
		if d, seen := best[r.Type]; seen && d <= r.Depth {
			continue // already have a nearer ancestor for this type
		}
		best[r.Type] = r.Depth
		out[r.Type] = marketLimit{MinStake: r.MinStake, MaxStake: r.MaxStake, MaxProfit: r.MaxProfit, Volume: r.Volume}
	}
	return out
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
