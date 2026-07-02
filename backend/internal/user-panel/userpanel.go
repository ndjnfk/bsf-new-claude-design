// Package userpanel serves the bettor "User Panel" API (end users — Player,
// usetype 3) under /api/user. It reuses the identity service for authentication but
// presents the Adonis-shaped responses the React user panel consumes, and restricts
// access to Players only (management tiers use the admin API).
package userpanel

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"go.mongodb.org/mongo-driver/mongo"

	"bsf2020/internal/identity"
	"bsf2020/pkg/domain"
	"bsf2020/pkg/events"
	"bsf2020/pkg/middleware"
)

// defaultStakes seeds the quick-stake buttons until the user customizes them.
var defaultStakes = []int{100, 500, 1000, 2000, 5000}

// Module is the User Panel HTTP module.
type Module struct {
	ident        *identity.Service
	db           *sqlx.DB
	bets         *mongo.Collection // bettor's bets (Mongo) — powers the per-match ledger
	userLoginLog *mongo.Collection // enriched Player login records (Login History page)
	userPwdLog   *mongo.Collection // Player password-change records (Password History page)
	pub          events.Publisher  // native-WS publisher for live fancy rates
}

// New builds the module. pub may be nil (realtime disabled) — the fancy poller is
// simply skipped in that case.
func New(ident *identity.Service, db *sqlx.DB, mongoDB *mongo.Database, pub events.Publisher) *Module {
	return &Module{
		ident:        ident,
		db:           db,
		bets:         mongoDB.Collection("bets"),
		userLoginLog: mongoDB.Collection("user_login_history"),
		userPwdLog:   mongoDB.Collection("user_password_history"),
		pub:          pub,
	}
}

// Register mounts the User Panel routes under /api/user. login is public; the rest
// are authenticated (Player session restore, catalog views).
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/user")
	g.Post("/login", m.login)
	g.Get("/me", requireAuth, m.me)
	g.Post("/changePassword", requireAuth, m.changePassword)
	// Catalog views, scoped by the parent block cascade (blocked sports/matches
	// are hidden from the bettor — see dashboard.go).
	g.Get("/sports", requireAuth, m.sports)
	g.Get("/dashboard", requireAuth, m.dashboard)
	// Every betting market for a match, hierarchy-filtered + limits applied.
	g.Get("/matches/:id/markets", requireAuth, m.matchMarkets)
	// Session/fancy markets for a match (live No/Yes prices arrive via socket).
	g.Get("/matches/:id/fancies", requireAuth, m.matchFancies)
	// The bettor's own ledger for the Account Statement page.
	g.Get("/accountStatement", requireAuth, m.accountStatement)
	// Per-match net P&L list for the Ledger page.
	g.Get("/ledger", requireAuth, m.ledger)
	// Profit & Loss page: per-event totals + per-market drill-down.
	g.Post("/profitLoss", requireAuth, m.profitLoss)
	g.Post("/profitLossByMatch", requireAuth, m.profitLossByMatch)
	// Poker page: launch URLs + the casino-limit gate.
	g.Get("/poker/getUrl", requireAuth, m.pokerGetUrl)
	g.Get("/poker/getUserCasinoLimit", requireAuth, m.pokerUserCasinoLimit)
	// Login History page: the Player's own login records.
	g.Get("/loginHistory", requireAuth, m.loginHistory)
	// Password History page: the Player's own password-change records.
	g.Get("/passwordHistory", requireAuth, m.passwordHistory)
	// Bet History page: the Player's own bets (matched / past).
	g.Post("/betHistory", requireAuth, m.betHistory)
}

// playerUser builds the Adonis-shaped user object the React panel consumes.
func playerUser(u *identity.User, token string) fiber.Map {
	return fiber.Map{
		"TokenId":                token,
		"mstrid":                 u.ID,
		"usetype":                int(u.Usetype),
		"mstruserid":             u.Mstruserid,
		"mstrname":               u.Mstrname,
		"balance":                u.Balance,
		"liability":              u.Exposure,
		"allow_deposit_withdraw": u.AllowDepositWithdraw,
		"bet_lock":               u.BetLock,
		"parentId":               u.ParentID,
		"stakes":                 defaultStakes,
		"change_password":        false,
	}
}

