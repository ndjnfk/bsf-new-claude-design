// Package wallet owns chips movement and the financial ledger (account
// statements). It moves user balances through the Accounts interface so it does
// not own the users table directly.
package wallet

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// Accounts is the slice of identity the wallet needs to move money.
type Accounts interface {
	AdjustBalance(ctx context.Context, userID int64, delta float64) error
	GetBalance(ctx context.Context, userID int64) (float64, error)
	Usernames(ctx context.Context, ids ...int64) (map[int64]string, error)
}

// Statement is one ledger row (doc §15 id=3).
type Statement struct {
	ID           int64     `db:"id" json:"id"`
	UserID       int64     `db:"user_id" json:"userId"`
	Narration    string    `db:"narration" json:"narration"`
	Credit       float64   `db:"credit" json:"credit"`
	Debit        float64   `db:"debit" json:"debit"`
	BalanceAfter float64   `db:"balance_after" json:"balanceAfter"`
	AccountType  int       `db:"account_type" json:"accountType"`
	CrDr         int       `db:"crdr" json:"crdr"` // 1 = Credit (deposit side), 2 = Debit (withdraw side)
	RefID        *string   `db:"ref_id" json:"refId"`
	CreatedAt    time.Time `db:"created_at" json:"createdAt"`
}

// Module is the wallet feature module.
type Module struct {
	db       *sqlx.DB
	accounts Accounts
}

// New builds the wallet module.
func New(db *sqlx.DB, accounts Accounts) *Module {
	return &Module{db: db, accounts: accounts}
}

// Register mounts wallet routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/wallet", requireAuth)
	g.Post("/transactions", m.transact)
	g.Get("/statement", m.statement)

	s := api.Group("/settlements", requireAuth)
	s.Get("", m.listSettlements)
	s.Post("", m.createSettlement)
	s.Delete("/:id", m.deleteSettlement)
}

// Settlement is a parent↔child settlement entry (doc §26).
type Settlement struct {
	ID         int64     `db:"id" json:"id"`
	ParentUser string    `db:"parent_user" json:"parentUser"`
	ChildUser  string    `db:"child_user" json:"childUser"`
	Amount     float64   `db:"amount" json:"amount"`
	Remark     *string   `db:"remark" json:"remark"`
	OnDate     time.Time `db:"on_date" json:"onDate"`
}

func (m *Module) listSettlements(c *fiber.Ctx) error {
	parentID := middleware.User(c).UserID
	var rows []Settlement
	err := m.db.SelectContext(c.Context(), &rows,
		`SELECT id, parent_user, child_user, amount, remark, on_date
		   FROM settlement_entries WHERE parent_id = ? ORDER BY on_date DESC LIMIT 200`, parentID)
	if err != nil {
		return httpx.Internal(c, "failed to load settlements")
	}
	return httpx.OK(c, rows)
}

func (m *Module) createSettlement(c *fiber.Ctx) error {
	parent := middleware.User(c)
	var body struct {
		ChildID int64   `json:"childId"`
		Amount  float64 `json:"amount"`
		Remark  string  `json:"remark"`
	}
	if err := c.BodyParser(&body); err != nil || body.ChildID == 0 || body.Amount == 0 {
		return httpx.BadRequest(c, "childId and non-zero amount are required")
	}
	names, err := m.accounts.Usernames(c.Context(), parent.UserID, body.ChildID)
	if err != nil {
		return httpx.BadRequest(c, "unknown user")
	}
	_, err = m.db.ExecContext(c.Context(), `
		INSERT INTO settlement_entries (parent_id, child_id, parent_user, child_user, amount, remark)
		VALUES (?,?,?,?,?,?)`,
		parent.UserID, body.ChildID, names[parent.UserID], names[body.ChildID], body.Amount, nullify(body.Remark))
	if err != nil {
		return httpx.Internal(c, "failed to create settlement")
	}
	return httpx.Created(c, fiber.Map{"created": true})
}

func (m *Module) deleteSettlement(c *fiber.Ctx) error {
	id := c.Params("id")
	if _, err := m.db.ExecContext(c.Context(),
		`DELETE FROM settlement_entries WHERE id = ? AND parent_id = ?`, id, middleware.User(c).UserID); err != nil {
		return httpx.Internal(c, "failed to delete settlement")
	}
	return httpx.OK(c, fiber.Map{"deleted": true})
}

