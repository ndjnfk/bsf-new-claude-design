package identity

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"

	"bsf2020/pkg/auth"
	"bsf2020/pkg/domain"
)

// Common errors surfaced to handlers.
var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrLocked             = errors.New("account is locked")
	ErrForbiddenRole      = errors.New("not allowed to create this role")
	ErrUsernameTaken      = errors.New("username already taken")
)

// LoginRecorder records a successful login for audit/IP surveillance (doc §30).
// Implemented by the audit module; optional (nil disables recording).
type LoginRecorder interface {
	RecordLogin(userID int64, username, ip, userAgent string)
}

// HelperRecord is the subset of a helper account needed to authenticate it.
type HelperRecord struct {
	ID           int64
	ParentID     int64
	Name         string
	PasswordHash string
	Permissions  []string
}

// HelperAuth looks up helper accounts for login. Implemented by the helpers
// module; optional (nil disables helper login).
type HelperAuth interface {
	FindByUsername(ctx context.Context, username string) (*HelperRecord, error)
}

// PasswordRecorder records a password change for the Password History report
// (doc §15 id=6). Implemented by the audit module; optional.
type PasswordRecorder interface {
	RecordPasswordChange(userID int64, username, changerName, ip string)
}

// Service holds identity business logic.
type Service struct {
	store      *Store
	jwtSecret  string
	tokenTTL   time.Duration
	recorder   LoginRecorder
	pwdRecord  PasswordRecorder
	helperAuth HelperAuth
}

// NewService builds the identity service.
func NewService(store *Store, jwtSecret string) *Service {
	return &Service{store: store, jwtSecret: jwtSecret, tokenTTL: 12 * time.Hour}
}

// SetLoginRecorder wires an audit sink for successful logins.
func (s *Service) SetLoginRecorder(r LoginRecorder) { s.recorder = r }

// SetPasswordRecorder wires an audit sink for password changes.
func (s *Service) SetPasswordRecorder(r PasswordRecorder) { s.pwdRecord = r }

// SetHelperAuth wires the helper-account lookup used during login.
func (s *Service) SetHelperAuth(h HelperAuth) { s.helperAuth = h }

// LoginResult is returned on a successful login.
type LoginResult struct {
	Token       string   `json:"token"`
	User        *User    `json:"user"`
	IsHelper    bool     `json:"isHelper"`
	Permissions []string `json:"permissions,omitempty"`
}

// LoginMeta carries request context for audit recording.
type LoginMeta struct {
	IP        string
	UserAgent string
}

// Login verifies credentials and issues a JWT, recording the login for audit.
// It tries the users table first, then (if configured) helper accounts.
func (s *Service) Login(ctx context.Context, username, password string, meta LoginMeta) (*LoginResult, error) {
	u, err := s.store.GetByUsername(ctx, username)
	if err == nil {
		if !auth.CheckPassword(u.PasswordHash, password) {
			return nil, ErrInvalidCredentials
		}
		if u.UserLock {
			return nil, ErrLocked
		}
		token, terr := auth.Issue(s.jwtSecret, auth.Principal{
			UserID: u.ID, Username: u.Mstruserid, Usetype: u.Usetype,
		}, s.tokenTTL)
		if terr != nil {
			return nil, terr
		}
		if s.recorder != nil {
			s.recorder.RecordLogin(u.ID, u.Mstruserid, meta.IP, meta.UserAgent)
		}
		return &LoginResult{Token: token, User: u}, nil
	}
	if !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	return s.loginHelper(ctx, username, password, meta)
}

