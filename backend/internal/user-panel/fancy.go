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

	var meta struct {
		SportID int64   `db:"sport_id"`
		FeedID  *string `db:"feed_id"`
	}
	if err := m.db.GetContext(c.Context(), &meta,
		`SELECT sport_id, feed_id FROM matches WHERE id = ?`, matchID); err != nil {
		return c.JSON(fiber.Map{"data": []any{}, "priorities": []any{}, "fancyLimits": []any{}})
	}
	sportID := meta.SportID
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
		Message     *string `db:"message"`
		SportID     int64   `db:"sport_id"`
	}
	var rows []fancyRow
	if err := m.db.SelectContext(c.Context(), &rows, `
		SELECT f.id, f.head_name, f.match_id, f.min_stake, f.max_stake,
		       f.status, f.selection_id, f.is_manual, f.message, mt.sport_id
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
		message := ""
		if f.Message != nil {
			message = *f.Message
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
			"ID":       f.ID,
			"HeadName": f.HeadName,
			"MatchID":  f.MatchID,
			"SprtId":   f.SportID,
			"MinStake": minStake,
			"MaxStake": maxStake,
			// Alias keys the reference/table also read for limit resolution.
			"min_stack": minStake,
			"max_stack": maxStake,
			"status":    status,
			// These are Indian session fancies → is_indian_fancy is always 1, so the
			// socket's updateFancyData (which requires === 1) can match on selection.
			"is_indian_fancy":        1,
			"ind_fancy_selection_id": sel,
			"Remarks":                "INDIAN_SESSION_FANCY",
			// Session bucket for the Session sub-tabs (Over Runs / Wicket / Player
			// Run / Others). Best-effort from the head name until the provider feed
			// supplies a real priority.
			"in_priority": fancyPriority(f.HeadName),
			"message":     message,
			"active":      1,
			"hasResult":   false,
			"TypeID":      3,
			"pointDiff":   1,
			// Live values (filled by the socket; 0/0 → SUSPENDED until rates arrive).
			"SessInptYes": "",
			"SessInptNo":  "",
			"YesValume":   "",
			"NoValume":    "",
			"market_id":   nil,
		})
	}

	// Merge live third-party session fancies (with rates) ahead of the manual ones.
	// Best-effort: if the feed is unreachable we just keep the manual list.
	if meta.FeedID != nil && *meta.FeedID != "" {
		if tp, ferr := fetchThirdPartyFancies(c.Context(), *meta.FeedID); ferr == nil && len(tp) > 0 {
			tpMin, tpMax := 0.0, 0.0
			if hasFancyLim {
				tpMin, tpMax = fancyLim.MinStake, fancyLim.MaxStake
			}
			seen := make(map[string]bool, len(tp))
			tpData := make([]fiber.Map, 0, len(tp))
			for _, f := range tp {
				if f.SelectionID != "" {
					seen[f.SelectionID] = true
				}
				tpData = append(tpData, fiber.Map{
					"ID":                     f.SelectionID,
					"HeadName":               f.HeadName,
					"MatchID":                matchID,
					"SprtId":                 sportID,
					"MinStake":               tpMin,
					"MaxStake":               tpMax,
					"min_stack":              tpMin,
					"max_stack":              tpMax,
					"status":                 f.Status,
					"is_indian_fancy":        1,
					"ind_fancy_selection_id": f.SelectionID,
					"Remarks":                "INDIAN_SESSION_FANCY",
					"in_priority":            f.Priority,
					"message":                "",
					"active":                 1,
					"hasResult":              f.HasResult,
					"TypeID":                 3,
					"pointDiff":              1,
					"SessInptYes":            f.Yes,
					"YesValume":              f.YesSize,
					"SessInptNo":             f.No,
					"NoValume":               f.NoSize,
					"market_id":              nil,
				})
			}
			// Keep manual fancies the feed didn't already provide.
			kept := make([]fiber.Map, 0, len(data))
			for _, d := range data {
				if sel, _ := d["ind_fancy_selection_id"].(string); sel != "" && seen[sel] {
					continue
				}
				kept = append(kept, d)
			}
			data = append(tpData, kept...)
		}
	}

	// Fancy sport-limit for this user (mirrors the reference `limits` array).
	var limits any
	if hasFancyLim {
		limits = []fiber.Map{{"type": "fancy", "min_stake": fancyLim.MinStake, "max_stake": fancyLim.MaxStake}}
	}

	return c.JSON(fiber.Map{"data": data, "priorities": fancyPriorities, "fancyLimits": nil, "limits": limits})
}

// fancyPriority buckets a fancy into the Session sub-tab priority from its head
// name (Over Runs=1, Player Run=2, Wicket=3, Others=4). Best-effort keyword match
// — replace with a real feed-supplied priority when fancy ingestion is built.
func fancyPriority(headName string) int {
	h := strings.ToLower(headName)
	switch {
	case strings.Contains(h, "wkt"), strings.Contains(h, "wicket"):
		return 3
	case strings.Contains(h, "over") && strings.Contains(h, "run"):
		return 1
	case strings.Contains(h, "run"):
		return 2
	default:
		return 4
	}
}
