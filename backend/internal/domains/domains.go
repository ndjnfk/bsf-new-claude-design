// Package domains owns website settings (doc §23 — Website Setting).
package domains

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/httpx"
)

// Domain is a configured website domain.
type Domain struct {
	ID            int64     `db:"id" json:"id"`
	Name          string    `db:"name" json:"name"`
	URL           string    `db:"url" json:"url"`
	AlternateURL  *string   `db:"alternate_url" json:"alternateUrl"`
	Mobile        *string   `db:"mobile" json:"mobile"`
	Headline      *string   `db:"headline" json:"headline"`
	AdminHeadline *string   `db:"admin_headline" json:"adminHeadline"`
	Logo          *string   `db:"logo" json:"logo"`
	LoginBanner   *string   `db:"login_banner" json:"loginBanner"`
	ShowRegister  bool      `db:"show_register" json:"showRegister"`
	CreatedAt     time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt     time.Time `db:"updated_at" json:"updatedAt"`
}

// Module is the website-settings module.
type Module struct{ db *sqlx.DB }

// New builds the domains module.
func New(db *sqlx.DB) *Module { return &Module{db: db} }

// Register mounts domain routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/domains", requireAuth)
	g.Get("", m.list)
	g.Post("", m.create)
	g.Put("/:id", m.update)
}

func (m *Module) list(c *fiber.Ctx) error {
	var rows []Domain
	if err := m.db.SelectContext(c.Context(), &rows,
		`SELECT id, name, url, alternate_url, mobile, headline, admin_headline,
		        logo, login_banner, show_register, created_at, updated_at
		   FROM domains ORDER BY id DESC`); err != nil {
		return httpx.Internal(c, "failed to load domains")
	}
	return httpx.OK(c, rows)
}

func (m *Module) create(c *fiber.Ctx) error {
	var body struct {
		Name          string `json:"name"`
		URL           string `json:"url"`
		AlternateURL  string `json:"alternateUrl"`
		Mobile        string `json:"mobile"`
		Headline      string `json:"headline"`
		AdminHeadline string `json:"adminHeadline"`
	}
	if err := c.BodyParser(&body); err != nil || body.Name == "" || body.URL == "" {
		return httpx.BadRequest(c, "name and url are required")
	}
	res, err := m.db.ExecContext(c.Context(), `
		INSERT INTO domains (name, url, alternate_url, mobile, headline, admin_headline)
		VALUES (?,?,?,?,?,?)`,
		body.Name, body.URL, nullify(body.AlternateURL), nullify(body.Mobile),
		nullify(body.Headline), nullify(body.AdminHeadline))
	if err != nil {
		return httpx.BadRequest(c, "could not create domain (url may be taken)")
	}
	id, _ := res.LastInsertId()
	return httpx.Created(c, fiber.Map{"id": id})
}

func (m *Module) update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		AlternateURL  string `json:"alternateUrl"`
		AdminHeadline string `json:"adminHeadline"`
		ShowRegister  bool   `json:"showRegister"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if _, err := m.db.ExecContext(c.Context(), `
		UPDATE domains SET alternate_url = ?, admin_headline = ?, show_register = ?
		WHERE id = ?`,
		nullify(body.AlternateURL), nullify(body.AdminHeadline), body.ShowRegister, id); err != nil {
		return httpx.Internal(c, "failed to update domain")
	}
	return httpx.OK(c, fiber.Map{"id": id})
}

func nullify(s string) any {
	if s == "" {
		return nil
	}
	return s
}