// loginHelper authenticates a helper account. The issued token acts in the
// parent's context (UserID/Usetype = parent), tagged with the helper's identity
// and permission set.
func (s *Service) loginHelper(ctx context.Context, username, password string, meta LoginMeta) (*LoginResult, error) {
	if s.helperAuth == nil {
		return nil, ErrInvalidCredentials
	}
	h, err := s.helperAuth.FindByUsername(ctx, username)
	if err != nil || h == nil {
		return nil, ErrInvalidCredentials
	}
	if !auth.CheckPassword(h.PasswordHash, password) {
		return nil, ErrInvalidCredentials
	}
	parent, err := s.store.GetByID(ctx, h.ParentID)
	if err != nil {
		return nil, ErrInvalidCredentials
	}
	if parent.UserLock {
		return nil, ErrLocked
	}
	token, err := auth.Issue(s.jwtSecret, auth.Principal{
		UserID: parent.ID, Username: username, Usetype: parent.Usetype,
		IsHelper: true, ActorID: h.ID, Permissions: h.Permissions,
	}, s.tokenTTL)
	if err != nil {
		return nil, err
	}
	if s.recorder != nil {
		s.recorder.RecordLogin(parent.ID, username, meta.IP, meta.UserAgent)
	}
	// Synthesize a profile: helper identity, parent's role/balance context.
	syn := &User{
		ID: parent.ID, Mstruserid: username, Mstrname: h.Name,
		Usetype: parent.Usetype, Balance: parent.Balance, Status: true,
	}
	return &LoginResult{Token: token, User: syn, IsHelper: true, Permissions: h.Permissions}, nil
}

// Me returns the current user's profile.
func (s *Service) Me(ctx context.Context, id int64) (*User, error) {
	return s.store.GetByID(ctx, id)
}

// CreateUserInput captures the documented Create-Company/Create-Child fields.
type CreateUserInput struct {
	Mstruserid string  `json:"username"`     // login id
	Mstrname   string  `json:"masterName"`   // display name
	Password   string  `json:"password"`     // login password
	TypeID     int     `json:"typeId"`       // which tier to create (0 = immediate next)
	Deposit    float64 `json:"deposit"`      // "Fix Limit" — coins loaned from the parent

	// Used only when creating another Super Duper Admin (an independent root):
	// the balance is granted directly rather than loaned from a parent.
	Balance     float64 `json:"balance"`
	CreditLimit float64 `json:"creditLimit"`

	AllowDepositWithdraw bool `json:"allowDepositWithdraw"`
	IsPartnership        bool `json:"isPartnership"`

	PartnerCricket         float64 `json:"sportsValue"`    // Company Match Share (held by the child)
	PartnerCasino          float64 `json:"casinoValue"`    // Company Casino Share
	Commission             float64 `json:"commission"`     // Odds Commission
	SessionComm            float64 `json:"sessionCommission"`
	RollingCommission      float64 `json:"rollingCommission"`      // Company Match Commission
	FancyRollingCommission float64 `json:"fancyRollingCommission"` // Company Session Commission

	Reference       string `json:"reference"`
	CreateNoOfChild int    `json:"createNoOfChild"`
	DomainID        *int64 `json:"domainId"`
	AllowBetDelete  bool   `json:"allowBetDelete"`
	AllowResultDeclare bool `json:"allowResultDeclare"`
	AllowResultRevoke  bool `json:"allowResultRevoke"`
	CasinoLimit     float64 `json:"casinoLimit"`
	Remarks         string  `json:"remarks"`
	Phone           string  `json:"phone"`
}

// ErrShareTooHigh / ErrCommTooHigh are returned when a value exceeds the parent's.
var (
	ErrShareTooHigh = errors.New("share exceeds your available share")
	ErrCommTooHigh  = errors.New("commission exceeds your available commission")
)

