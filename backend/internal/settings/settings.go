// Package settings owns global market/betting settings (doc §32 — Market Setting).
package settings

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/httpx"
)

// Setting is one key/value configuration row. Value is stored as raw text
// (often JSON, e.g. the default-stakes array).
type Setting struct {
	Key   string `db:"skey" json:"key"`
	Value string `db:"sval" json:"value"`
}

// Module is the settings module.
type Module struct{ db *sqlx.DB }

// New builds the settings module.
func New(db *sqlx.DB) *Module { return &Module{db: db} }

// Register mounts settings routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/settings", requireAuth)
	g.Get("", m.list)
	g.Put("/:key", m.set)
}

func (m *Module) list(c *fiber.Ctx) error {
	var rows []Setting
	if err := m.db.SelectContext(c.Context(), &rows,
		`SELECT skey, sval FROM settings ORDER BY skey`); err != nil {
		return httpx.Internal(c, "failed to load settings")
	}
	return httpx.OK(c, rows)
}

func (m *Module) set(c *fiber.Ctx) error {
	key := c.Params("key")
	var body struct {
		Value string `json:"value"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if _, err := m.db.ExecContext(c.Context(), `
		INSERT INTO settings (skey, sval) VALUES (?, ?)
		ON DUPLICATE KEY UPDATE sval = VALUES(sval)`, key, body.Value); err != nil {
		return httpx.Internal(c, "failed to save setting")
	}
	return httpx.OK(c, fiber.Map{"key": key, "value": body.Value})
}
