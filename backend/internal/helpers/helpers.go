// Package helpers owns helper/worker accounts (doc §24 — Add Worker). usetype 55.
package helpers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/internal/identity"
	"bsf2020/pkg/auth"
	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// Helper is a worker account with a permission set.
type Helper struct {
	ID          int64     `db:"id" json:"id"`
	Mstruserid  string    `db:"mstruserid" json:"mstruserid"`
	Mstrname    string    `db:"mstrname" json:"mstrname"`
	ParentID    int64     `db:"parent_id" json:"parentId"`
	Permissions *string   `db:"permissions" json:"-"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`

	PermissionList []string `db:"-" json:"permissions"`
}

// Module is the helpers module.
type Module struct{ db *sqlx.DB }

// New builds the helpers module.
func New(db *sqlx.DB) *Module { return &Module{db: db} }

// Register mounts helper routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/helpers", requireAuth)
	g.Get("", m.list)
	g.Post("", m.create)
	g.Put("/:id", m.update)
	g.Put("/:id/password", m.resetPassword)
	g.Delete("/:id", m.remove)
}

// FindByUsername implements identity.HelperAuth for helper login.
func (m *Module) FindByUsername(ctx context.Context, username string) (*identity.HelperRecord, error) {
	var row struct {
		ID           int64   `db:"id"`
		ParentID     int64   `db:"parent_id"`
		Name         string  `db:"mstrname"`
		PasswordHash string  `db:"password_hash"`
		Permissions  *string `db:"permissions"`
	}
	err := m.db.GetContext(ctx, &row,
		`SELECT id, parent_id, mstrname, password_hash, permissions FROM helpers WHERE mstruserid = ?`, username)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &identity.HelperRecord{
		ID: row.ID, ParentID: row.ParentID, Name: row.Name,
		PasswordHash: row.PasswordHash, Permissions: decodePerms(row.Permissions),
	}, nil
}

func (m *Module) list(c *fiber.Ctx) error {
	var rows []Helper
	err := m.db.SelectContext(c.Context(), &rows,
		`SELECT id, mstruserid, mstrname, parent_id, permissions, created_at
		   FROM helpers WHERE parent_id = ? ORDER BY created_at DESC`, middleware.User(c).UserID)
	if err != nil {
		return httpx.Internal(c, "failed to load helpers")
	}
	for i := range rows {
		rows[i].PermissionList = decodePerms(rows[i].Permissions)
	}
	return httpx.OK(c, rows)
}

func (m *Module) create(c *fiber.Ctx) error {
	var body struct {
		Name        string   `json:"name"`
		UserID      string   `json:"userId"`
		Password    string   `json:"password"`
		Permissions []string `json:"permissions"`
		Question    string   `json:"question"`
		Answer      string   `json:"answer"`
	}
	if err := c.BodyParser(&body); err != nil || body.UserID == "" || body.Password == "" {
		return httpx.BadRequest(c, "userId and password are required")
	}
	hash, err := auth.HashPassword(body.Password)
	if err != nil {
		return httpx.Internal(c, "hash error")
	}
	var ansHash any
	if body.Answer != "" {
		h, _ := auth.HashPassword(body.Answer)
		ansHash = h
	}
	perms, _ := json.Marshal(body.Permissions)
	_, err = m.db.ExecContext(c.Context(), `
		INSERT INTO helpers (mstruserid, mstrname, password_hash, parent_id, permissions, question, answer_hash)
		VALUES (?,?,?,?,?,?,?)`,
		body.UserID, orDefault(body.Name, body.UserID), hash, middleware.User(c).UserID,
		string(perms), nullify(body.Question), ansHash)
	if err != nil {
		return httpx.BadRequest(c, "could not create helper (user id may be taken)")
	}
	return httpx.Created(c, fiber.Map{"created": true})
}

// update changes a helper's display name and permission set (parent-scoped).
func (m *Module) update(c *fiber.Ctx) error {
	var body struct {
		Name        string   `json:"name"`
		Permissions []string `json:"permissions"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	perms, _ := json.Marshal(body.Permissions)
	res, err := m.db.ExecContext(c.Context(), `
		UPDATE helpers SET mstrname = ?, permissions = ? WHERE id = ? AND parent_id = ?`,
		body.Name, string(perms), c.Params("id"), middleware.User(c).UserID)
	if err != nil {
		return httpx.Internal(c, "failed to update helper")
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return httpx.NotFound(c, "helper not found")
	}
	return httpx.OK(c, fiber.Map{"updated": true})
}

// resetPassword sets a new password for a helper (parent-scoped).
func (m *Module) resetPassword(c *fiber.Ctx) error {
	var body struct {
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.Password) < 4 {
		return httpx.BadRequest(c, "password too short")
	}
	hash, err := auth.HashPassword(body.Password)
	if err != nil {
		return httpx.Internal(c, "hash error")
	}
	res, err := m.db.ExecContext(c.Context(),
		`UPDATE helpers SET password_hash = ? WHERE id = ? AND parent_id = ?`,
		hash, c.Params("id"), middleware.User(c).UserID)
	if err != nil {
		return httpx.Internal(c, "failed to reset password")
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return httpx.NotFound(c, "helper not found")
	}
	return httpx.OK(c, fiber.Map{"changed": true})
}

func (m *Module) remove(c *fiber.Ctx) error {
	if _, err := m.db.ExecContext(c.Context(),
		`DELETE FROM helpers WHERE id = ? AND parent_id = ?`, c.Params("id"), middleware.User(c).UserID); err != nil {
		return httpx.Internal(c, "failed to delete helper")
	}
	return httpx.OK(c, fiber.Map{"deleted": true})
}

func decodePerms(s *string) []string {
	if s == nil || *s == "" {
		return []string{}
	}
	var out []string
	_ = json.Unmarshal([]byte(*s), &out)
	return out
}

func orDefault(v, fallback string) string {
	if v == "" {
		return fallback
	}
	return v
}

func nullify(s string) any {
	if s == "" {
		return nil
	}
	return s
}