// CreateChild creates a downline user under the creator. The creator picks which
// tier to create (in.TypeID); a Company may create any tier from Admin down to
// User, the SDA may create Company only, and a User creates nothing. When no
// TypeID is supplied it defaults to the immediate next tier.
func (s *Service) CreateChild(ctx context.Context, creator *User, in CreateUserInput) (*User, error) {
	target := domain.Usetype(in.TypeID)
	if in.TypeID == 0 {
		t, ok := creator.Usetype.Creates()
		if !ok {
			return nil, ErrForbiddenRole
		}
		target = t
	}
	if !creator.Usetype.CanCreate(target) {
		return nil, ErrForbiddenRole
	}
	in.Mstruserid = strings.TrimSpace(in.Mstruserid)
	if in.Mstruserid == "" || in.Password == "" {
		return nil, errors.New("username and password are required")
	}
	exists, err := s.store.UsernameExists(ctx, in.Mstruserid)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUsernameTaken
	}
	// --- validations against the parent (creator) ---
	if in.Deposit < 0 {
		return nil, errors.New("deposit cannot be negative")
	}
	if in.Deposit > creator.Balance {
		return nil, ErrInsufficientBalance
	}
	// Shares: with partnership, the child's share must fit within the parent's
	// available share. The Super Duper Admin holds 100% by definition. Without
	// partnership, shares are a flat 100 (commission-only model). No casino
	// reserve — casino splits 100/0 like match (matching the reference).
	baseCricket, baseCasino, reserve := creator.PartnerCricket, creator.PartnerCasino, 0.0
	if creator.Usetype == domain.SuperDuperAdmin {
		baseCricket, baseCasino = 100, 100
	}
	cricket, casino := 100.0, 100.0
	if in.IsPartnership {
		if in.PartnerCricket < 0 || in.PartnerCricket > baseCricket {
			return nil, ErrShareTooHigh
		}
		if in.PartnerCasino < 0 || in.PartnerCasino > baseCasino-reserve {
			return nil, ErrShareTooHigh
		}
		cricket, casino = in.PartnerCricket, in.PartnerCasino
	}
	// Commissions must fit within the parent's.
	if in.Commission > creator.Commission || in.SessionComm > creator.SessionComm ||
		in.RollingCommission > creator.RollingCommission || in.FancyRollingCommission > creator.FancyRollingCommission {
		return nil, ErrCommTooHigh
	}

	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return nil, err
	}
	noChild := in.CreateNoOfChild
	if noChild <= 0 {
		noChild = 1000000
	}
	u := &User{
		Mstruserid: in.Mstruserid, Mstrname: orDefault(in.Mstrname, in.Mstruserid),
		PasswordHash: hash, Usetype: target, ParentID: &creator.ID, DomainID: in.DomainID,
		CreditLimit: in.Deposit, PartnerCricket: cricket, PartnerCasino: casino,
		Commission: in.Commission, SessionComm: in.SessionComm,
		RollingCommission: in.RollingCommission, FancyRollingCommission: in.FancyRollingCommission,
		Phone: nullStr(in.Phone), Status: true,
		AllowDepositWithdraw: in.AllowDepositWithdraw, IsPartnership: in.IsPartnership,
		Reference: nullStr(in.Reference), CreateNoOfChild: noChild,
		AllowBetDelete: in.AllowBetDelete, AllowResultDeclare: in.AllowResultDeclare,
		AllowResultRevoke: in.AllowResultRevoke, CasinoLimit: in.CasinoLimit, Remarks: nullStr(in.Remarks),
	}
	// Atomic: insert the child and transfer the deposit (loan) from the parent.
	id, err := s.store.InsertChildWithDeposit(ctx, u, in.Deposit)
	if err != nil {
		return nil, err
	}
	return s.store.GetByID(ctx, id)
}

