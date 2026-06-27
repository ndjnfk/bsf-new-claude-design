// Package requests owns bank deposit/withdraw requests (doc §20 — Agent Bank DP/WD).
package requests

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// Accounts is the slice of identity needed to apply approved requests.
type Accounts interface {
	AdjustBalance(ctx context.Context, userID int64, delta float64) error
}

// Request is a deposit/withdraw bank request.
type Request struct {
	ID            int64     `db:"id" json:"id"`
	UserID        int64     `db:"user_id" json:"userId"`
	Username      string    `db:"username" json:"username"`
	ReqType       int       `db:"req_type" json:"reqType"` // 1 deposit, 2 withdraw
	Amount        float64   `db:"amount" json:"amount"`
	Method        *string   `db:"method" json:"method"`
	AccountName   *string   `db:"account_name" json:"accountName"`
	AccountNumber *string   `db:"account_number" json:"accountNumber"`
	IFSC          *string   `db:"ifsc" json:"ifsc"`
	UTR           *string   `db:"utr" json:"utr"`
	Remark        *string   `db:"remark" json:"remark"`
	Status        string    `db:"status" json:"status"`
	CreatedAt     time.Time `db:"created_at" json:"createdAt"`
}

// Module is the requests module.
type Module struct {
	db       *sqlx.DB
	accounts Accounts
}

// New builds the requests module.
func New(db *sqlx.DB, accounts Accounts) *Module { return &Module{db: db, accounts: accounts} }

// Register mounts request routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/requests", requireAuth)
	g.Get("", m.list)
	g.Post("", m.create)
	g.Put("/:id", m.updateStatus)
}

func (m *Module) list(c *fiber.Ctx) error {
	q := `SELECT id, user_id, username, req_type, amount, method, account_name,
	             account_number, ifsc, utr, remark, status, created_at FROM bank_requests WHERE 1=1`
	var args []any
	if t := c.QueryInt("type"); t > 0 {
		q += ` AND req_type = ?`
		args = append(args, t)
	}
	if s := c.Query("status"); s != "" {
		q += ` AND status = ?`
		args = append(args, s)
	}
	q += ` ORDER BY created_at DESC LIMIT 200`
	var rows []Request
	if err := m.db.SelectContext(c.Context(), &rows, q, args...); err != nil {
		return httpx.Internal(c, "failed to load requests")
	}
	return httpx.OK(c, rows)
}

// create lets the caller raise a request (used for seeding/demo and by players).
func (m *Module) create(c *fiber.Ctx) error {
	u := middleware.User(c)
	var body struct {
		ReqType       int     `json:"reqType"`
		Amount        float64 `json:"amount"`
		Method        string  `json:"method"`
		AccountName   string  `json:"accountName"`
		AccountNumber string  `json:"accountNumber"`
		IFSC          string  `json:"ifsc"`
	}
	if err := c.BodyParser(&body); err != nil || body.Amount <= 0 || (body.ReqType != 1 && body.ReqType != 2) {
		return httpx.BadRequest(c, "reqType (1|2) and positive amount are required")
	}
	_, err := m.db.ExecContext(c.Context(), `
		INSERT INTO bank_requests (user_id, username, req_type, amount, method, account_name, account_number, ifsc)
		VALUES (?,?,?,?,?,?,?,?)`,
		u.UserID, u.Username, body.ReqType, body.Amount, nullify(body.Method),
		nullify(body.AccountName), nullify(body.AccountNumber), nullify(body.IFSC))
	if err != nil {
		return httpx.Internal(c, "failed to create request")
	}
	return httpx.Created(c, fiber.Map{"created": true})
}

// updateStatus moves a PENDING/HOLD request to COMPLETE/REJECT/HOLD. On COMPLETE
// it applies the balance change (deposit credits, withdraw debits).
func (m *Module) updateStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Status string  `json:"status"`
		Amount float64 `json:"amount"`
		UTR    string  `json:"utr"`
		Remark string  `json:"remark"`
	}
	if err := c.BodyParser(&body); err != nil || body.Status == "" {
		return httpx.BadRequest(c, "status is required")
	}

	var req Request
	if err := m.db.GetContext(c.Context(), &req,
		`SELECT id, user_id, req_type, amount, status FROM bank_requests WHERE id = ?`, id); err != nil {
		return httpx.NotFound(c, "request not found")
	}
	if req.Status == "COMPLETE" {
		return httpx.BadRequest(c, "request already completed")
	}

	if body.Status == "COMPLETE" {
		amount := body.Amount
		if amount <= 0 {
			amount = req.Amount
		}
		delta := amount
		if req.ReqType == 2 { // withdraw debits
			delta = -amount
		}
		if err := m.accounts.AdjustBalance(c.Context(), req.UserID, delta); err != nil {
			return httpx.BadRequest(c, "could not apply balance: "+err.Error())
		}
		if _, err := m.db.ExecContext(c.Context(),
			`UPDATE bank_requests SET status = 'COMPLETE', amount = ?, utr = ?, remark = ? WHERE id = ?`,
			amount, nullify(body.UTR), nullify(body.Remark), id); err != nil {
			return httpx.Internal(c, "failed to update request")
		}
		return httpx.OK(c, fiber.Map{"id": id, "status": "COMPLETE"})
	}

	if _, err := m.db.ExecContext(c.Context(),
		`UPDATE bank_requests SET status = ?, remark = ? WHERE id = ?`,
		body.Status, nullify(body.Remark), id); err != nil {
		return httpx.Internal(c, "failed to update request")
	}
	return httpx.OK(c, fiber.Map{"id": id, "status": body.Status})
}

func nullify(s string) any {
	if s == "" {
		return nil
	}
	return s
}
