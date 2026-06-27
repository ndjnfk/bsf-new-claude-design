package identity

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/domain"
)

// ErrNotFound is returned when a user lookup misses.
var ErrNotFound = errors.New("user not found")

// ErrInsufficientBalance is returned when a deposit exceeds the parent's balance.
var ErrInsufficientBalance = errors.New("insufficient balance for the deposit")

// Store is the MySQL-backed repository for users.
type Store struct{ db *sqlx.DB }

// NewStore builds a user repository.
func NewStore(db *sqlx.DB) *Store { return &Store{db: db} }

const userCols = `id, mstruserid, mstrname, password_hash, usetype, parent_id, domain_id,
	balance, exposure, credit_limit, p_l, profit_loss, pl, settlement_amount,
	partner_cricket, partner_casino, commission, rolling_commission, session_comm,
	fancy_rolling_commission, phone, user_lock, bet_lock, password_changed, status,
	allow_deposit_withdraw, is_partnership, reference, create_no_of_child,
	allow_bet_delete, allow_result_declare, allow_result_revoke, casino_limit, remarks,
	created_at, updated_at`

// GetByUsername fetches a user by login id.
func (s *Store) GetByUsername(ctx context.Context, username string) (*User, error) {
	var u User
	err := s.db.GetContext(ctx, &u,
		`SELECT `+userCols+` FROM users WHERE mstruserid = ?`, username)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &u, err
}

// GetByID fetches a user by primary key.
func (s *Store) GetByID(ctx context.Context, id int64) (*User, error) {
	var u User
	err := s.db.GetContext(ctx, &u,
		`SELECT `+userCols+` FROM users WHERE id = ?`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &u, err
}

// CountByUsetype counts users of a given role.
func (s *Store) CountByUsetype(ctx context.Context, t domain.Usetype) (int, error) {
	var n int
	err := s.db.GetContext(ctx, &n, `SELECT COUNT(*) FROM users WHERE usetype = ?`, t)
	return n, err
}

// UsernameExists reports whether a login id is already taken.
func (s *Store) UsernameExists(ctx context.Context, username string) (bool, error) {
	n, err := func() (int, error) {
		var n int
		e := s.db.GetContext(ctx, &n, `SELECT COUNT(*) FROM users WHERE mstruserid = ?`, username)
		return n, e
	}()
	return n > 0, err
}

// execer is satisfied by both *sqlx.DB and *sqlx.Tx.
type execer interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

func insertUser(ctx context.Context, e execer, u *User) (int64, error) {
	res, err := e.ExecContext(ctx, `
		INSERT INTO users
		  (mstruserid, mstrname, password_hash, usetype, parent_id, domain_id,
		   balance, credit_limit, partner_cricket, partner_casino,
		   commission, rolling_commission, session_comm, fancy_rolling_commission,
		   phone, status, password_changed,
		   allow_deposit_withdraw, is_partnership, reference, create_no_of_child,
		   allow_bet_delete, allow_result_declare, allow_result_revoke, casino_limit, remarks)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?,?,?,?)`,
		u.Mstruserid, u.Mstrname, u.PasswordHash, u.Usetype, u.ParentID, u.DomainID,
		u.Balance, u.CreditLimit, u.PartnerCricket, u.PartnerCasino,
		u.Commission, u.RollingCommission, u.SessionComm, u.FancyRollingCommission,
		u.Phone, u.Status,
		u.AllowDepositWithdraw, u.IsPartnership, u.Reference, u.CreateNoOfChild,
		u.AllowBetDelete, u.AllowResultDeclare, u.AllowResultRevoke, u.CasinoLimit, u.Remarks)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// Insert creates a user and returns its new id.
func (s *Store) Insert(ctx context.Context, u *User) (int64, error) {
	return insertUser(ctx, s.db, u)
}

// InsertChildWithDeposit creates a child and atomically transfers `deposit` coins
// from the parent (a loan — doc "Fix Limit"), with ledger entries on both sides.
func (s *Store) InsertChildWithDeposit(ctx context.Context, u *User, deposit float64) (int64, error) {
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback() }()

	u.Balance = deposit
	id, err := insertUser(ctx, tx, u)
	if err != nil {
		return 0, err
	}
	if deposit > 0 && u.ParentID != nil {
		res, err := tx.ExecContext(ctx,
			`UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?`, deposit, *u.ParentID, deposit)
		if err != nil {
			return 0, err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return 0, ErrInsufficientBalance
		}
		var parentBal float64
		_ = tx.GetContext(ctx, &parentBal, `SELECT balance FROM users WHERE id = ?`, *u.ParentID)
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO account_statement (user_id, narration, credit, debit, balance_after, crdr) VALUES (?,?,?,?,?,2)`,
			*u.ParentID, "Coins to "+u.Mstruserid, 0, deposit, parentBal); err != nil {
			return 0, err
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO account_statement (user_id, narration, credit, debit, balance_after, crdr) VALUES (?,?,?,?,?,1)`,
			id, "Opening coins", deposit, 0, deposit); err != nil {
			return 0, err
		}
	}
	return id, tx.Commit()
}