// CreateSuperAdmin lets an existing Super Duper Admin create ANOTHER Super Duper
// Admin — a brand-new independent root tree with a full profile (balance, credit
// limit, partnership shares and commissions). Unlike a downline user, its balance
// is granted directly (minted), since a root SDA has no parent to loan from.
func (s *Service) CreateSuperAdmin(ctx context.Context, creator *User, in CreateUserInput) (*User, error) {
	if creator.Usetype != domain.SuperDuperAdmin {
		return nil, ErrForbiddenRole
	}
	in.Mstruserid = strings.TrimSpace(in.Mstruserid)
	if in.Mstruserid == "" || in.Password == "" {
		return nil, errors.New("username and password are required")
	}
	exists, err := s.store.UsernameExists(ctx, in.Mstruserid)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUsernameTaken
	}
	if in.Balance < 0 || in.CreditLimit < 0 {
		return nil, errors.New("balance and credit limit cannot be negative")
	}
	// A Super Duper Admin holds 100% share by definition; allow override but
	// default to 100 when left blank.
	cricket, casino := in.PartnerCricket, in.PartnerCasino
	if cricket <= 0 {
		cricket = 100
	}
	if casino <= 0 {
		casino = 100
	}
	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return nil, err
	}
	noChild := in.CreateNoOfChild
	if noChild <= 0 {
		noChild = 1000000
	}
	u := &User{
		Mstruserid: in.Mstruserid, Mstrname: orDefault(in.Mstrname, in.Mstruserid),
		PasswordHash: hash, Usetype: domain.SuperDuperAdmin, ParentID: nil, DomainID: in.DomainID,
		Balance: in.Balance, CreditLimit: in.CreditLimit,
		PartnerCricket: cricket, PartnerCasino: casino,
		Commission: in.Commission, SessionComm: in.SessionComm,
		RollingCommission: in.RollingCommission, FancyRollingCommission: in.FancyRollingCommission,
		Phone: nullStr(in.Phone), Status: true, IsPartnership: true,
		AllowDepositWithdraw: in.AllowDepositWithdraw,
		Reference:            nullStr(in.Reference), CreateNoOfChild: noChild,
		AllowBetDelete: in.AllowBetDelete, AllowResultDeclare: in.AllowResultDeclare,
		AllowResultRevoke: in.AllowResultRevoke, CasinoLimit: in.CasinoLimit, Remarks: nullStr(in.Remarks),
	}
	id, err := s.store.Insert(ctx, u)
	if err != nil {
		return nil, err
	}
	return s.store.GetByID(ctx, id)
}

func nullStr(v string) *string {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	return &v
}

// UsernameAvailable reports whether a login id is free to use (doc "Create
// Company" real-time check).
func (s *Service) UsernameAvailable(ctx context.Context, username string) (bool, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return false, nil
	}
	exists, err := s.store.UsernameExists(ctx, username)
	return !exists, err
}

// ListCompanies returns the Companies created by a Super Duper Admin.
func (s *Service) ListCompanies(ctx context.Context, sdaID int64, status *bool, search string) ([]User, error) {
	return s.store.ListChildren(ctx, ListChildrenFilter{
		ParentID: sdaID, Usetype: domain.Company, Status: status, Search: search,
	})
}

// ListMyChildren lists the creator's direct downline of ANY tier (a Company can
// now hold Admins, Sub Admins, … Users directly). Players have none.
func (s *Service) ListMyChildren(ctx context.Context, creator *User, status *bool, search string) ([]User, error) {
	if len(creator.Usetype.CreatableRoles()) == 0 {
		return []User{}, nil
	}
	return s.store.ListDirectChildren(ctx, creator.ID, status, search)
}

// CollectionUser is a row in the collection report (doc §13, §16).
type CollectionUser struct {
	ID       int64   `json:"id"`
	Username string  `json:"username"`
	Name     string  `json:"name"`
	Balance  float64 `json:"balance"`
}

// CollectionReport groups a user's direct children by balance sign (doc §13).
type CollectionReport struct {
	MinusUsers []CollectionUser `json:"minusUsers"` // balance < 0 → LENA HAI (take)
	PlusUsers  []CollectionUser `json:"plusUsers"`  // balance > 0 → DENA HAI (give)
	ZeroUsers  []CollectionUser `json:"zeroUsers"`  // balance = 0 → CLEAR
}

// CollectionReport builds the minus/plus/zero grouping for a user's children.
func (s *Service) CollectionReport(ctx context.Context, parentID int64) (*CollectionReport, error) {
	children, err := s.store.ListAllChildren(ctx, parentID)
	if err != nil {
		return nil, err
	}
	rep := &CollectionReport{MinusUsers: []CollectionUser{}, PlusUsers: []CollectionUser{}, ZeroUsers: []CollectionUser{}}
	for _, c := range children {
		cu := CollectionUser{ID: c.ID, Username: c.Mstruserid, Name: c.Mstrname, Balance: c.Balance}
		switch {
		case c.Balance < 0:
			rep.MinusUsers = append(rep.MinusUsers, cu)
		case c.Balance > 0:
			rep.PlusUsers = append(rep.PlusUsers, cu)
		default:
			rep.ZeroUsers = append(rep.ZeroUsers, cu)
		}
	}
	return rep, nil
}

