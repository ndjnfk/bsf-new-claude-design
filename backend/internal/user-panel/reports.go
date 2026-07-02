package userpanel

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"bsf2020/pkg/middleware"
)

// accountStatement returns the logged-in Player's own ledger in the shape the
// React Account Statement table consumes: {data, meta, openingBalance}. It mirrors
// the legacy Adonis /accountStatement contract — query params (from_date, to_date,
// transaction_type, type, page, limit) and row field names (Sdate, Narration,
// Credit, Debit, balance) — so the page renders unchanged. Unlike the admin report,
// a bettor may only ever see their OWN statement, so there is no user_id override.
func (m *Module) accountStatement(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID

	fromDate := c.Query("from_date")
	toDate := c.Query("to_date")
	tranType := c.Query("transaction_type", "all") // all | DR | CR
	acctType := c.Query("type", "all")             // all | 1 Ledger | 2 Commission | 4 Credit Limit (UI category)
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	limit := c.QueryInt("limit", 50)
	if limit < 1 || limit > 500 {
		limit = 50
	}

	// Filters shared by the count, the page and the opening balance (everything
	// except the date window) so the running balance stays consistent.
	where := []string{"user_id = ?"}
	args := []any{userID}
	// The panel's Type filter uses the documented category ids, but the ledger
	// rows are stamped with the STORAGE account_type the shared wallet/betting
	// layers already use — which the admin panel also reads. So we translate the
	// UI category to the stored account_type here (read side only) rather than
	// re-stamping the shared write path. Storage codes: 1 = cash deposit/withdraw,
	// 3 = match/bet + settlement (2 = commission, reserved).
	switch acctType {
	case "1": // Ledger → match / bet transactions
		where = append(where, "account_type = 3")
	case "2": // Commission
		where = append(where, "account_type = 2")
	case "4": // Credit Limit → parent deposit / withdraw (coins)
		where = append(where, "account_type = 1")
		// "all" (or anything else) → no account_type filter
	}
	switch strings.ToUpper(tranType) {
	case "DR":
		where = append(where, "debit > 0")
	case "CR":
		where = append(where, "credit > 0")
	}

	// The date window bounds the visible page + count, but NOT the opening balance
	// (which is the balance carried INTO the window).
	dateWhere := append([]string{}, where...)
	dateArgs := append([]any{}, args...)
	if fromDate != "" {
		dateWhere = append(dateWhere, "created_at >= ?")
		dateArgs = append(dateArgs, fromDate+" 00:00:00")
	}
	if toDate != "" {
		dateWhere = append(dateWhere, "created_at <= ?")
		dateArgs = append(dateArgs, toDate+" 23:59:59")
	}
	whereSQL := strings.Join(dateWhere, " AND ")

	// Total for pagination meta.
	var total int
	if err := m.db.GetContext(c.Context(), &total,
		`SELECT COUNT(*) FROM account_statement WHERE `+whereSQL, dateArgs...); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to count statement"})
	}

	// Opening balance = balance_after of the last transaction strictly before
	// from_date (same non-date filters). 0 when there is no earlier row / no
	// from_date.
	var openingBalance float64
	if fromDate != "" {
		obWhere := append(append([]string{}, where...), "created_at < ?")
		obArgs := append(append([]any{}, args...), fromDate+" 00:00:00")
		_ = m.db.GetContext(c.Context(), &openingBalance,
			`SELECT balance_after FROM account_statement WHERE `+strings.Join(obWhere, " AND ")+
				` ORDER BY created_at DESC, id DESC LIMIT 1`, obArgs...)
	}

	// The requested page, newest first.
	type row struct {
		Sdate     string  `db:"created_at"`
		Narration string  `db:"narration"`
		Credit    float64 `db:"credit"`
		Debit     float64 `db:"debit"`
		Balance   float64 `db:"balance_after"`
	}
	pageArgs := append(append([]any{}, dateArgs...), limit, (page-1)*limit)
	var data []row
	if err := m.db.SelectContext(c.Context(), &data,
		`SELECT created_at, narration, credit, debit, balance_after
		   FROM account_statement WHERE `+whereSQL+`
		   ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, pageArgs...); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load statement"})
	}

	out := make([]fiber.Map, 0, len(data))
	for _, d := range data {
		out = append(out, fiber.Map{
			"Sdate":     d.Sdate,
			"Narration": d.Narration,
			"Credit":    d.Credit,
			"Debit":     d.Debit,
			"balance":   d.Balance,
		})
	}

	return c.JSON(fiber.Map{
		"data": out,
		"meta": fiber.Map{
			"total":        total,
			"per_page":     limit,
			"current_page": page,
		},
		"openingBalance": openingBalance,
	})
}

// ledger backs the Ledger page (/ledger): one row per match the logged-in Player
// has bet on, showing the net settled P&L as Debit (loss) / Credit (win). It
// aggregates the bettor's own bets in Mongo, then joins match names from MySQL so
// the row reads as the fixture rather than a bare id. Shape mirrors the legacy
// Adonis ledger: { data:[{ modified_MstDate, MatchName, matchid, Debit, Credit }],
// meta }. Bettor-scoped only — never another user's ledger.
func (m *Module) ledger(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	limit := c.QueryInt("limit", 50)
	if limit < 1 || limit > 500 {
		limit = 50
	}

	// Net P&L per match: sum settled bets' pl (open bets contribute 0 but still
	// surface the match), newest activity first.
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"userId": userID}}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id":      "$matchId",
			"pl":       bson.M{"$sum": bson.M{"$cond": bson.A{"$settled", "$pl", 0}}},
			"lastDate": bson.M{"$max": "$createdAt"},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "lastDate", Value: -1}}}},
	}
	cur, err := m.bets.Aggregate(c.Context(), pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load ledger"})
	}
	var rows []struct {
		MatchID  int64     `bson:"_id"`
		PL       float64   `bson:"pl"`
		LastDate time.Time `bson:"lastDate"`
	}
	if err := cur.All(c.Context(), &rows); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to decode ledger"})
	}

	// Join match names in one query.
	names := map[int64]string{}
	if len(rows) > 0 {
		ids := make([]int64, 0, len(rows))
		for _, r := range rows {
			ids = append(ids, r.MatchID)
		}
		if q, args, qerr := sqlx.In(`SELECT id, name FROM matches WHERE id IN (?)`, ids); qerr == nil {
			var named []struct {
				ID   int64  `db:"id"`
				Name string `db:"name"`
			}
			if err := m.db.SelectContext(c.Context(), &named, m.db.Rebind(q), args...); err == nil {
				for _, n := range named {
					names[n.ID] = n.Name
				}
			}
		}
	}

	// Manual pagination over the aggregated matches.
	total := len(rows)
	start := (page - 1) * limit
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}

	out := make([]fiber.Map, 0, end-start)
	for _, r := range rows[start:end] {
		credit, debit := 0.0, 0.0
		if r.PL >= 0 {
			credit = r.PL
		} else {
			debit = -r.PL
		}
		name := names[r.MatchID]
		if name == "" {
			name = "Match #" + fmt.Sprint(r.MatchID)
		}
		out = append(out, fiber.Map{
			"matchid":          r.MatchID,
			"MatchName":        name,
			"modified_MstDate": r.LastDate,
			"Debit":            debit,
			"Credit":           credit,
		})
	}

	return c.JSON(fiber.Map{
		"data": out,
		"meta": fiber.Map{
			"total":        total,
			"per_page":     limit,
			"current_page": page,
		},
	})
}

// dateRange builds a Mongo createdAt filter from YYYY-MM-DD from/to strings
// (inclusive of the whole to-day). Returns nil when neither bound parses.
func dateRange(from, to string) bson.M {
	rng := bson.M{}
	if t, err := time.Parse("2006-01-02", from); err == nil {
		rng["$gte"] = t
	}
	if t, err := time.Parse("2006-01-02", to); err == nil {
		rng["$lte"] = t.Add(24*time.Hour - time.Second)
	}
	if len(rng) == 0 {
		return nil
	}
	return rng
}

// profitLoss backs the Profit & Loss page: one row per settled event with the
// bettor's net P&L, filterable by sport and date. Aggregates the Player's own
// settled bets in Mongo, then joins event name + sport from MySQL. Shape mirrors
// the legacy Adonis profitLoss: { data:[{ settle_date, matchId, EventName, PnL }],
// meta }. Bettor-scoped only.
func (m *Module) profitLoss(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	var body struct {
		Page     int    `json:"page"`
		SportID  int64  `json:"sportId"`
		FromDate string `json:"fromDate"`
		ToDate   string `json:"toDate"`
		Limit    int    `json:"limit"`
	}
	_ = c.BodyParser(&body)
	page := body.Page
	if page < 1 {
		page = 1
	}
	limit := body.Limit
	if limit < 1 || limit > 500 {
		limit = 10
	}

	match := bson.M{"userId": userID, "settled": true}
	if rng := dateRange(body.FromDate, body.ToDate); rng != nil {
		match["createdAt"] = rng
	}

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: match}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id":        "$matchId",
			"pnl":        bson.M{"$sum": "$pl"},
			"settleDate": bson.M{"$max": "$createdAt"},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "settleDate", Value: -1}}}},
	}
	cur, err := m.bets.Aggregate(c.Context(), pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load profit/loss"})
	}
	var agg []struct {
		MatchID    int64     `bson:"_id"`
		PnL        float64   `bson:"pnl"`
		SettleDate time.Time `bson:"settleDate"`
	}
	if err := cur.All(c.Context(), &agg); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to decode profit/loss"})
	}

	// Join event name + sport id in one query.
	type matchInfo struct {
		name    string
		sportID int64
	}
	info := map[int64]matchInfo{}
	if len(agg) > 0 {
		ids := make([]int64, 0, len(agg))
		for _, r := range agg {
			ids = append(ids, r.MatchID)
		}
		if q, args, qerr := sqlx.In(`SELECT id, name, sport_id FROM matches WHERE id IN (?)`, ids); qerr == nil {
			var named []struct {
				ID      int64  `db:"id"`
				Name    string `db:"name"`
				SportID int64  `db:"sport_id"`
			}
			if err := m.db.SelectContext(c.Context(), &named, m.db.Rebind(q), args...); err == nil {
				for _, n := range named {
					info[n.ID] = matchInfo{name: n.Name, sportID: n.SportID}
				}
			}
		}
	}

	// Optional sport filter, then build rows.
	rows := make([]fiber.Map, 0, len(agg))
	for _, r := range agg {
		mi := info[r.MatchID]
		if body.SportID != 0 && mi.sportID != body.SportID {
			continue
		}
		name := mi.name
		if name == "" {
			name = "Match #" + fmt.Sprint(r.MatchID)
		}
		rows = append(rows, fiber.Map{
			"settle_date": r.SettleDate,
			"matchId":     r.MatchID,
			"id":          r.MatchID, // record id (== matchId for this aggregation)
			"EventName":   name,
			"PnL":         r.PnL,
		})
	}

	total := len(rows)
	start := (page - 1) * limit
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}

	return c.JSON(fiber.Map{
		"data": rows[start:end],
		"meta": fiber.Map{"total": total, "per_page": limit, "current_page": page},
	})
}

// profitLossByMatch backs the Profit & Loss market drill-down: the bettor's net
// P&L per market for one event. Aggregates their settled bets for the match by
// marketId, then joins market names from MySQL. Shape mirrors the legacy Adonis
// profitLossByMatch row: { MarketName, PnL, Comm, MstDate, MarketId, fancyId,
// matchId }. Bettor-scoped only.
func (m *Module) profitLossByMatch(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	var body struct {
		MatchID int64 `json:"matchId"`
	}
	_ = c.BodyParser(&body)
	if body.MatchID == 0 {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": false, "message": "matchId is required"})
	}

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"userId": userID, "matchId": body.MatchID, "settled": true}}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id":     "$marketId",
			"pnl":     bson.M{"$sum": "$pl"},
			"mstDate": bson.M{"$max": "$createdAt"},
			"betType": bson.M{"$first": "$betType"},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "mstDate", Value: -1}}}},
	}
	cur, err := m.bets.Aggregate(c.Context(), pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load market P&L"})
	}
	var agg []struct {
		MarketID string    `bson:"_id"`
		PnL      float64   `bson:"pnl"`
		MstDate  time.Time `bson:"mstDate"`
		BetType  string    `bson:"betType"`
	}
	if err := cur.All(c.Context(), &agg); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to decode market P&L"})
	}

	// Join market names by code in one query.
	names := map[string]string{}
	if len(agg) > 0 {
		codes := make([]string, 0, len(agg))
		for _, r := range agg {
			codes = append(codes, r.MarketID)
		}
		if q, args, qerr := sqlx.In(`SELECT market_id, name FROM markets WHERE market_id IN (?)`, codes); qerr == nil {
			var named []struct {
				MarketID string `db:"market_id"`
				Name     string `db:"name"`
			}
			if err := m.db.SelectContext(c.Context(), &named, m.db.Rebind(q), args...); err == nil {
				for _, n := range named {
					names[n.MarketID] = n.Name
				}
			}
		}
	}

	actor := middleware.User(c)
	out := make([]fiber.Map, 0, len(agg))
	for _, r := range agg {
		name := names[r.MarketID]
		if name == "" {
			name = r.BetType // fall back to the bet category
		}
		out = append(out, fiber.Map{
			"MarketName": name,
			"PnL":        r.PnL,
			"Comm":       0,
			"MstDate":    r.MstDate,
			"MarketId":   r.MarketID,
			"fancyId":    "",
			"matchId":    body.MatchID,
			// Needed by the inner "Show Bet" button (betHistoryFilter params).
			"UserId":     actor.UserID,
			"mstruserid": actor.Username,
		})
	}
	return c.JSON(fiber.Map{"data": out})
}
