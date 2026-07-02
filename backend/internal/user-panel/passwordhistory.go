package userpanel

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bsf2020/pkg/middleware"
)

// userPwdDoc is one password-change record for the User Panel's Password History
// page. It lives in its OWN collection (user_password_history) so the shared audit
// password_history is never touched. userId is the target user (for filtering);
// the rest mirror the shape the React page consumes.
type userPwdDoc struct {
	UserID      int64     `bson:"userId" json:"-"` // target user (filter key; not shown)
	Username    string    `bson:"username" json:"username"`
	Changername string    `bson:"changername" json:"changername"`
	IP          string    `bson:"ip" json:"ip"`
	CreatedAt   time.Time `bson:"created_at" json:"created_at"`
}

// recordPasswordChange inserts a password-change record. Called from the User
// Panel change-password handler: username = target user, changername = who changed
// it, ip from the request, created_at = server time. Fire-and-forget.
func (m *Module) recordPasswordChange(userID int64, username, changername, ip string) {
	if m.userPwdLog == nil {
		return
	}
	doc := userPwdDoc{
		UserID:      userID,
		Username:    username,
		Changername: changername,
		IP:          ip,
		CreatedAt:   time.Now().UTC(),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, _ = m.userPwdLog.InsertOne(ctx, doc)
}

// passwordHistory returns the logged-in user's password-change records, newest
// first, paginated. GET /api/user/passwordHistory?page=&limit=. The payload is
// DOUBLE-wrapped — { data: { meta, data:[...] } } — exactly as the page expects.
func (m *Module) passwordHistory(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	limit := c.QueryInt("limit", 10)
	if limit < 1 || limit > 200 {
		limit = 10
	}

	filter := bson.M{"userId": userID}
	total, err := m.userPwdLog.CountDocuments(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to count password history"})
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}). // latest change first
		SetSkip(int64((page - 1) * limit)).
		SetLimit(int64(limit))
	cur, err := m.userPwdLog.Find(c.Context(), filter, opts)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load password history"})
	}
	docs := make([]userPwdDoc, 0, limit)
	if err := cur.All(c.Context(), &docs); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to decode password history"})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"meta": fiber.Map{"total": total, "per_page": limit, "current_page": page},
			"data": docs,
		},
	})
}
