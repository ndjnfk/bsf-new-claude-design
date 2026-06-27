// Package audit records login history and serves IP surveillance (doc §30, §15 id=4).
package audit

import (
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bsf2020/pkg/httpx"
)

// LoginEvent is a recorded login.
type LoginEvent struct {
	UserID    int64     `bson:"userId" json:"userId"`
	Username  string    `bson:"username" json:"username"`
	IP        string    `bson:"ip" json:"ip"`
	UserAgent string    `bson:"userAgent" json:"userAgent"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}

// PasswordEvent is a recorded password change (doc §15 id=6).
type PasswordEvent struct {
	UserID      int64     `bson:"userId" json:"userId"`
	Username    string    `bson:"username" json:"username"`
	ChangerName string    `bson:"changerName" json:"changerName"`
	IP          string    `bson:"ip" json:"ip"`
	CreatedAt   time.Time `bson:"createdAt" json:"createdAt"`
}

// Module records logins/password changes and exposes login-history / IP-surveillance.
type Module struct {
	col    *mongo.Collection
	pwdCol *mongo.Collection
}

// New builds the audit module.
func New(db *mongo.Database) *Module {
	return &Module{col: db.Collection("login_history"), pwdCol: db.Collection("password_history")}
}

// RecordPasswordChange implements identity.PasswordRecorder. Fire-and-forget.
func (m *Module) RecordPasswordChange(userID int64, username, changerName, ip string) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, err := m.pwdCol.InsertOne(ctx, PasswordEvent{
		UserID: userID, Username: username, ChangerName: changerName, IP: ip, CreatedAt: time.Now().UTC(),
	})
	if err != nil {
		log.Printf("audit: record password change: %v", err)
	}
}

// RecordLogin implements identity.LoginRecorder. Fire-and-forget; failures are
// logged but never block a login.
func (m *Module) RecordLogin(userID int64, username, ip, userAgent string) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, err := m.col.InsertOne(ctx, LoginEvent{
		UserID: userID, Username: username, IP: ip, UserAgent: userAgent, CreatedAt: time.Now().UTC(),
	})
	if err != nil {
		log.Printf("audit: record login: %v", err)
	}
}

// Register mounts audit routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/login-history", requireAuth)
	g.Get("", m.list)
	g.Get("/today", m.today)
}

func (m *Module) list(c *fiber.Ctx) error {
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(500)
	cur, err := m.col.Find(c.Context(), bson.M{}, opts)
	if err != nil {
		return httpx.Internal(c, "failed to load login history")
	}
	var out []LoginEvent
	if err := cur.All(c.Context(), &out); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	return httpx.OK(c, out)
}

// today returns logins since midnight UTC, grouped by IP (doc §30).
func (m *Module) today(c *fiber.Ctx) error {
	now := time.Now().UTC()
	midnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"createdAt": bson.M{"$gte": midnight}}}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id":   "$ip",
			"users": bson.M{"$addToSet": "$username"},
			"count": bson.M{"$sum": 1},
			"last":  bson.M{"$max": "$createdAt"},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
	}
	cur, err := m.col.Aggregate(c.Context(), pipeline)
	if err != nil {
		return httpx.Internal(c, "failed to aggregate")
	}
	var rows []struct {
		IP    string    `bson:"_id" json:"ip"`
		Users []string  `bson:"users" json:"users"`
		Count int       `bson:"count" json:"count"`
		Last  time.Time `bson:"last" json:"last"`
	}
	if err := cur.All(c.Context(), &rows); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	return httpx.OK(c, rows)
}
