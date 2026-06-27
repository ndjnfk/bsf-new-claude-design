// Package betting records bets and routes orders to the matching engine. It
// depends on the engine via the engine.MatchingEngine interface and pushes live
// updates via events.Publisher — never on those modules' concrete types.
package betting

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/redis/go-redis/v9"

	"bsf2020/internal/engine"
	"bsf2020/internal/exposure"
	"bsf2020/internal/odds"
	"bsf2020/pkg/domain"
	"bsf2020/pkg/events"
	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// BetType categorises a bet for the per-match bet slips and reports.
const (
	BetTypeMatch     = "match"     // match odds (Bet Slips)
	BetTypeBookmaker = "bookmaker" // bookmaker (Bet Slips)
	BetTypeToss      = "toss"      // toss (Bet Slips)
	BetTypeFancy     = "fancy"     // fancy/session (Session Bet Slip)
)

// Bet is a persisted bet document.
type Bet struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      int64              `bson:"userId" json:"userId"`
	MatchID     int64              `bson:"matchId" json:"matchId"`
	MarketID    string             `bson:"marketId" json:"marketId"`
	BetType     string             `bson:"betType" json:"betType"`
	Selection   string             `bson:"selection" json:"selection"`
	Side        engine.Side        `bson:"side" json:"side"`
	Price       float64            `bson:"price" json:"price"`
	Stake       float64            `bson:"stake" json:"stake"`
	MatchedSize float64            `bson:"matchedSize" json:"matchedSize"`
	Exposure    float64            `bson:"exposure" json:"exposure"`
	Settled     bool               `bson:"settled" json:"settled"`
	PL          float64            `bson:"pl" json:"pl"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
}

// Module is the betting module.
type Module struct {
	bets        *mongo.Collection
	deletedBets *mongo.Collection
	eng         engine.MatchingEngine
	pub         events.Publisher
	rdb         *redis.Client      // read live market status for the suspend gate
	exposure    *exposure.Tracker  // incremental per-level liability
}

// New builds the betting module.
func New(db *mongo.Database, eng engine.MatchingEngine, pub events.Publisher, rdb *redis.Client, exp *exposure.Tracker) *Module {
	return &Module{
		bets:        db.Collection("bets"),
		deletedBets: db.Collection("deleted_bets"),
		eng:         eng,
		pub:         pub,
		rdb:         rdb,
		exposure:    exp,
	}
}

// Register mounts betting routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/betting", requireAuth)
	// Manual bet entry (My Markets) is Super Duper Admin only — not for lower panels.
	g.Post("/bets", middleware.RequireUsetype(domain.SuperDuperAdmin), m.place)
	g.Get("/bets", m.list)
	g.Delete("/bets/:id", m.deleteBet) // move a bet to deleted_bets (doc §15 id=5)
	g.Get("/book", m.book)
	g.Get("/count-per-user", m.countPerUser)
}

// deleteBet voids a bet: it is copied to deleted_bets (with who/when) and removed
// from the live bets collection. Feeds the Deleted Bet History report.
func (m *Module) deleteBet(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return httpx.BadRequest(c, "invalid bet id")
	}
	var bet bson.M
	if err := m.bets.FindOne(c.Context(), bson.M{"_id": id}).Decode(&bet); err != nil {
		return httpx.NotFound(c, "bet not found")
	}
	bet["deletedAt"] = time.Now().UTC()
	bet["deletedBy"] = middleware.User(c).Username
	if _, err := m.deletedBets.InsertOne(c.Context(), bet); err != nil {
		return httpx.Internal(c, "failed to archive bet")
	}
	if _, err := m.bets.DeleteOne(c.Context(), bson.M{"_id": id}); err != nil {
		return httpx.Internal(c, "failed to delete bet")
	}
	marketID, _ := bet["marketId"].(string)
	_ = m.pub.Publish(c.Context(), "MARKET_UPDATE_DATA:"+marketID, fiber.Map{"type": "BET_DELETED", "id": id.Hex()})
	return httpx.OK(c, fiber.Map{"deleted": true})
}

// countPerUser aggregates bet counts per user for a market (doc §31).
func (m *Module) countPerUser(c *fiber.Ctx) error {
	marketID := c.Query("marketId")
	if marketID == "" {
		return httpx.BadRequest(c, "marketId is required")
	}
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"marketId": marketID}}},
		bson.D{{Key: "$group", Value: bson.M{"_id": "$userId", "bets": bson.M{"$sum": 1}}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "bets", Value: -1}}}},
	}
	cur, err := m.bets.Aggregate(c.Context(), pipeline)
	if err != nil {
		return httpx.Internal(c, "failed to aggregate")
	}
	var perUser []struct {
		UserID int64 `bson:"_id" json:"userId"`
		Bets   int   `bson:"bets" json:"bets"`
	}
	if err := cur.All(c.Context(), &perUser); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	totalBets := 0
	for _, u := range perUser {
		totalBets += u.Bets
	}
	return httpx.OK(c, fiber.Map{
		"totalUsers": len(perUser), "totalBets": totalBets, "users": perUser,
	})
}

func (m *Module) place(c *fiber.Ctx) error {
	var body struct {
		MatchID   int64       `json:"matchId"`
		MarketID  string      `json:"marketId"`
		BetType   string      `json:"betType"`
		Selection string      `json:"selection"`
		Side      engine.Side `json:"side"`
		Price     float64     `json:"price"`
		Stake     float64     `json:"stake"`
	}
	if err := c.BodyParser(&body); err != nil || body.Stake <= 0 || body.Price <= 1 || body.MarketID == "" {
		return httpx.BadRequest(c, "marketId, selection, side, price>1 and stake>0 are required")
	}
	// Suspend gate: a market whose odds have gone stale (no change in 10s) is
	// SUSPENDED — no bets accepted until odds resume.
	if m.rdb != nil && odds.MarketStatus(c.Context(), m.rdb, body.MarketID) == "SUSPENDED" {
		return httpx.Err(c, fiber.StatusConflict, "market suspended — bets not accepted")
	}
	if body.BetType == "" {
		body.BetType = BetTypeMatch
	}
	userID := middleware.User(c).UserID

	res, err := m.eng.Submit(c.Context(), engine.Order{
		UserID: userID, MarketID: body.MarketID, Selection: body.Selection,
		Side: body.Side, Price: body.Price, Size: body.Stake,
	})
	if err != nil {
		return httpx.Internal(c, "match failed")
	}

	bet := Bet{
		UserID: userID, MatchID: body.MatchID, MarketID: body.MarketID, BetType: body.BetType,
		Selection: body.Selection, Side: body.Side, Price: body.Price, Stake: body.Stake,
		MatchedSize: res.MatchedSize, Exposure: res.Exposure, CreatedAt: time.Now().UTC(),
	}
	if _, err := m.bets.InsertOne(c.Context(), bet); err != nil {
		return httpx.Internal(c, "failed to persist bet")
	}

	// Add this bet's liability to the bettor and each ancestor (incremental,
	// per-level live exposure).
	m.exposure.Apply(c.Context(), userID, res.Exposure, +1)

	// Notify everyone watching this market in real time.
	_ = m.pub.Publish(c.Context(), "MARKET_UPDATE_DATA:"+body.MarketID, fiber.Map{
		"type": "BET_PLACED", "bet": bet, "match": res,
	})

	return httpx.Created(c, fiber.Map{"bet": bet, "match": res})
}

func (m *Module) list(c *fiber.Ctx) error {
	filter := bson.M{}
	if mid := c.Query("marketId"); mid != "" {
		filter["marketId"] = mid
	}
	if matchID := c.QueryInt("matchId"); matchID > 0 {
		filter["matchId"] = int64(matchID)
	}
	if bt := c.Query("betType"); bt != "" {
		filter["betType"] = bt
	}
	if uid := c.QueryInt("userId"); uid > 0 {
		filter["userId"] = int64(uid)
	}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(200)
	cur, err := m.bets.Find(c.Context(), filter, opts)
	if err != nil {
		return httpx.Internal(c, "failed to load bets")
	}
	var out []Bet
	if err := cur.All(c.Context(), &out); err != nil {
		return httpx.Internal(c, "failed to decode bets")
	}
	return httpx.OK(c, out)
}

func (m *Module) book(c *fiber.Ctx) error {
	mid := c.Query("marketId")
	if mid == "" {
		return httpx.BadRequest(c, "marketId is required")
	}
	snap, err := m.eng.Book(c.Context(), mid)
	if err != nil {
		return httpx.Internal(c, "failed to load book")
	}
	return httpx.OK(c, snap)
}