// changePassword lets a Player change their own password from the User Panel. The
// React panel posts { old_password, newpassword, Renewpassword } and expects an
// Adonis-shaped { status, message } reply; on "Password has been changed." it logs
// the user out. Reuses the identity service (same store the admin API uses).
func (m *Module) changePassword(c *fiber.Ctx) error {
	var body struct {
		OldPassword   string `json:"old_password"`
		NewPassword   string `json:"newpassword"`
		ReNewPassword string `json:"Renewpassword"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": false, "message": "invalid request"})
	}
	if body.OldPassword == "" || body.NewPassword == "" || body.ReNewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": false, "message": "all fields are required"})
	}
	if body.NewPassword != body.ReNewPassword {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": false, "message": "New and Confirm Password do not match"})
	}
	if len(body.NewPassword) < 4 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": false, "message": "new password too short"})
	}
	uc := middleware.User(c)
	if err := m.ident.ChangePassword(c.Context(), uc.UserID, body.OldPassword, body.NewPassword, uc.Username, c.IP()); err != nil {
		if errors.Is(err, identity.ErrInvalidCredentials) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": false, "message": "old password is incorrect"})
		}
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to change password"})
	}
	// Record the change for the Password History page (self-change: target and
	// changer are the same Player; ip from the request, created_at = server time).
	m.recordPasswordChange(uc.UserID, uc.Username, uc.Username, c.IP())
	return c.JSON(fiber.Map{"status": true, "message": "Password has been changed."})
}

// me restores the current Player session (refresh). The panel keeps the JWT it got
// at login in sessionStorage, so no new token is issued here.
func (m *Module) me(c *fiber.Ctx) error {
	u, err := m.ident.Me(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"status": false, "message": "session expired"})
	}
	if u.Usetype != domain.Player {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"status": false, "message": "this panel is for players only"})
	}
	return c.JSON(fiber.Map{
		"user":               playerUser(u, ""),
		"domain":             nil,
		"banners":            []any{},
		"systemMaintainance": false,
	})
}

// login authenticates a Player (usetype 3) and returns the session in the shape the
// React user panel expects: { user: { TokenId, mstrid, usetype, … }, change_password }.
// The JWT is returned as user.TokenId; the panel stores it in sessionStorage and
// sends it as `Authorization: Bearer <token>` on subsequent calls.
func (m *Module) login(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
		// Best-effort geolocation the panel enriches the login with (may be empty).
		City   string `json:"city"`
		Region string `json:"region"`
		Org    string `json:"org"`
	}
	if err := c.BodyParser(&body); err != nil || body.Username == "" || body.Password == "" {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": false, "message": "username and password are required"})
	}

	res, err := m.ident.Login(c.Context(), body.Username, body.Password, identity.LoginMeta{
		IP: c.IP(), UserAgent: c.Get(fiber.HeaderUserAgent),
	})
	if err != nil {
		switch {
		case errors.Is(err, identity.ErrInvalidCredentials):
			return c.Status(fiber.StatusBadRequest).
				JSON(fiber.Map{"status": false, "message": "invalid username or password"})
		case errors.Is(err, identity.ErrLocked):
			return c.Status(fiber.StatusForbidden).
				JSON(fiber.Map{"status": false, "message": "account is locked"})
		default:
			return c.Status(fiber.StatusInternalServerError).
				JSON(fiber.Map{"status": false, "message": "login failed"})
		}
	}

	u := res.User
	// The User Panel is for end users (Players) only — management tiers log into the
	// admin panel instead.
	if u.Usetype != domain.Player {
		return c.Status(fiber.StatusForbidden).
			JSON(fiber.Map{"status": false, "message": "this panel is for players only"})
	}

	// Record the login for the Login History page (ip from the request, device from
	// the User-Agent, city/region/org from the payload).
	m.recordUserLogin(u.ID, u.Mstruserid, c.IP(), c.Get(fiber.HeaderUserAgent), body.City, body.Region, body.Org)

	// change_password=true would force the panel to the change-password screen on
	// login; default to false so the user lands in the app. Wire to a real
	// "must change password" flag when that flow is needed.
	return c.JSON(fiber.Map{
		"status":          true,
		"message":         "Login successful",
		"change_password": false,
		"user":            playerUser(u, res.Token),
	})
}