// Dashboard is the home-screen summary (doc §1).
type Dashboard struct {
	Username       string  `json:"username"`
	Name           string  `json:"name"`
	Level          string  `json:"level"`
	Balance        float64 `json:"balance"`
	ProfitLoss     float64 `json:"profitLoss"`
	MyMatchShare   float64 `json:"myMatchShare"`
	CompMatchShare float64 `json:"companyMatchShare"`
	MyCasinoShare  float64 `json:"myCasinoShare"`
	CompCasinoShr  float64 `json:"companyCasinoShare"`
	MatchComm      float64 `json:"matchCommission"`
	SessionComm    float64 `json:"sessionCommission"`
}

// Dashboard builds the summary for a user.
func (s *Service) Dashboard(ctx context.Context, id int64) (*Dashboard, error) {
	u, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &Dashboard{
		Username: u.Mstruserid, Name: u.Mstrname, Level: u.RoleName(),
		Balance: u.Balance, ProfitLoss: u.PL,
		MyMatchShare: u.PartnerCricket, CompMatchShare: 100 - u.PartnerCricket,
		MyCasinoShare: u.PartnerCasino, CompCasinoShr: 100 - u.PartnerCasino,
		MatchComm: u.Commission, SessionComm: u.SessionComm,
	}, nil
}

// SetLocks updates a user's account/betting locks and returns the fresh record.
func (s *Service) SetLocks(ctx context.Context, id int64, userLock, betLock *bool) (*User, error) {
	if err := s.store.SetLocks(ctx, id, userLock, betLock); err != nil {
		return nil, err
	}
	return s.store.GetByID(ctx, id)
}

// UpdateAccount updates a user's profile (name + phone) — reference updateAccount.
func (s *Service) UpdateAccount(ctx context.Context, id int64, name, phone string) (*User, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("name is required")
	}
	if err := s.store.UpdateProfile(ctx, id, name, nullStr(phone)); err != nil {
		return nil, err
	}
	return s.store.GetByID(ctx, id)
}

// UpdateProfileFields updates the Edit-Profile tab (name, no. of users, remark).
func (s *Service) UpdateProfileFields(ctx context.Context, id int64, name string, noOfChild int, remark string) (*User, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("name is required")
	}
	if noOfChild < 0 {
		noOfChild = 0
	}
	if err := s.store.UpdateAccountFields(ctx, id, name, noOfChild, nullStr(remark)); err != nil {
		return nil, err
	}
	return s.store.GetByID(ctx, id)
}

// AddCasinoLimit increments a user's casino limit (Casino Limit tab).
func (s *Service) AddCasinoLimit(ctx context.Context, id int64, amount float64) (*User, error) {
	if amount == 0 {
		return s.store.GetByID(ctx, id)
	}
	if err := s.store.AddCasinoLimit(ctx, id, amount); err != nil {
		return nil, err
	}
	return s.store.GetByID(ctx, id)
}

// UpdateCommission updates a user's commission/share/limit fields (doc §10).
func (s *Service) UpdateCommission(ctx context.Context, id int64, u CommissionUpdate) (*User, error) {
	if err := s.store.UpdateCommission(ctx, id, u); err != nil {
		return nil, err
	}
	return s.store.GetByID(ctx, id)
}

// Summary is the Commission & Limits footer (doc §10).
type Summary struct {
	Balance         float64 `json:"balance"`
	DownlineBalance float64 `json:"downlineBalance"`
	Exposure        float64 `json:"exposure"`
}

// Summary returns a user's balance, downline balance and exposure.
func (s *Service) Summary(ctx context.Context, id int64) (*Summary, error) {
	u, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	down, err := s.store.DownlineBalance(ctx, id)
	if err != nil {
		return nil, err
	}
	return &Summary{Balance: u.Balance, DownlineBalance: down, Exposure: u.Exposure}, nil
}