func nullify(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// transact moves chips between a user and their parent. A deposit gives chips to
// the user (the parent's balance DECREASES); a withdraw recovers them (the
// parent's balance INCREASES). Both sides move atomically with ledger entries so
// money is conserved — never minted. The source side must hold enough chips.
func (m *Module) transact(c *fiber.Ctx) error {
	var body struct {
		UserID int64   `json:"userId"`
		Amount float64 `json:"amount"`
		Type   string  `json:"type"` // "deposit" | "withdraw"
		Remark string  `json:"remark"`
	}
	if err := c.BodyParser(&body); err != nil || body.Amount <= 0 || body.UserID == 0 {
		return httpx.BadRequest(c, "userId, positive amount and type are required")
	}
	deposit := body.Type != "withdraw"

	var parentID *int64
	_ = m.db.GetContext(c.Context(), &parentID, `SELECT parent_id FROM users WHERE id = ?`, body.UserID)
	ids := []int64{body.UserID}
	if parentID != nil {
		ids = append(ids, *parentID)
	}
	names, _ := m.accounts.Usernames(c.Context(), ids...)
	userName := names[body.UserID]
	parentName := ""
	if parentID != nil {
		parentName = names[*parentID]
	}

	tx, err := m.db.BeginTxx(c.Context(), nil)
	if err != nil {
		return httpx.Internal(c, "tx error")
	}
	defer tx.Rollback() //nolint:errcheck

	// Source = parent on deposit, user on withdraw — must have the chips.
	srcID := parentID
	if !deposit {
		srcID = &body.UserID
	}
	if srcID != nil {
		res, err := tx.ExecContext(c.Context(),
			`UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?`, body.Amount, *srcID, body.Amount)
		if err != nil {
			return httpx.Internal(c, "failed to debit source")
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return httpx.BadRequest(c, "insufficient balance")
		}
	}
	// Destination = user on deposit, parent on withdraw.
	dstID := &body.UserID
	if !deposit {
		dstID = parentID
	}
	if dstID != nil {
		if _, err := tx.ExecContext(c.Context(),
			`UPDATE users SET balance = balance + ? WHERE id = ?`, body.Amount, *dstID); err != nil {
			return httpx.Internal(c, "failed to credit destination")
		}
	}

	// The user's credit limit (Fix Limit — chips the parent has extended) tracks
	// the net deposits: it rises on deposit and falls on withdraw. Reference:
	// "Limit Increased/Decreased of <user>". Only the user's limit moves; the
	// parent merely funds it from balance.
	limitDelta := body.Amount
	if !deposit {
		limitDelta = -body.Amount
	}
	if _, err := tx.ExecContext(c.Context(),
		`UPDATE users SET credit_limit = credit_limit + ? WHERE id = ?`, limitDelta, body.UserID); err != nil {
		return httpx.Internal(c, "failed to adjust credit limit")
	}

	// Ledger narrations name both parties so each side reads clearly.
	var userNarr, parNarr string
	if deposit {
		userNarr, parNarr = "Chips Deposit from "+parentName, "Chips Deposit to "+userName
	} else {
		userNarr, parNarr = "Chips Withdraw to "+parentName, "Chips Withdraw from "+userName
	}
	if parentID == nil { // root has no counterparty
		userNarr = "Chips Deposit"
		if !deposit {
			userNarr = "Chips Withdraw"
		}
	}
	if body.Remark != "" {
		userNarr += " — " + body.Remark
		parNarr += " — " + body.Remark
	}
	userCr, userDr := body.Amount, 0.0
	if !deposit {
		userCr, userDr = 0.0, body.Amount
	}
	if err := writeLedger(c, tx, body.UserID, userNarr, userCr, userDr); err != nil {
		return httpx.Internal(c, "failed to record statement")
	}
	if parentID != nil {
		parCr, parDr := 0.0, body.Amount
		if !deposit {
			parCr, parDr = body.Amount, 0.0
		}
		if err := writeLedger(c, tx, *parentID, parNarr, parCr, parDr); err != nil {
			return httpx.Internal(c, "failed to record statement")
		}
	}

	if err := tx.Commit(); err != nil {
		return httpx.Internal(c, "commit error")
	}
	bal, _ := m.accounts.GetBalance(c.Context(), body.UserID)
	return httpx.OK(c, fiber.Map{"userId": body.UserID, "balance": bal})
}

// writeLedger appends one account_statement row (account_type 1 = cash) using the
// account's post-update balance for balance_after. crdr is 1 for a credit (money
// in) and 2 for a debit (money out).
func writeLedger(c *fiber.Ctx, tx *sqlx.Tx, userID int64, narration string, credit, debit float64) error {
	crdr := 1
	if debit > 0 {
		crdr = 2
	}
	var bal float64
	_ = tx.GetContext(c.Context(), &bal, `SELECT balance FROM users WHERE id = ?`, userID)
	_, err := tx.ExecContext(c.Context(),
		`INSERT INTO account_statement (user_id, narration, credit, debit, balance_after, account_type, crdr)
		 VALUES (?,?,?,?,?,1,?)`, userID, narration, credit, debit, bal, crdr)
	return err
}

// statement lists ledger rows for a user (defaults to the caller).
func (m *Module) statement(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	if q := c.QueryInt("userId"); q > 0 {
		userID = int64(q)
	}
	var rows []Statement
	err := m.db.SelectContext(c.Context(), &rows,
		`SELECT id, user_id, narration, credit, debit, balance_after, account_type, crdr, ref_id, created_at
		   FROM account_statement WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`, userID)
	if err != nil {
		return httpx.Internal(c, "failed to load statement")
	}
	return httpx.OK(c, rows)
}
