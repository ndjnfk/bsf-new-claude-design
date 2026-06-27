// Package fancy owns fancy/session markets and their bet limits (doc §27).
package fancy

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// Fancy is a session market with bet limits.
type Fancy struct {
	ID                     int64     `db:"id" json:"id"`
	MatchID                int64     `db:"match_id" json:"matchId"`
	HeadName               string    `db:"head_name" json:"headName"`
	MinStake               float64   `db:"min_stake" json:"minStake"`
	MaxStake               float64   `db:"max_stake" json:"maxStake"`
	MaxSessionLiability    float64   `db:"max_session_liability" json:"maxSessionLiability"`
	MaxSessionBetLiability float64   `db:"max_session_bet_liability" json:"maxSessionBetLiability"`
	Message                *string   `db:"message" json:"message"`
	Status                 string    `db:"status" json:"status"`
	Result                 *string   `db:"result" json:"result"`
	SelectionID            *string   `db:"selection_id" json:"selectionId"`
	IsManual               bool      `db:"is_manual" json:"isManual"`
	CreatedAt              time.Time `db:"created_at" json:"createdAt"`
}

// Module is the fancy module.
type Module struct{ db *sqlx.DB }

// New builds the fancy module.
func New(db *sqlx.DB) *Module { return &Module{db: db} }

// Register mounts fancy routes. Viewing is open to any tier; editing limits and
// declaring results require Super Duper Admin.
func (m *Module) Register(api fiber.Router, requireAuth, requireSDA fiber.Handler) {
	api.Group("/fancy", requireAuth).Get("", m.list)

	a := api.Group("/fancy", requireSDA)
	a.Post("", middleware.RequirePermission("Fancy Activation"), m.create) // add manual fancy
	a.Put("/:id/stake", middleware.RequirePermission("Fancy Activation"), m.updateStake)
	a.Put("/:id/status", middleware.RequirePermission("Fancy Activation"), m.updateStatus)
	a.Post("/:id/declare", middleware.RequirePermission("Fancy Result Declare"), m.declare)
}

// create adds a manual Indian/session fancy runner (doc §"Manage Indian Fancy").
func (m *Module) create(c *fiber.Ctx) error {
	var body struct {
		MatchID     int64  `json:"matchId"`
		HeadName    string `json:"headName"`
		SelectionID string `json:"selectionId"`
	}
	if err := c.BodyParser(&body); err != nil || body.MatchID == 0 || body.HeadName == "" {
		return httpx.BadRequest(c, "matchId and headName are required")
	}
	sel := body.SelectionID
	if sel == "" {
		sel = "M-" + body.HeadName
	}
	res, err := m.db.ExecContext(c.Context(),
		`INSERT INTO fancy (match_id, head_name, selection_id, is_manual, status) VALUES (?,?,?,1,'ACTIVE')`,
		body.MatchID, body.HeadName, sel)
	if err != nil {
		return httpx.Internal(c, "failed to create fancy")
	}
	id, _ := res.LastInsertId()
	return httpx.Created(c, fiber.Map{"id": id})
}

func (m *Module) list(c *fiber.Ctx) error {
	q := `SELECT id, match_id, head_name, min_stake, max_stake, max_session_liability,
	             max_session_bet_liability, message, status, result, selection_id, is_manual, created_at FROM fancy`
	var args []any
	if mid := c.QueryInt("matchId"); mid > 0 {
		q += ` WHERE match_id = ?`
		args = append(args, mid)
	}
	q += ` ORDER BY id`
	var rows []Fancy
	if err := m.db.SelectContext(c.Context(), &rows, q, args...); err != nil {
		return httpx.Internal(c, "failed to load fancy")
	}
	return httpx.OK(c, rows)
}

func (m *Module) updateStake(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		MinStake               float64 `json:"minStake"`
		MaxStake               float64 `json:"maxStake"`
		MaxSessionLiability    float64 `json:"maxSessionLiability"`
		MaxSessionBetLiability float64 `json:"maxSessionBetLiability"`
		Message                string  `json:"message"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	_, err := m.db.ExecContext(c.Context(), `
		UPDATE fancy SET min_stake = ?, max_stake = ?, max_session_liability = ?,
		       max_session_bet_liability = ?, message = ? WHERE id = ?`,
		body.MinStake, body.MaxStake, body.MaxSessionLiability, body.MaxSessionBetLiability,
		nullify(body.Message), id)
	if err != nil {
		return httpx.Internal(c, "failed to update fancy")
	}
	return httpx.OK(c, fiber.Map{"id": id})
}

func (m *Module) updateStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil || body.Status == "" {
		return httpx.BadRequest(c, "status is required")
	}
	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE fancy SET status = ? WHERE id = ?`, body.Status, id); err != nil {
		return httpx.Internal(c, "failed to update status")
	}
	return httpx.OK(c, fiber.Map{"id": id, "status": body.Status})
}

func (m *Module) declare(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Result string `json:"result"`
	}
	if err := c.BodyParser(&body); err != nil || body.Result == "" {
		return httpx.BadRequest(c, "result is required")
	}
	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE fancy SET result = ?, status = 'INACTIVE' WHERE id = ?`, body.Result, id); err != nil {
		return httpx.Internal(c, "failed to declare fancy")
	}
	return httpx.OK(c, fiber.Map{"id": id, "result": body.Result})
}

func nullify(s string) any {
	if s == "" {
		return nil
	}
	return s
}