// DownlineBalance returns the total balance held across a user's entire downline
// subtree (all descendants). Powers the Commission & Limits "Down Bal" button.
func (s *Service) DownlineBalance(ctx context.Context, id int64) (float64, error) {
	return s.store.DownlineBalance(ctx, id)
}

// ListBlocked returns the locked direct children of a user (doc §9).
func (s *Service) ListBlocked(ctx context.Context, parentID int64) ([]User, error) {
	return s.store.ListBlocked(ctx, parentID)
}

// ParentInfo is one node in a user's upward hierarchy chain.
type ParentInfo struct {
	UserID   int64   `json:"userId"`
	Role     string  `json:"role"`
	Username string  `json:"username"`
	Name     string  `json:"name"`
	Share    float64 `json:"share"`
}

// GetParents walks from a username up to the root (doc §12 — Search Logs User).
func (s *Service) GetParents(ctx context.Context, username string) ([]ParentInfo, error) {
	u, err := s.store.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	chain := []ParentInfo{{UserID: u.ID, Role: u.RoleName(), Username: u.Mstruserid, Name: u.Mstrname, Share: u.PartnerCricket}}
	cur := u
	for cur.ParentID != nil {
		p, err := s.store.GetByID(ctx, *cur.ParentID)
		if err != nil {
			break
		}
		chain = append(chain, ParentInfo{UserID: p.ID, Role: p.RoleName(), Username: p.Mstruserid, Name: p.Mstrname, Share: p.PartnerCricket})
		cur = p
	}
	return chain, nil
}

// ResetUserPassword sets a new password on a downline user (parent-initiated,
// no old password required — doc clients-list "PWD" action). Recorded for the
// Password History report.
func (s *Service) ResetUserPassword(ctx context.Context, id int64, newPass, changerName, ip string) (*User, error) {
	u, err := s.store.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	hash, err := auth.HashPassword(newPass)
	if err != nil {
		return nil, err
	}
	if err := s.store.UpdatePassword(ctx, id, hash); err != nil {
		return nil, err
	}
	if s.pwdRecord != nil {
		s.pwdRecord.RecordPasswordChange(u.ID, u.Mstruserid, changerName, ip)
	}
	return u, nil
}

// ChangePassword verifies the old password and stores a new one, recording the
// change for the Password History report. changerName/ip describe who made it.
func (s *Service) ChangePassword(ctx context.Context, id int64, oldPass, newPass, changerName, ip string) error {
	u, err := s.store.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if !auth.CheckPassword(u.PasswordHash, oldPass) {
		return ErrInvalidCredentials
	}
	hash, err := auth.HashPassword(newPass)
	if err != nil {
		return err
	}
	if err := s.store.UpdatePassword(ctx, id, hash); err != nil {
		return err
	}
	if s.pwdRecord != nil {
		s.pwdRecord.RecordPasswordChange(u.ID, u.Mstruserid, changerName, ip)
	}
	return nil
}

// EnsureSuperDuperAdmin seeds the root account on first start (idempotent).
func (s *Service) EnsureSuperDuperAdmin(ctx context.Context, username, password string) error {
	n, err := s.store.CountByUsetype(ctx, domain.SuperDuperAdmin)
	if err != nil {
		return err
	}
	if n > 0 {
		// The root SDA holds the full 100/100 pie by definition (no casino
		// reserve). Normalize the seeded account in case it was created with an
		// older reserve so the dashboard reads 100/0.
		_ = s.store.SetRootShares(ctx, username)
		return nil
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}
	// The SDA holds 100% match/casino share by definition.
	_, err = s.store.Insert(ctx, &User{
		Mstruserid: username, Mstrname: "Super Duper Admin",
		PasswordHash: hash, Usetype: domain.SuperDuperAdmin, Status: true,
		PartnerCricket: 100, PartnerCasino: 100, IsPartnership: true, CreateNoOfChild: 1000000,
	})
	if err == nil {
		log.Printf("bootstrap: created Super Duper Admin %q", username)
	}
	return err
}

func orDefault(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}
