package userpanel

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bsf2020/pkg/middleware"
)

// betHistory returns the logged-in Player's own bets for the Bet History page.
// bet_type: "M" (matched — open bets, result not yet declared) | "P" (past —
// settled bets). Date range filters createdAt. Response is DOUBLE-wrapped
// { data: { data:[...], meta } } exactly as the page reads. POST /api/user/betHistory.
func (m *Module) betHistory(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	var body struct {
		PageNo   int    `json:"page_no"`
		SportID  string `json:"sport_id"`
		FromDate string `json:"from_date"`
		ToDate   string `json:"to_date"`
		BetType  string `json:"bet_type"` // M matched | P past
		Type     int    `json:"type"`
		Limit    int    `json:"limit"`
	}
	_ = c.BodyParser(&body)
	page := body.PageNo
	if page < 1 {
		page = 1
	}
	limit := body.Limit
	if limit < 1 || limit > 200 {
		limit = 50
	}

	filter := bson.M{"userId": userID}
	// Matched = open (unsettled); Past = settled (after result).
	filter["settled"] = body.BetType == "P"
	if rng := dateRange(body.FromDate, body.ToDate); rng != nil {
		filter["createdAt"] = rng
	}

	total, err := m.bets.CountDocuments(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to count bet history"})
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(int64((page - 1) * limit)).
		SetLimit(int64(limit))
	cur, err := m.bets.Find(c.Context(), filter, opts)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load bet history"})
	}
	type betDoc struct {
		MatchID   int64     `bson:"matchId"`
		MarketID  string    `bson:"marketId"`
		BetType   string    `bson:"betType"`
		Selection string    `bson:"selection"`
		Side      string    `bson:"side"`
		Price     float64   `bson:"price"`
		Stake     float64   `bson:"stake"`
		Settled   bool      `bson:"settled"`
		PL        float64   `bson:"pl"`
		CreatedAt time.Time `bson:"createdAt"`
	}
	bets := make([]betDoc, 0, limit)
	if err := cur.All(c.Context(), &bets); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to decode bet history"})
	}

	// Join match names + sport names for the Description column.
	type matchInfo struct {
		name    string
		sportID int64
	}
	matches := map[int64]matchInfo{}
	sportNames := map[int64]string{}
	if len(bets) > 0 {
		ids := make([]int64, 0, len(bets))
		for _, b := range bets {
			ids = append(ids, b.MatchID)
		}
		if q, args, qerr := sqlx.In(`SELECT id, name, sport_id FROM matches WHERE id IN (?)`, ids); qerr == nil {
			var mr []struct {
				ID      int64  `db:"id"`
				Name    string `db:"name"`
				SportID int64  `db:"sport_id"`
			}
			if m.db.SelectContext(c.Context(), &mr, m.db.Rebind(q), args...) == nil {
				sids := make([]int64, 0, len(mr))
				for _, r := range mr {
					matches[r.ID] = matchInfo{name: r.Name, sportID: r.SportID}
					sids = append(sids, r.SportID)
				}
				if sq, sargs, serr := sqlx.In(`SELECT id, name FROM sports WHERE id IN (?)`, sids); serr == nil {
					var sr []struct {
						ID   int64  `db:"id"`
						Name string `db:"name"`
					}
					if m.db.SelectContext(c.Context(), &sr, m.db.Rebind(sq), sargs...) == nil {
						for _, s := range sr {
							sportNames[s.ID] = s.Name
						}
					}
				}
			}
		}
	}

	rows := make([]fiber.Map, 0, len(bets))
	for _, b := range bets {
		mi := matches[b.MatchID]
		sport := sportNames[mi.sportID]
		side := "Lay"
		isBack := 0
		if b.Side == "back" {
			side, isBack = "Back", 1
		}
		status := "Open"
		if b.Settled {
			status = "Settled"
		}
		isFancy := 0
		if b.BetType == "fancy" {
			isFancy = 1
		}
		rows = append(rows, fiber.Map{
			"Description":   sport + ">" + mi.name + ">" + b.Selection,
			"Type":          side,
			"Odds":          b.Price,
			"Stack":         b.Stake,
			"MstDate":       b.CreatedAt,
			"MatchId":       b.MatchID,
			"MarketId":      b.MarketID,
			"matchName":     mi.name,
			"sportName":     sport,
			"selectionName": b.Selection,
			"isBack":        isBack,
			"is_fancy":      isFancy,
			"P_L":           b.PL,
			"STATUS":        status,
		})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"data": rows,
			"meta": fiber.Map{"total": total, "per_page": limit, "current_page": page},
		},
	})
}
