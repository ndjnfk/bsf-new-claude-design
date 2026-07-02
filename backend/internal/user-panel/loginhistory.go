package userpanel

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"bsf2020/pkg/middleware"
)

// userLoginDoc is one enriched login record for the User Panel's Login History
// page. It lives in its OWN collection (user_login_history) so the shared audit
// login_history (admin surveillance) is never touched. Field/json names mirror the
// legacy `userlogged` shape the React page consumes.
type userLoginDoc struct {
	Logcode     int64      `bson:"logcode" json:"logcode"`
	Loguser     int64      `bson:"loguser" json:"loguser"`
	Logstdt     time.Time  `bson:"logstdt" json:"logstdt"`
	Logendt     *time.Time `bson:"logendt" json:"logendt"`
	Online      int        `bson:"online" json:"online"`
	Ipadress    string     `bson:"ipadress" json:"ipadress"`
	SessionID   string     `bson:"session_id" json:"session_id"`
	BrowserInfo string     `bson:"browser_info" json:"browser_info"`
	DeviceInfo  string     `bson:"device_info" json:"device_info"`
	City        string     `bson:"city" json:"city"`
	Region      string     `bson:"region" json:"region"`
	Org         string     `bson:"org" json:"org"`
	Mstruserid  string     `bson:"mstruserid" json:"mstruserid"`
}

// recordUserLogin inserts a login record for a Player. Called from the User Panel
// login handler: ipadress from the request, logstdt = server time, browser_info /
// device_info parsed from the User-Agent, city/region/org from the login payload.
// Fire-and-forget — a failure here never blocks the login.
func (m *Module) recordUserLogin(userID int64, mstruserid, ip, userAgent, city, region, org string) {
	if m.userLoginLog == nil {
		return
	}
	doc := userLoginDoc{
		Logcode:     time.Now().UnixMicro(),
		Loguser:     userID,
		Logstdt:     time.Now().UTC(),
		Online:      1,
		Ipadress:    ip,
		SessionID:   "session",
		BrowserInfo: browserInfoFromUA(userAgent),
		DeviceInfo:  deviceInfoFromUA(userAgent),
		City:        city,
		Region:      region,
		Org:         org,
		Mstruserid:  mstruserid,
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, _ = m.userLoginLog.InsertOne(ctx, doc)
}

// loginHistory returns the logged-in Player's own login records, newest first,
// paginated. GET /api/user/loginHistory?page=&limit=. Response mirrors the legacy
// Adonis loginHistory: { data:[...], meta:{ total, per_page, current_page } }.
func (m *Module) loginHistory(c *fiber.Ctx) error {
	userID := middleware.User(c).UserID
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	limit := c.QueryInt("limit", 10)
	if limit < 1 || limit > 200 {
		limit = 10
	}

	filter := bson.M{"loguser": userID}
	total, err := m.userLoginLog.CountDocuments(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to count login history"})
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "logstdt", Value: -1}}). // latest login first
		SetSkip(int64((page - 1) * limit)).
		SetLimit(int64(limit))
	cur, err := m.userLoginLog.Find(c.Context(), filter, opts)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to load login history"})
	}
	docs := make([]userLoginDoc, 0, limit)
	if err := cur.All(c.Context(), &docs); err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"status": false, "message": "failed to decode login history"})
	}

	return c.JSON(fiber.Map{
		"data": docs,
		"meta": fiber.Map{"total": total, "per_page": limit, "current_page": page},
	})
}

// deviceInfoFromUA classifies a User-Agent as Desktop / Mobile / Tablet.
func deviceInfoFromUA(ua string) string {
	u := strings.ToLower(ua)
	switch {
	case strings.Contains(u, "ipad"), strings.Contains(u, "tablet"):
		return "Tablet"
	case strings.Contains(u, "mobi"), strings.Contains(u, "iphone"),
		strings.Contains(u, "android") && strings.Contains(u, "mobile"):
		return "Mobile"
	default:
		return "Desktop"
	}
}

// browserInfoFromUA renders "<OS> | <Browser>" from a User-Agent (best-effort,
// same shape the legacy stored, e.g. "Windows | Chrome"). Order matters: Edge and
// Chrome both contain "Safari"; Chrome contains "Safari" too.
func browserInfoFromUA(ua string) string {
	os := "Unknown"
	switch {
	case strings.Contains(ua, "Windows"):
		os = "Windows"
	case strings.Contains(ua, "Macintosh"), strings.Contains(ua, "Mac OS"):
		os = "Mac OS"
	case strings.Contains(ua, "Android"):
		os = "Android"
	case strings.Contains(ua, "iPhone"), strings.Contains(ua, "iPad"):
		os = "iOS"
	case strings.Contains(ua, "Linux"):
		os = "Linux"
	}
	browser := "Unknown"
	switch {
	case strings.Contains(ua, "Edg"):
		browser = "Edge"
	case strings.Contains(ua, "OPR"), strings.Contains(ua, "Opera"):
		browser = "Opera"
	case strings.Contains(ua, "Chrome"):
		browser = "Chrome"
	case strings.Contains(ua, "Firefox"):
		browser = "Firefox"
	case strings.Contains(ua, "Safari"):
		browser = "Safari"
	}
	return os + " | " + browser
}
