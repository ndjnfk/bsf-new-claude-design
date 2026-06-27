// Package casino serves the Royal Casino (Aura) GGR report (doc §7).
package casino

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/httpx"
)

// GGRRow is a daily casino summary line.
type GGRRow struct {
	SummaryDate time.Time `db:"summary_date" json:"summaryDate"`
	Label       string    `db:"label" json:"label"`
	NetChips    float64   `db:"net_chips" json:"netChips"`
}

// Module is the casino module.
type Module struct{ db *sqlx.DB }

// New builds the casino module.
func New(db *sqlx.DB) *Module { return &Module{db: db} }

// Register mounts casino routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/casino", requireAuth)
	g.Get("/ggr", m.ggr)
}

// ggr returns date-wise NetChips for a range plus the overall total (doc §7).
func (m *Module) ggr(c *fiber.Ctx) error {
	from := c.Query("from")
	to := c.Query("to")
	q := `SELECT summary_date, label, net_chips FROM casino_ggr WHERE 1=1`
	var args []any
	if from != "" {
		q += ` AND summary_date >= ?`
		args = append(args, from)
	}
	if to != "" {
		q += ` AND summary_date <= ?`
		args = append(args, to)
	}
	q += ` ORDER BY summary_date DESC`
	var rows []GGRRow
	if err := m.db.SelectContext(c.Context(), &rows, q, args...); err != nil {
		return httpx.Internal(c, "failed to load GGR")
	}
	var total float64
	for _, r := range rows {
		total += r.NetChips
	}
	return httpx.OK(c, fiber.Map{"total": total, "rows": rows})
}
