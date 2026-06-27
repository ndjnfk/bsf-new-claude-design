// Package middleware holds shared Fiber middleware for the monolith.
package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"bsf2020/pkg/auth"
	"bsf2020/pkg/domain"
	"bsf2020/pkg/httpx"
)

// UserCtx is the authenticated principal attached to a request. For a helper,
// UserID/Usetype are the parent's (the acting context) and IsHelper/ActorID/
// Permissions describe the helper itself.
type UserCtx struct {
	UserID      int64
	Username    string
	Usetype     domain.Usetype
	IsHelper    bool
	ActorID     int64
	Permissions []string
}

// HasPermission reports whether the principal holds a named permission.
func (u UserCtx) HasPermission(perm string) bool {
	for _, p := range u.Permissions {
		if p == perm {
			return true
		}
	}
	return false
}

const localsKey = "userctx"

// RequireAuth validates the bearer JWT and attaches the principal.
func RequireAuth(secret string) fiber.Handler {
	return RequireAuthRole(secret)
}

// RequireAuthRole validates the bearer JWT and, when one or more usetypes are
// given, requires the principal to be one of them (403 otherwise). With no
// usetypes it behaves like RequireAuth (any authenticated user).
func RequireAuthRole(secret string, allowed ...domain.Usetype) fiber.Handler {
	set := make(map[domain.Usetype]struct{}, len(allowed))
	for _, a := range allowed {
		set[a] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		h := c.Get(fiber.HeaderAuthorization)
		if !strings.HasPrefix(h, "Bearer ") {
			return httpx.Unauthorized(c, "missing bearer token")
		}
		claims, err := auth.Verify(secret, strings.TrimPrefix(h, "Bearer "))
		if err != nil {
			return httpx.Unauthorized(c, "invalid token")
		}
		if len(set) > 0 {
			if _, ok := set[claims.Usetype]; !ok {
				return httpx.Forbidden(c, "insufficient role")
			}
		}
		c.Locals(localsKey, UserCtx{
			UserID: claims.UserID, Username: claims.Username, Usetype: claims.Usetype,
			IsHelper: claims.IsHelper, ActorID: claims.ActorID, Permissions: claims.Permissions,
		})
		return c.Next()
	}
}

// RequirePermission gates an action by helper permission. Non-helpers pass
// through (their role is already gated by RequireAuthRole); a helper must hold
// the named permission.
func RequirePermission(perm string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		u := User(c)
		if !u.IsHelper {
			return c.Next()
		}
		if !u.HasPermission(perm) {
			return httpx.Forbidden(c, "helper not permitted: "+perm)
		}
		return c.Next()
	}
}

// RequireSuperAdmin allows only a real Super Duper Admin — NOT a helper acting
// in an SDA's context. Use it for pure-global config (settings, domains, casino,
// content, surveillance) that has no per-helper permission and must never be
// delegated to a worker account.
func RequireSuperAdmin(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		h := c.Get(fiber.HeaderAuthorization)
		if !strings.HasPrefix(h, "Bearer ") {
			return httpx.Unauthorized(c, "missing bearer token")
		}
		claims, err := auth.Verify(secret, strings.TrimPrefix(h, "Bearer "))
		if err != nil {
			return httpx.Unauthorized(c, "invalid token")
		}
		if claims.Usetype != domain.SuperDuperAdmin || claims.IsHelper {
			return httpx.Forbidden(c, "super duper admin only")
		}
		c.Locals(localsKey, UserCtx{
			UserID: claims.UserID, Username: claims.Username, Usetype: claims.Usetype,
			IsHelper: claims.IsHelper, ActorID: claims.ActorID, Permissions: claims.Permissions,
		})
		return c.Next()
	}
}

// User returns the authenticated principal from the request context.
func User(c *fiber.Ctx) UserCtx {
	if v, ok := c.Locals(localsKey).(UserCtx); ok {
		return v
	}
	return UserCtx{}
}

// RequireUsetype restricts a route to the listed roles.
func RequireUsetype(allowed ...domain.Usetype) fiber.Handler {
	set := make(map[domain.Usetype]struct{}, len(allowed))
	for _, a := range allowed {
		set[a] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		if _, ok := set[User(c).Usetype]; !ok {
			return httpx.Forbidden(c, "insufficient role")
		}
		return c.Next()
	}
}
