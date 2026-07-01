package userpanel

import (
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"

	"bsf2020/internal/catalog"
	"bsf2020/pkg/middleware"
)

// fancyPriorities mirrors the reference Settings.fancyPriorities — the session
// category buckets the panel uses for the Session filter.
var fancyPriorities = []fiber.Map{
	{"name": "Over Runs", "value": 1},
	{"name": "Wicket", "value": 3},
	{"name": "Player Run", "value": 2},
	{"name": "Others", "value": 4},
}

// matchFancies serves GET /api/user/matches/:id/fancies — the session/fancy
// catalog for a match (head name, limits, status). Live No/Yes prices arrive over
// the socket, so the price fields are returned empty here. Hierarchy-filtered: a
// sport blocked by an upline yields no fancies. Mirrors MatchesController.fancies.
func (m *Module) matchFancies(c *fiber.Ctx) error {
	matchID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": false, "message": "invalid match id"})
	}
	uid := middleware.User(c).UserID

	var sportID int64
	if err := m.db.GetContext(c.Context(), &sportID,
		`SELECT sport_id FROM matches WHERE id = ?`, matchID); err != nil {
		return c.JSON(fiber.Map{"data": []any{}, "priorities": []any{}, "fancyLimits": []any{}})
	}
	bSport, _ := catalog.AncestorBlockedIDs(c.Context(), m.db, uid, catalog.Sport)
	if bSport[strconv.FormatInt(sportID, 10)] {
		return c.JSON(fiber.Map{"data": []any{}, "priorities": []any{}, "fancyLimits": []any{}})
	}

	type fancyRow struct {
		ID          int64   `db:"id"`
		HeadName    string  `db:"head_name"`
		MatchID     int64   `db:"match_id"`
		MinStake    float64 `db:"min_stake"`
		MaxStake    float64 `db:"max_stake"`
		Status      string  `db:"status"`
		SelectionID *string `db:"selection_id"`
		IsManual    bool    `db:"is_manual"`
		SportID     int64   `db:"sport_id"`
	}
	var rows []fancyRow
	if err := m.db.SelectContext(c.Context(), &rows, `
		SELECT f.id, f.head_name, f.match_id, f.min_stake, f.max_stake,
		       f.status, f.selection_id, f.is_manual, mt.sport_id
		  FROM fancy f
		  JOIN matches mt ON mt.id = f.match_id
		 WHERE f.match_id = ? AND f.result IS NULL
		 ORDER BY f.id ASC`, matchID); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load fancies"})
	}

	// Effective fancy stake limits: the nearest ancestor's sport_limits row of
	// type FANCY for this sport wins; otherwise the fancy's own min/max apply
	// (mirrors the reference superadmin/company cascade, fallback to MinStake).
	fancyLim, hasFancyLim := m.resolveSportLimits(c, uid, sportID)["FANCY"]

	data := make([]fiber.Map, 0, len(rows))
	for _, f := range rows {
		sel := ""
		if f.SelectionID != nil {
			sel = *f.SelectionID
		}
		minStake, maxStake := f.MinStake, f.MaxStake
		if hasFancyLim {
			minStake, maxStake = fancyLim.MinStake, fancyLim.MaxStake
		}
		// The panel treats a fancy as bettable only when status is "OPEN" (legacy
		// matchfancy). bsf2020 stores "ACTIVE", so normalise it; other states
		// (CLOSED/SUSPENDED) pass through unchanged.
		status := f.Status
		if strings.EqualFold(status, "ACTIVE") {
			status = "OPEN"
		}
		data = append(data, fiber.Map{
			"ID":                     f.ID,
			"HeadName":               f.HeadName,
			"MatchID":                f.MatchID,
			"SprtId":                 f.SportID,
			"MinStake":               minStake,
			"MaxStake":               maxStake,
			"status":                 status,
			"ind_fancy_selection_id": sel,
			"is_indian_fancy":        boolToInt(f.IsManual),
			"Remarks":                "INDIAN_SESSION_FANCY",
			// Live values (filled by the socket; 0/0 → SUSPENDED until odds arrive).
			"SessInptYes": "",
			"SessInptNo":  "",
			"YesValume":   "",
			"NoValume":    "",
			"market_id":   nil,
		})
	}

	return c.JSON(fiber.Map{"data": data, "priorities": fancyPriorities, "fancyLimits": nil, "limits": nil})
}
