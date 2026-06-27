// Package reporting serves read-only reports by reading across the betting
// (Mongo) and wallet/ledger (MySQL) stores. It owns no write models.
package reporting

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// Module is the reporting module.
type Module struct {
	sql         *sqlx.DB
	bets        *mongo.Collection
	deletedBets *mongo.Collection
	loginLog    *mongo.Collection
	pwdLog      *mongo.Collection
}

// New builds the reporting module.
func New(sql *sqlx.DB, mongoDB *mongo.Database) *Module {
	return &Module{
		sql:         sql,
		bets:        mongoDB.Collection("bets"),
		deletedBets: mongoDB.Collection("deleted_bets"),
		loginLog:    mongoDB.Collection("login_history"),
		pwdLog:      mongoDB.Collection("password_history"),
	}
}

// Register mounts reporting routes. Report ids (doc §15): 1=bet history,
// 2=profit & loss, 3=account statement, 4=login history, 5=deleted bets,
// 6=password history.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/reports", requireAuth)
	g.Get("/bet-history", m.betHistory)          // id=1
	g.Get("/profit-loss", m.profitLoss)          // id=2
	g.Get("/statement", m.statement)             // id=3
	g.Get("/login-history", m.loginHistory)      // id=4
	g.Get("/deleted-bets", m.deletedBetHistory)  // id=5
	g.Get("/password-history", m.passwordHistory) // id=6

	// Per-match reports reached from the Agent Match Dashboard hub.
	g.Get("/client-report", m.clientReport)         // per-client totals for a match
	g.Get("/company-report", m.companyReport)       // match totals + per-market
	g.Get("/session-earning", m.sessionEarning)     // fancy/session totals per client
	g.Get("/match-ledger", m.matchLedger)           // per-market totals for a match
	g.Get("/user-match-ledger", m.userMatchLedger)  // a user's net P&L per match (Match ledger button)
}

// userMatchLedger returns a user's net P&L grouped by match (the dedicated
// "Match ledger" view from the Agent Match Dashboard). It aggregates the user's
// settled bets in Mongo, then joins the match names from MySQL so the page can
// show the fixture rather than a bare numeric id.
func (m *Module) userMatchLedger(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	if q := c.QueryInt("userId"); q > 0 {
		userID = int64(q)
	}
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"userId": userID}}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id":     "$matchId",
			"bets":    bson.M{"$sum": 1},
			"stake":   bson.M{"$sum": "$stake"},
			"settled": bson.M{"$sum": bson.M{"$cond": bson.A{"$settled", 1, 0}}},
			"pl":      bson.M{"$sum": bson.M{"$cond": bson.A{"$settled", "$pl", 0}}},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "_id", Value: -1}}}},
	}
	cur, err := m.bets.Aggregate(c.Context(), pipeline)
	if err != nil {
		return httpx.Internal(c, "failed to aggregate match ledger")
	}
	var rows []struct {
		MatchID int64   `bson:"_id" json:"matchId"`
		Bets    int     `bson:"bets" json:"bets"`
		Stake   float64 `bson:"stake" json:"stake"`
		Settled int     `bson:"settled" json:"settled"`
		PL      float64 `bson:"pl" json:"pl"`
	}
	if err := cur.All(c.Context(), &rows); err != nil {
		return httpx.Internal(c, "failed to decode match ledger")
	}

	// Join match names in one query.
	names := map[int64]string{}
	if len(rows) > 0 {
		ids := make([]int64, 0, len(rows))
		for _, r := range rows {
			ids = append(ids, r.MatchID)
		}
		q, args, qerr := sqlx.In(`SELECT id, name FROM matches WHERE id IN (?)`, ids)
		if qerr == nil {
			var named []struct {
				ID   int64  `db:"id"`
				Name string `db:"name"`
			}
			if err := m.sql.SelectContext(c.Context(), &named, m.sql.Rebind(q), args...); err == nil {
				for _, n := range named {
					names[n.ID] = n.Name
				}
			}
		}
	}

	out := make([]fiber.Map, 0, len(rows))
	for _, r := range rows {
		name := names[r.MatchID]
		if name == "" {
			name = "Match #" + fmt.Sprint(r.MatchID)
		}
		out = append(out, fiber.Map{
			"matchId": r.MatchID, "matchName": name, "bets": r.Bets,
			"settled": r.Settled, "open": r.Bets - r.Settled, "stake": r.Stake, "pl": r.PL,
		})
	}
	return httpx.OK(c, out)
}

