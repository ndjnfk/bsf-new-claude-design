package identity

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"

	"bsf2020/pkg/domain"
	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// HTTP exposes identity endpoints.
type HTTP struct{ svc *Service }

// NewHTTP wires handlers to the service.
func NewHTTP(svc *Service) *HTTP { return &HTTP{svc: svc} }

// Register mounts identity routes under the given router. requireAuth is the
// JWT middleware supplied by the app.
func (h *HTTP) Register(api fiber.Router, requireAuth fiber.Handler) {
	api.Post("/auth/login", h.login)

	prot := api.Group("", requireAuth)
	prot.Get("/auth/me", h.me)
	prot.Post("/auth/change-password", h.changePassword)
	prot.Get("/dashboard", h.dashboard)

	// "Super Duper Admin creates Company only" — enforced by role middleware
	// and again in the service layer.
	prot.Post("/users/company", middleware.RequireUsetype(domain.SuperDuperAdmin), h.createCompany)
	prot.Get("/users/company", h.listCompanies)

	// A Super Duper Admin may create another Super Duper Admin (new root tree).
	prot.Post("/users/super-admin", middleware.RequireUsetype(domain.SuperDuperAdmin), h.createSuperAdmin)

	// Generic downline endpoints — work for every tier (the role each user may
	// create is derived from its own usetype, enforced by CreateChild).
	prot.Get("/users/username-available", h.usernameAvailable)
	prot.Get("/users/children", h.listChildren)
	prot.Post("/users/children", h.createChild)
	prot.Get("/collection-report", h.collectionReport)

	prot.Get("/users/blocked", h.listBlocked)
	prot.Get("/users/parents", h.parents)
	prot.Get("/users/summary", h.summary)
	prot.Post("/users/:id/lock", h.setLocks)
	prot.Post("/users/:id/password", h.resetUserPassword)
	prot.Put("/users/:id/commission", h.updateCommission)
	prot.Put("/users/:id/account", h.updateAccount)
	prot.Put("/users/:id/casino-limit", h.addCasinoLimit)
	prot.Get("/users/:id/children", h.userChildren)                 // a selected user's downline (Direct Agents/Client)
	prot.Get("/users/:id/downline-balance", h.downlineBalance)      // Down Bal — full subtree balance
	prot.Get("/users/:id", h.getUser)                               // Client Dashboard — must be after the static /users/* routes
}

func (h *HTTP) userChildren(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	u, err := h.svc.Me(c.Context(), int64(id))
	if err != nil {
		return httpx.NotFound(c, "user not found")
	}
	list, err := h.svc.ListMyChildren(c.Context(), u, nil, c.Query("search"))
	if err != nil {
		return httpx.Internal(c, "failed to list downline")
	}
	return httpx.OK(c, list)
}

