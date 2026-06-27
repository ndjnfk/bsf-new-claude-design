// Package restrictions owns per-user betting restrictions surfaced on the
// clients list: Sport Block (SB), Sport Limit (SL) and Poker Block (PB).
package restrictions

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/httpx"
)

// SportLimit is the per-user, per-sport, per-market-type betting limit set (doc
// clients-list "SL"). Type is one of TOSS / MARKET / FANCY / BOOKMAKER.
type SportLimit struct {
	UserID            int64   `db:"user_id" json:"userId"`
	SportID           int64   `db:"sport_id" json:"sportId"`
	Type              string  `db:"type" json:"type"`
	MinStake          float64 `db:"min_stake" json:"minStake"`
	MaxStake          float64 `db:"max_stake" json:"maxStake"`
	MaxProfit         float64 `db:"max_profit" json:"maxProfit"`
	BetDelay          int     `db:"bet_delay" json:"betDelay"`
	MarketVolume      float64 `db:"market_volume" json:"marketVolume"`
	MaxMarketExposure float64 `db:"max_market_exposure" json:"maxMarketExposure"`
	LayDiff           float64 `db:"lay_diff" json:"layDiff"`
}

// Module is the restrictions module.
type Module struct{ db *sqlx.DB }

// New builds the restrictions module.
func New(db *sqlx.DB) *Module { return &Module{db: db} }

// Register mounts restriction routes (downline-scoped; any management tier).
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/restrictions", requireAuth)
	g.Get("/blocked-sports", m.getBlockedSports)
	g.Post("/blocked-sports", m.setBlockedSports)
	g.Get("/sport-limits", m.getSportLimits)
	g.Post("/sport-limits", m.setSportLimit)
	g.Get("/poker-block", m.getPokerBlock)
	g.Post("/poker-block", m.setPokerBlock)
}

// --- Sport Block ---

func (m *Module) getBlockedSports(c *fiber.Ctx) error {
	var ids []int64
	if err := m.db.SelectContext(c.Context(), &ids,
		`SELECT sport_id FROM blocked_sports WHERE user_id = ?`, c.QueryInt("userId")); err != nil {
		return httpx.Internal(c, "failed to load blocked sports")
	}
	if ids == nil {
		ids = []int64{}
	}
	return httpx.OK(c, ids)
}

func (m *Module) setBlockedSports(c *fiber.Ctx) error {
	var body struct {
		UserID   int64   `json:"userId"`
		SportIDs []int64 `json:"sportIds"`
	}
	if err := c.BodyParser(&body); err != nil || body.UserID == 0 {
		return httpx.BadRequest(c, "userId is required")
	}
	tx, err := m.db.BeginTxx(c.Context(), nil)
	if err != nil {
		return httpx.Internal(c, "tx error")
	}
	defer tx.Rollback() //nolint:errcheck
	if _, err := tx.ExecContext(c.Context(), `DELETE FROM blocked_sports WHERE user_id = ?`, body.UserID); err != nil {
		return httpx.Internal(c, "failed to clear")
	}
	for _, sid := range body.SportIDs {
		if _, err := tx.ExecContext(c.Context(),
			`INSERT INTO blocked_sports (user_id, sport_id) VALUES (?,?)`, body.UserID, sid); err != nil {
			return httpx.Internal(c, "failed to set")
		}
	}
	if err := tx.Commit(); err != nil {
		return httpx.Internal(c, "commit error")
	}
	return httpx.OK(c, fiber.Map{"saved": true})
}

// --- Sport Limit ---

func (m *Module) getSportLimits(c *fiber.Ctx) error {
	var rows []SportLimit
	if err := m.db.SelectContext(c.Context(), &rows,
		`SELECT user_id, sport_id, type, min_stake, max_stake, max_profit, bet_delay,
		        market_volume, max_market_exposure, lay_diff
		   FROM sport_limits WHERE user_id = ?`, c.QueryInt("userId")); err != nil {
		return httpx.Internal(c, "failed to load sport limits")
	}
	return httpx.OK(c, rows)
}

func (m *Module) setSportLimit(c *fiber.Ctx) error {
	var b SportLimit
	if err := c.BodyParser(&b); err != nil || b.UserID == 0 || b.SportID == 0 {
		return httpx.BadRequest(c, "userId and sportId are required")
	}
	if b.Type == "" {
		b.Type = "MARKET"
	}
	_, err := m.db.ExecContext(c.Context(), `
		INSERT INTO sport_limits (user_id, sport_id, type, min_stake, max_stake, max_profit, bet_delay, market_volume, max_market_exposure, lay_diff)
		VALUES (?,?,?,?,?,?,?,?,?,?)
		ON DUPLICATE KEY UPDATE min_stake=VALUES(min_stake), max_stake=VALUES(max_stake), max_profit=VALUES(max_profit),
		  bet_delay=VALUES(bet_delay), market_volume=VALUES(market_volume), max_market_exposure=VALUES(max_market_exposure), lay_diff=VALUES(lay_diff)`,
		b.UserID, b.SportID, b.Type, b.MinStake, b.MaxStake, b.MaxProfit, b.BetDelay, b.MarketVolume, b.MaxMarketExposure, b.LayDiff)
	if err != nil {
		return httpx.Internal(c, "failed to save sport limit")
	}
	return httpx.OK(c, fiber.Map{"saved": true})
}

// --- Poker Block ---

func (m *Module) getPokerBlock(c *fiber.Ctx) error {
	var blocked bool
	_ = m.db.GetContext(c.Context(), &blocked,
		`SELECT blocked FROM blocked_poker WHERE user_id = ?`, c.QueryInt("userId"))
	return httpx.OK(c, fiber.Map{"blocked": blocked})
}

func (m *Module) setPokerBlock(c *fiber.Ctx) error {
	var body struct {
		UserID  int64 `json:"userId"`
		Blocked bool  `json:"blocked"`
	}
	if err := c.BodyParser(&body); err != nil || body.UserID == 0 {
		return httpx.BadRequest(c, "userId is required")
	}
	_, err := m.db.ExecContext(c.Context(), `
		INSERT INTO blocked_poker (user_id, blocked) VALUES (?,?)
		ON DUPLICATE KEY UPDATE blocked = VALUES(blocked)`, body.UserID, body.Blocked)
	if err != nil {
		return httpx.Internal(c, "failed to save poker block")
	}
	return httpx.OK(c, fiber.Map{"blocked": body.Blocked})
}
