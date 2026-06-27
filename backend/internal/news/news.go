// Package news owns news/blog posts (doc §29).
package news

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bsf2020/pkg/httpx"
)

// Post is a news/blog document.
type Post struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Slug      string             `bson:"slug" json:"slug"`
	Content   string             `bson:"content" json:"content"`
	CreatedOn time.Time          `bson:"createdOn" json:"createdOn"`
}

// Module is the news module.
type Module struct{ col *mongo.Collection }

// New builds the news module.
func New(db *mongo.Database) *Module { return &Module{col: db.Collection("news")} }

// Register mounts news routes.
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/news", requireAuth)
	g.Get("", m.list)
	g.Post("", m.create)
	g.Put("/:id", m.update)
	g.Delete("/:id", m.remove)
}

func (m *Module) update(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	var body struct {
		Slug    string `json:"slug"`
		Content string `json:"content"`
	}
	if err := c.BodyParser(&body); err != nil || body.Slug == "" || body.Content == "" {
		return httpx.BadRequest(c, "slug and content are required")
	}
	res, err := m.col.UpdateOne(c.Context(), bson.M{"_id": id},
		bson.M{"$set": bson.M{"slug": body.Slug, "content": body.Content}})
	if err != nil {
		return httpx.Internal(c, "failed to update news")
	}
	if res.MatchedCount == 0 {
		return httpx.NotFound(c, "news not found")
	}
	return httpx.OK(c, fiber.Map{"updated": true})
}

func (m *Module) list(c *fiber.Ctx) error {
	opts := options.Find().SetSort(bson.D{{Key: "createdOn", Value: -1}}).SetLimit(200)
	cur, err := m.col.Find(c.Context(), bson.M{}, opts)
	if err != nil {
		return httpx.Internal(c, "failed to load news")
	}
	var out []Post
	if err := cur.All(c.Context(), &out); err != nil {
		return httpx.Internal(c, "failed to decode")
	}
	return httpx.OK(c, out)
}

func (m *Module) create(c *fiber.Ctx) error {
	var body struct {
		Slug    string `json:"slug"`
		Content string `json:"content"`
	}
	if err := c.BodyParser(&body); err != nil || body.Slug == "" || body.Content == "" {
		return httpx.BadRequest(c, "slug and content are required")
	}
	res, err := m.col.InsertOne(c.Context(), Post{Slug: body.Slug, Content: body.Content, CreatedOn: time.Now().UTC()})
	if err != nil {
		return httpx.Internal(c, "failed to create news")
	}
	return httpx.Created(c, fiber.Map{"id": res.InsertedID})
}

func (m *Module) remove(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return httpx.BadRequest(c, "invalid id")
	}
	if _, err := m.col.DeleteOne(c.Context(), bson.M{"_id": id}); err != nil {
		return httpx.Internal(c, "failed to delete news")
	}
	return httpx.OK(c, fiber.Map{"deleted": true})
}