func (h *HTTP) resetUserPassword(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	var body struct {
		NewPassword string `json:"newPassword"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.NewPassword) < 4 {
		return httpx.BadRequest(c, "new password too short")
	}
	uc := middleware.User(c)
	if _, err := h.svc.ResetUserPassword(c.Context(), int64(id), body.NewPassword, uc.Username, c.IP()); err != nil {
		return httpx.Internal(c, "failed to reset password")
	}
	return httpx.OK(c, fiber.Map{"changed": true})
}

func (h *HTTP) downlineBalance(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	sum, err := h.svc.DownlineBalance(c.Context(), int64(id))
	if err != nil {
		return httpx.Internal(c, "failed to compute downline balance")
	}
	return httpx.OK(c, fiber.Map{"downlineBalance": sum})
}

func (h *HTTP) getUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	u, err := h.svc.Me(c.Context(), int64(id))
	if err != nil {
		return httpx.NotFound(c, "user not found")
	}
	return httpx.OK(c, u)
}

func (h *HTTP) login(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	res, err := h.svc.Login(c.Context(), body.Username, body.Password, LoginMeta{
		IP: c.IP(), UserAgent: c.Get(fiber.HeaderUserAgent),
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials):
			return httpx.Unauthorized(c, "invalid username or password")
		case errors.Is(err, ErrLocked):
			return httpx.Forbidden(c, "account is locked")
		default:
			log.Printf("login error for %q: %v", body.Username, err) // surfaces the real cause (e.g. missing column)
			return httpx.Internal(c, "login failed")
		}
	}
	return httpx.OK(c, res)
}

func (h *HTTP) me(c *fiber.Ctx) error {
	u, err := h.svc.Me(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return httpx.NotFound(c, "user not found")
	}
	return httpx.OK(c, u)
}

func (h *HTTP) dashboard(c *fiber.Ctx) error {
	d, err := h.svc.Dashboard(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return httpx.Internal(c, "failed to load dashboard")
	}
	return httpx.OK(c, d)
}

func (h *HTTP) createCompany(c *fiber.Ctx) error {
	creator, err := h.svc.Me(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return httpx.Unauthorized(c, "unknown creator")
	}
	var in CreateUserInput
	if err := c.BodyParser(&in); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	u, err := h.svc.CreateChild(c.Context(), creator, in)
	if err != nil {
		switch {
		case errors.Is(err, ErrUsernameTaken):
			return httpx.Err(c, fiber.StatusConflict, "username already taken")
		case errors.Is(err, ErrForbiddenRole):
			return httpx.Forbidden(c, "not allowed to create this role")
		default:
			return httpx.BadRequest(c, err.Error())
		}
	}
	return httpx.Created(c, u)
}

func (h *HTTP) createSuperAdmin(c *fiber.Ctx) error {
	uc := middleware.User(c)
	if uc.IsHelper {
		return httpx.Forbidden(c, "a helper cannot create a super duper admin")
	}
	creator, err := h.svc.Me(c.Context(), uc.UserID)
	if err != nil {
		return httpx.Unauthorized(c, "unknown creator")
	}
	var in CreateUserInput
	if err := c.BodyParser(&in); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	u, err := h.svc.CreateSuperAdmin(c.Context(), creator, in)
	if err != nil {
		switch {
		case errors.Is(err, ErrUsernameTaken):
			return httpx.Err(c, fiber.StatusConflict, "username already taken")
		case errors.Is(err, ErrForbiddenRole):
			return httpx.Forbidden(c, "only a super duper admin can create one")
		default:
			return httpx.BadRequest(c, err.Error())
		}
	}
	return httpx.Created(c, u)
}

func (h *HTTP) listCompanies(c *fiber.Ctx) error {
	var status *bool
	switch c.Query("status") {
	case "1":
		t := true
		status = &t
	case "0":
		f := false
		status = &f
	}
	list, err := h.svc.ListCompanies(c.Context(), middleware.User(c).UserID, status, c.Query("search"))
	if err != nil {
		return httpx.Internal(c, "failed to list companies")
	}
	return httpx.OK(c, list)
}

func (h *HTTP) usernameAvailable(c *fiber.Ctx) error {
	available, err := h.svc.UsernameAvailable(c.Context(), c.Query("username"))
	if err != nil {
		return httpx.Internal(c, "check failed")
	}
	return httpx.OK(c, fiber.Map{"available": available})
}

func (h *HTTP) listChildren(c *fiber.Ctx) error {
	creator, err := h.svc.Me(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return httpx.Unauthorized(c, "unknown user")
	}
	var status *bool
	switch c.Query("status") {
	case "1":
		t := true
		status = &t
	case "0":
		f := false
		status = &f
	}
	list, err := h.svc.ListMyChildren(c.Context(), creator, status, c.Query("search"))
	if err != nil {
		return httpx.Internal(c, "failed to list downline")
	}
	return httpx.OK(c, list)
}

func (h *HTTP) createChild(c *fiber.Ctx) error {
	creator, err := h.svc.Me(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return httpx.Unauthorized(c, "unknown creator")
	}
	var in CreateUserInput
	if err := c.BodyParser(&in); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	u, err := h.svc.CreateChild(c.Context(), creator, in)
	if err != nil {
		switch {
		case errors.Is(err, ErrUsernameTaken):
			return httpx.Err(c, fiber.StatusConflict, "username already taken")
		case errors.Is(err, ErrForbiddenRole):
			return httpx.Forbidden(c, "your role cannot create downline users")
		default:
			return httpx.BadRequest(c, err.Error())
		}
	}
	return httpx.Created(c, u)
}

func (h *HTTP) collectionReport(c *fiber.Ctx) error {
	rep, err := h.svc.CollectionReport(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return httpx.Internal(c, "failed to build collection report")
	}
	return httpx.OK(c, rep)
}

func (h *HTTP) listBlocked(c *fiber.Ctx) error {
	list, err := h.svc.ListBlocked(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return httpx.Internal(c, "failed to list blocked users")
	}
	return httpx.OK(c, list)
}

func (h *HTTP) parents(c *fiber.Ctx) error {
	username := c.Query("username")
	if username == "" {
		return httpx.BadRequest(c, "username is required")
	}
	chain, err := h.svc.GetParents(c.Context(), username)
	if err != nil {
		return httpx.NotFound(c, "user not found")
	}
	return httpx.OK(c, chain)
}

func (h *HTTP) summary(c *fiber.Ctx) error {
	s, err := h.svc.Summary(c.Context(), middleware.User(c).UserID)
	if err != nil {
		return httpx.Internal(c, "failed to load summary")
	}
	return httpx.OK(c, s)
}

func (h *HTTP) updateAccount(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	var body struct {
		Name      string `json:"name"`
		Phone     string `json:"phone"`
		NoOfChild *int   `json:"noOfChild"`
		Remark    string `json:"remark"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	// Edit-Profile tab sends noOfChild/remark; the older callers send name/phone.
	var u *User
	if body.NoOfChild != nil {
		u, err = h.svc.UpdateProfileFields(c.Context(), int64(id), body.Name, *body.NoOfChild, body.Remark)
	} else {
		u, err = h.svc.UpdateAccount(c.Context(), int64(id), body.Name, body.Phone)
	}
	if err != nil {
		return httpx.BadRequest(c, err.Error())
	}
	return httpx.OK(c, u)
}

func (h *HTTP) addCasinoLimit(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	var body struct {
		Add float64 `json:"add"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	u, err := h.svc.AddCasinoLimit(c.Context(), int64(id), body.Add)
	if err != nil {
		return httpx.BadRequest(c, err.Error())
	}
	return httpx.OK(c, u)
}

func (h *HTTP) updateCommission(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	var body CommissionUpdate
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	u, err := h.svc.UpdateCommission(c.Context(), int64(id), body)
	if err != nil {
		return httpx.Internal(c, "failed to update commission")
	}
	return httpx.OK(c, u)
}

func (h *HTTP) setLocks(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	var body struct {
		UserLock *bool `json:"userLock"`
		BetLock  *bool `json:"betLock"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	u, err := h.svc.SetLocks(c.Context(), int64(id), body.UserLock, body.BetLock)
	if err != nil {
		return httpx.Internal(c, "failed to update locks")
	}
	return httpx.OK(c, u)
}

func (h *HTTP) changePassword(c *fiber.Ctx) error {
	// A helper's token acts in the parent's context, so this self-change would
	// target the parent — block it. Helper passwords are managed via Add Worker.
	if middleware.User(c).IsHelper {
		return httpx.Forbidden(c, "helper password is managed by the parent")
	}
	var body struct {
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest(c, "invalid body")
	}
	if len(body.NewPassword) < 4 {
		return httpx.BadRequest(c, "new password too short")
	}
	uc := middleware.User(c)
	if err := h.svc.ChangePassword(c.Context(), uc.UserID, body.OldPassword, body.NewPassword, uc.Username, c.IP()); err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			return httpx.BadRequest(c, "old password is incorrect")
		}
		return httpx.Internal(c, "failed to change password")
	}
	return httpx.OK(c, fiber.Map{"changed": true})
}
