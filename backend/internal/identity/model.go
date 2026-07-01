// Package identity owns authentication, the 8-tier user hierarchy and RBAC.
package identity

import (
	"time"

	"bsf2020/pkg/domain"
)

// User is a node in the role hierarchy (maps to the `users` table).
type User struct {
	ID           int64          `db:"id" json:"id"`
	Mstruserid   string         `db:"mstruserid" json:"mstruserid"`
	Mstrname     string         `db:"mstrname" json:"mstrname"`
	PasswordHash string         `db:"password_hash" json:"-"`
	Usetype      domain.Usetype `db:"usetype" json:"usetype"`
	ParentID     *int64         `db:"parent_id" json:"parentId"`
	DomainID     *int64         `db:"domain_id" json:"domainId"`

	Balance          float64 `db:"balance" json:"balance"`
	Exposure         float64 `db:"exposure" json:"exposure"`
	CreditLimit      float64 `db:"credit_limit" json:"creditLimit"`
	PL               float64 `db:"p_l" json:"p_l"`
	ProfitLoss       float64 `db:"profit_loss" json:"profitLoss"`
	Pl               float64 `db:"pl" json:"pl"`
	SettlementAmount float64 `db:"settlement_amount" json:"settlementAmount"`

	PartnerCricket float64 `db:"partner_cricket" json:"partnerCricket"`
	PartnerCasino  float64 `db:"partner_casino" json:"partnerCasino"`

	Commission             float64 `db:"commission" json:"commission"`
	RollingCommission      float64 `db:"rolling_commission" json:"rollingCommission"`
	SessionComm            float64 `db:"session_comm" json:"sessionComm"`
	FancyRollingCommission float64 `db:"fancy_rolling_commission" json:"fancyRollingCommission"`

	Phone           *string `db:"phone" json:"phone"`
	UserLock        bool    `db:"user_lock" json:"userLock"`
	BetLock         bool    `db:"bet_lock" json:"betLock"`
	PasswordChanged bool    `db:"password_changed" json:"passwordChanged"`
	Status          bool    `db:"status" json:"status"`

	// Create-Company/Create-Child settings (doc "Create Company").
	AllowDepositWithdraw bool    `db:"allow_deposit_withdraw" json:"allowDepositWithdraw"`
	IsPartnership        bool    `db:"is_partnership" json:"isPartnership"`
	Reference            *string `db:"reference" json:"reference"`
	CreateNoOfChild      int     `db:"create_no_of_child" json:"createNoOfChild"`
	AllowBetDelete       bool    `db:"allow_bet_delete" json:"allowBetDelete"`
	AllowResultDeclare   bool    `db:"allow_result_declare" json:"allowResultDeclare"`
	AllowResultRevoke    bool    `db:"allow_result_revoke" json:"allowResultRevoke"`
	CasinoLimit          float64 `db:"casino_limit" json:"casinoLimit"`
	Remarks              *string `db:"remarks" json:"remarks"`

	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`
}

// RoleName returns the human-readable role for this user.
func (u User) RoleName() string { return u.Usetype.Name() }