// ListChildrenFilter narrows a children query.
type ListChildrenFilter struct {
	ParentID int64
	Usetype  domain.Usetype
	Status   *bool  // nil = all
	Search   string // matches mstruserid or mstrname
}

// ListChildren returns direct children of a parent, optionally by role/status/search.
func (s *Store) ListChildren(ctx context.Context, f ListChildrenFilter) ([]User, error) {
	var (
		sb   strings.Builder
		args []any
	)
	sb.WriteString(`SELECT ` + userCols + ` FROM users WHERE parent_id = ? AND usetype = ?`)
	args = append(args, f.ParentID, f.Usetype)
	if f.Status != nil {
		sb.WriteString(` AND status = ?`)
		args = append(args, *f.Status)
	}
	if f.Search != "" {
		sb.WriteString(` AND (mstruserid LIKE ? OR mstrname LIKE ?)`)
		like := "%" + f.Search + "%"
		args = append(args, like, like)
	}
	sb.WriteString(` ORDER BY created_at DESC`)

	var out []User
	if err := s.db.SelectContext(ctx, &out, sb.String(), args...); err != nil {
		return nil, fmt.Errorf("list children: %w", err)
	}
	return out, nil
}

// AdjustBalance atomically applies a signed delta to a user's balance.
// Exposed so the wallet module can move chips without owning the users table.
func (s *Store) AdjustBalance(ctx context.Context, userID int64, delta float64) error {
	res, err := s.db.ExecContext(ctx,
		`UPDATE users SET balance = balance + ? WHERE id = ?`, delta, userID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// Usernames returns a map of user id → login id for the given ids.
func (s *Store) Usernames(ctx context.Context, ids ...int64) (map[int64]string, error) {
	out := make(map[int64]string, len(ids))
	if len(ids) == 0 {
		return out, nil
	}
	query, args, err := sqlx.In(`SELECT id, mstruserid FROM users WHERE id IN (?)`, ids)
	if err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx, s.db.Rebind(query), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		out[id] = name
	}
	return out, rows.Err()
}

// GetBalance returns a user's current balance.
func (s *Store) GetBalance(ctx context.Context, userID int64) (float64, error) {
	var bal float64
	err := s.db.GetContext(ctx, &bal, `SELECT balance FROM users WHERE id = ?`, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, ErrNotFound
	}
	return bal, err
}

// ListBlocked returns the parent's direct children that are locked (account or betting).
func (s *Store) ListBlocked(ctx context.Context, parentID int64) ([]User, error) {
	var out []User
	err := s.db.SelectContext(ctx, &out,
		`SELECT `+userCols+` FROM users
		   WHERE parent_id = ? AND (user_lock = 1 OR bet_lock = 1)
		   ORDER BY mstruserid`, parentID)
	return out, err
}

// CommissionUpdate carries the editable commission/share/limit fields.
type CommissionUpdate struct {
	PartnerCricket    float64 `json:"partnerCricket"`
	PartnerCasino     float64 `json:"partnerCasino"`
	Commission        float64 `json:"commission"`
	RollingCommission float64 `json:"rollingCommission"`
	SessionComm       float64 `json:"sessionComm"`
	CreditLimit       float64 `json:"creditLimit"`
}

// UpdateCommission writes commission/share/limit fields for a user.
func (s *Store) UpdateCommission(ctx context.Context, id int64, u CommissionUpdate) error {
	res, err := s.db.ExecContext(ctx, `
		UPDATE users SET partner_cricket = ?, partner_casino = ?, commission = ?,
		       rolling_commission = ?, session_comm = ?, credit_limit = ?
		WHERE id = ?`,
		u.PartnerCricket, u.PartnerCasino, u.Commission, u.RollingCommission,
		u.SessionComm, u.CreditLimit, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// DownlineBalance sums the balances of a user's direct children.
// DownlineBalance sums the balance of the user's ENTIRE downline subtree (all
// descendants, any depth — not just direct children), excluding the user itself.
func (s *Store) DownlineBalance(ctx context.Context, parentID int64) (float64, error) {
	var sum float64
	err := s.db.GetContext(ctx, &sum, `
		WITH RECURSIVE tree (id) AS (
		  SELECT id FROM users WHERE parent_id = ?
		  UNION ALL
		  SELECT u.id FROM users u JOIN tree t ON u.parent_id = t.id
		)
		SELECT COALESCE(SUM(balance), 0) FROM users WHERE id IN (SELECT id FROM tree)`, parentID)
	return sum, err
}

// SetLocks updates a user's account and/or betting lock. nil leaves a flag as-is.
// SetLocks toggles the account/bet lock for a user AND its entire downline tree.
// Blocking a Company therefore blocks every Admin/Sub Admin/…/User beneath it
// (and unblocking cascades the same way). Implemented with a recursive walk of
// parent_id so it works at any tier.
func (s *Store) SetLocks(ctx context.Context, id int64, userLock, betLock *bool) error {
	ids, err := s.subtreeIDs(ctx, id)
	if err != nil {
		return err
	}
	if len(ids) == 0 {
		return ErrNotFound
	}
	apply := func(col string, val bool) error {
		q, args, err := sqlx.In(`UPDATE users SET `+col+` = ? WHERE id IN (?)`, val, ids)
		if err != nil {
			return err
		}
		_, err = s.db.ExecContext(ctx, s.db.Rebind(q), args...)
		return err
	}
	if userLock != nil {
		if err := apply("user_lock", *userLock); err != nil {
			return err
		}
	}
	if betLock != nil {
		if err := apply("bet_lock", *betLock); err != nil {
			return err
		}
	}
	return nil
}

// subtreeIDs returns the id plus every descendant id (recursive over parent_id).
func (s *Store) subtreeIDs(ctx context.Context, rootID int64) ([]int64, error) {
	var ids []int64
	err := s.db.SelectContext(ctx, &ids, `
		WITH RECURSIVE tree (id) AS (
		  SELECT id FROM users WHERE id = ?
		  UNION ALL
		  SELECT u.id FROM users u JOIN tree t ON u.parent_id = t.id
		)
		SELECT id FROM tree`, rootID)
	return ids, err
}

// ListAllChildren returns every direct child of a parent, any role.
func (s *Store) ListAllChildren(ctx context.Context, parentID int64) ([]User, error) {
	var out []User
	err := s.db.SelectContext(ctx, &out,
		`SELECT `+userCols+` FROM users WHERE parent_id = ? ORDER BY mstruserid`, parentID)
	return out, err
}

// ListDirectChildren returns a parent's direct children of ANY tier (excluding
// helper accounts), optionally filtered by status/search. Ordered by tier.
func (s *Store) ListDirectChildren(ctx context.Context, parentID int64, status *bool, search string) ([]User, error) {
	var (
		sb   strings.Builder
		args []any
	)
	sb.WriteString(`SELECT ` + userCols + ` FROM users WHERE parent_id = ? AND usetype <> 55`)
	args = append(args, parentID)
	if status != nil {
		sb.WriteString(` AND status = ?`)
		args = append(args, *status)
	}
	if search != "" {
		sb.WriteString(` AND (mstruserid LIKE ? OR mstrname LIKE ?)`)
		like := "%" + search + "%"
		args = append(args, like, like)
	}
	sb.WriteString(` ORDER BY usetype, created_at DESC`)
	var out []User
	if err := s.db.SelectContext(ctx, &out, sb.String(), args...); err != nil {
		return nil, fmt.Errorf("list direct children: %w", err)
	}
	return out, nil
}

// UpdateProfile updates a user's display name and phone (doc "viewAccount" /
// reference updateAccount).
func (s *Store) UpdateProfile(ctx context.Context, id int64, name string, phone *string) error {
	res, err := s.db.ExecContext(ctx,
		`UPDATE users SET mstrname = ?, phone = ? WHERE id = ?`, name, phone, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// UpdateAccountFields updates the Edit-Profile tab fields (name, no. of users,
// remark) on the Account modal.
func (s *Store) UpdateAccountFields(ctx context.Context, id int64, name string, noOfChild int, remark *string) error {
	res, err := s.db.ExecContext(ctx,
		`UPDATE users SET mstrname = ?, create_no_of_child = ?, remarks = ? WHERE id = ?`,
		name, noOfChild, remark, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// SetRootShares normalizes the seeded root Super Duper Admin to 100/100 match
// and casino share (it holds the full pie by definition; no casino reserve).
func (s *Store) SetRootShares(ctx context.Context, username string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE users SET partner_cricket = 100, partner_casino = 100 WHERE mstruserid = ? AND usetype = 0`, username)
	return err
}

// AddCasinoLimit increments a user's casino limit by amount (Casino Limit tab).
func (s *Store) AddCasinoLimit(ctx context.Context, id int64, amount float64) error {
	res, err := s.db.ExecContext(ctx,
		`UPDATE users SET casino_limit = casino_limit + ? WHERE id = ?`, amount, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// UpdatePassword sets a new password hash and marks it changed.
func (s *Store) UpdatePassword(ctx context.Context, id int64, hash string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE users SET password_hash = ?, password_changed = 1 WHERE id = ?`, hash, id)
	return err
}

// PingContext exposes a readiness check.
func (s *Store) PingContext(ctx context.Context) error { return s.db.PingContext(ctx) }