// matchAgg groups a match's bets by the given field, summing the key metrics.
func (m *Module) matchAgg(c *fiber.Ctx, groupBy string, extraMatch bson.M) error {
	matchID := int64(c.QueryInt("matchId"))
	if matchID == 0 {
		return httpx.BadRequest(c, "matchId is required")
	}
	match := bson.M{"matchId": matchID}
	for k, v := range extraMatch {
		match[k] = v
	}
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: match}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id":         "$" + groupBy,
			"bets":        bson.M{"$sum": 1},
			"stake":       bson.M{"$sum": "$stake"},
			"matchedSize": bson.M{"$sum": "$matchedSize"},
			"exposure":    bson.M{"$sum": "$exposure"},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "stake", Value: -1}}}},
	}
	cur, err := m.bets.Aggregate(c.Context(), pipeline)
	if err != nil {
		return httpx.Internal(c, "failed to aggregate")
	}
	var out []bson.M
	if err := cur.All(c.Context(), &out); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	return httpx.OK(c, out)
}

// clientReport: per-client totals for a match (doc §"Client Report").
func (m *Module) clientReport(c *fiber.Ctx) error { return m.matchAgg(c, "userId", nil) }

// matchLedger / companyReport: per-market totals for a match (doc §"Ledger" / §"Company Report").
func (m *Module) matchLedger(c *fiber.Ctx) error   { return m.matchAgg(c, "marketId", nil) }
func (m *Module) companyReport(c *fiber.Ctx) error { return m.matchAgg(c, "marketId", nil) }

// sessionEarning: per-client totals of fancy/session bets for a match (doc §"Session Earning Report").
func (m *Module) sessionEarning(c *fiber.Ctx) error {
	return m.matchAgg(c, "userId", bson.M{"betType": "fancy"})
}

// loginHistory returns a user's login records (doc §15 id=4 / §30).
func (m *Module) loginHistory(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	if q := c.QueryInt("userId"); q > 0 {
		userID = int64(q)
	}
	return m.findByUser(c, m.loginLog, userID)
}

// deletedBetHistory returns a user's deleted bets (doc §15 id=5).
func (m *Module) deletedBetHistory(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	if q := c.QueryInt("userId"); q > 0 {
		userID = int64(q)
	}
	return m.findByUser(c, m.deletedBets, userID)
}

// passwordHistory returns a user's password-change records (doc §15 id=6).
func (m *Module) passwordHistory(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	if q := c.QueryInt("userId"); q > 0 {
		userID = int64(q)
	}
	return m.findByUser(c, m.pwdLog, userID)
}

// findByUser returns the latest documents in a collection for a user, newest first.
func (m *Module) findByUser(c *fiber.Ctx, col *mongo.Collection, userID int64) error {
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(500)
	cur, err := col.Find(c.Context(), bson.M{"userId": userID}, opts)
	if err != nil {
		return httpx.Internal(c, "failed to load report")
	}
	var out []bson.M
	if err := cur.All(c.Context(), &out); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	return httpx.OK(c, out)
}

// profitLoss aggregates a user's bets by market (doc §15 id=2 / §6).
func (m *Module) profitLoss(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	if q := c.QueryInt("userId"); q > 0 {
		userID = int64(q)
	}
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"userId": userID}}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id":         "$marketId",
			"bets":        bson.M{"$sum": 1},
			"stake":       bson.M{"$sum": "$stake"},
			"matchedSize": bson.M{"$sum": "$matchedSize"},
			"exposure":    bson.M{"$sum": "$exposure"},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "stake", Value: -1}}}},
	}
	cur, err := m.bets.Aggregate(c.Context(), pipeline)
	if err != nil {
		return httpx.Internal(c, "failed to aggregate profit/loss")
	}
	var out []bson.M
	if err := cur.All(c.Context(), &out); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	return httpx.OK(c, out)
}

// betHistory returns recent bets for a user (doc §15 id=1).
func (m *Module) betHistory(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	if q := c.QueryInt("userId"); q > 0 {
		userID = int64(q)
	}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(500)
	cur, err := m.bets.Find(c.Context(), bson.M{"userId": userID}, opts)
	if err != nil {
		return httpx.Internal(c, "failed to load bet history")
	}
	var out []bson.M
	if err := cur.All(c.Context(), &out); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	return httpx.OK(c, out)
}

// statement returns ledger rows for a user (doc §15 id=3).
func (m *Module) statement(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	if q := c.QueryInt("userId"); q > 0 {
		userID = int64(q)
	}
	var rows []map[string]any
	type row struct {
		Date         string  `db:"created_at"`
		Narration    string  `db:"narration"`
		Credit       float64 `db:"credit"`
		Debit        float64 `db:"debit"`
		BalanceAfter float64 `db:"balance_after"`
	}
	var data []row
	err := m.sql.SelectContext(c.Context(), &data,
		`SELECT created_at, narration, credit, debit, balance_after
		   FROM account_statement WHERE user_id = ? ORDER BY created_at DESC LIMIT 500`, userID)
	if err != nil {
		return httpx.Internal(c, "failed to load statement")
	}
	for _, d := range data {
		rows = append(rows, map[string]any{
			"date": d.Date, "narration": d.Narration, "credit": d.Credit,
			"debit": d.Debit, "balanceAfter": d.BalanceAfter,
		})
	}
	return httpx.OK(c, rows)
}
