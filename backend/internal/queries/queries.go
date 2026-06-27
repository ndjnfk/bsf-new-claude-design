// Package queries owns user queries/complaints (doc §28).
package queries

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bsf2020/pkg/httpx"
)

// Query is a user complaint/query document.
type Query struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Mobile      string             `bson:"mobile" json:"mobile"`
	Category    string             `bson:"category" json:"category"`
	Query       string             `bson:"query" json:"query"`
	Status      string             `bson:"status" json:"status"` // PENDING | RESOLVED
	IssueDate   time.Time          `bson:"issueDate" json:"issueDate"`
	ResolveDate *time.Time         `bson:"resolveDate,omitempty" json:"resolveDate"`
}

// Module is the queries module.
type Module struct{ col *mongo.Collection }

// New builds the queries module.
func New(db *mongo.Database) *Module { return &Module{col: db.Collection("queries")} }

// Register mounts query routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/queries", requireAuth)
	g.Get("", m.list)
	g.Post("", m.create)
	g.Put("/:id", m.resolve)
}

func (m *Module) list(c *fiber.Ctx) error {
	filter := bson.M{}
	if s := c.Query("status"); s != "" {
		filter["status"] = s
	}
	opts := options.Find().SetSort(bson.D{{Key: "issueDate", Value: -1}}).SetLimit(200)
	cur, err := m.col.Find(c.Context(), filter, opts)
	if err != nil {
		return httpx.Internal(c, "failed to load queries")
	}
	var out []Query
	if err := cur.All(c.Context(), &out); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	return httpx.OK(c, out)
}

func (m *Module) create(c *fiber.Ctx) error {
	var body struct {
		Mobile   string `json:"mobile"`
		Category string `json:"category"`
		Query    string `json:"query"`
	}
	if err := c.BodyParser(&body); err != nil || body.Query == "" {
		return httpx.BadRequest(c, "query is required")
	}
	q := Query{
		Mobile: body.Mobile, Category: body.Category, Query: body.Query,
		Status: "PENDING", IssueDate: time.Now().UTC(),
	}
	res, err := m.col.InsertOne(c.Context(), q)
	if err != nil {
		return httpx.Internal(c, "failed to create query")
	}
	return httpx.Created(c, fiber.Map{"id": res.InsertedID})
}

func (m *Module) resolve(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	now := time.Now().UTC()
	_, err = m.col.UpdateOne(c.Context(), bson.M{"_id": id},
		bson.M{"$set": bson.M{"status": "RESOLVED", "resolveDate": now}})
	if err != nil {
		return httpx.Internal(c, "failed to resolve query")
	}
	return httpx.OK(c, fiber.Map{"id": id.Hex(), "status": "RESOLVED"})
}
