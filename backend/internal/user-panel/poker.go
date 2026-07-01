package userpanel

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// pokerOperatorCode is the fawk.app operator/partner id used in the launch URL.
// Defaults to the legacy dev id ('9767'); set POKER_PARTNER_ID to '9768' in prod.
func pokerOperatorCode() string {
	if v := os.Getenv("POKER_PARTNER_ID"); v != "" {
		return v
	}
	return "9767"
}

// pokerGetUrl returns the fawk.app poker launch URLs for the logged-in Player,
// built from their bearer token + the operator code — a faithful port of the
// legacy PokersController.getUrl. GET /api/user/poker/getUrl.
//
// The provider validates the embedded token via its /poker/auth callback (a
// separate, whitelisted integration not yet built on this backend), so the URL
// opens the provider splash screen; full in-game auth needs that callback.
func (m *Module) pokerGetUrl(c *fiber.Ctx) error {
	token := strings.TrimPrefix(c.Get(fiber.HeaderAuthorization), "Bearer ")
	code := pokerOperatorCode()
	return c.JSON(fiber.Map{
		"status":     true,
		"mobileUrl":  "https://m2.fawk.app/#/splash-screen/" + token + "/" + code,
		"desktopUrl": "https://d2.fawk.app/#/splash-screen/" + token + "/" + code,
	})
}

// pokerUserCasinoLimit returns the casino-limit gate the Poker page reads:
// { data: { casino_limit, data: [{ NetChips }] } }. The new backend has no
// casino-limit system yet (legacy sourced it from the company's casino_limit_logs
// + the _casino_setLimit SP), so casino_limit is omitted — the page reads that as
// NaN and enables the game. Wire real limits here when that infra lands.
// GET /api/user/poker/getUserCasinoLimit.
func (m *Module) pokerUserCasinoLimit(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"data": []any{},
		},
	})
}
