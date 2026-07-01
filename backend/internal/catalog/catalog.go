// Package catalog owns per-tier visibility blocks on the events catalog
// (sport/series/match/market). A block placed by a user hides the item from that
// user's ENTIRE downline; the user who placed it (and their uplines) still sees
// it. Visibility for any user is resolved by walking the ancestor chain.
package catalog

import (
	"context"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"bsf2020/pkg/events"
	"bsf2020/pkg/httpx"
	"bsf2020/pkg/middleware"
)

// Item types.
const (
	Sport  = "sport"
	Series = "series"
	Match  = "match"
	Market = "market"
)

// Module exposes block management over HTTP.
type Module struct {
	db  *sqlx.DB
	pub events.Publisher
}

// New builds the catalog module.
func New(db *sqlx.DB, pub events.Publisher) *Module { return &Module{db: db, pub: pub} }

// Register mounts the routes (any management tier — naturally scoped by chain).
func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/catalog", requireAuth)
	g.Get("/blocks", m.myBlocks) // the caller's own blocks (toggle state)
	g.Post("/block", m.setBlock) // block/unblock an item for the downline
}

// AncestorBlockedIDs returns the set of item_ids of itemType blocked by any
// STRICT ancestor of userID. The user's own blocks are excluded so they keep
// seeing (and managing) what they hide from their downline. Other modules call
// this to filter their listings.
func AncestorBlockedIDs(ctx context.Context, db *sqlx.DB, userID int64, itemType string) (map[string]bool, error) {
	var ids []string
	err := db.SelectContext(ctx, &ids, `
		WITH RECURSIVE chain (id, parent_id) AS (
		  SELECT id, parent_id FROM users WHERE id = ?
		  UNION ALL
		  SELECT u.id, u.parent_id FROM users u JOIN chain c ON u.id = c.parent_id
		)
		SELECT DISTINCT cb.item_id
		  FROM catalog_blocks cb
		 WHERE cb.item_type = ?
		   AND cb.user_id IN (SELECT id FROM chain WHERE id <> ?)`,
		userID, itemType, userID)
	if err != nil {
		return nil, err
	}
	set := make(map[string]bool, len(ids))
	for _, id := range ids {
		set[id] = true
	}
	return set, nil
}

func (m *Module) myBlocks(c *fiber.Ctx) error {
	uid := middleware.User(c).UserID
	q := `SELECT item_id FROM catalog_blocks WHERE user_id = ?`
	args := []any{uid}
	if t := c.Query("itemType"); t != "" {
		q += ` AND item_type = ?`
		args = append(args, t)
	}
	var ids []string
	if err := m.db.SelectContext(c.Context(), &ids, q, args...); err != nil {
		return httpx.Internal(c, "failed to load blocks")
	}
	if ids == nil {
		ids = []string{}
	}
	return httpx.OK(c, ids)
}

func (m *Module) setBlock(c *fiber.Ctx) error {
	var body struct {
		ItemType string `json:"itemType"`
		ItemID   string `json:"itemId"`
		Blocked  bool   `json:"blocked"`
	}
	if err := c.BodyParser(&body); err != nil || body.ItemType == "" || body.ItemID == "" {
		return httpx.BadRequest(c, "itemType and itemId are required")
	}
	user := middleware.User(c)
	uid := user.UserID
	if body.Blocked {
		if _, err := m.db.ExecContext(c.Context(),
			`INSERT INTO catalog_blocks (user_id, item_type, item_id) VALUES (?,?,?)
			 ON DUPLICATE KEY UPDATE created_at = created_at`, uid, body.ItemType, body.ItemID); err != nil {
			return httpx.Internal(c, "failed to block")
		}
	} else {
		if _, err := m.db.ExecContext(c.Context(),
			`DELETE FROM catalog_blocks WHERE user_id = ? AND item_type = ? AND item_id = ?`,
			uid, body.ItemType, body.ItemID); err != nil {
			return httpx.Internal(c, "failed to unblock")
		}
	}
	// Super Duper Admin's block also flips the GLOBAL active flag, cascading down
	// (sport → its series → matches → markets), so blocked items leave Live Matches
	// for everyone. Lower tiers only scope visibility to their downline (above).
	if user.Usetype == 0 {
		m.cascadeActive(c.Context(), body.ItemType, body.ItemID, !body.Blocked)
	}
	// Real-time, scoped to THIS blocker's subtree: publish to the blocker's own
	// room. Every client subscribes to a room for each of its ancestors, so only
	// the blocker's downline (who have this user as an ancestor) is notified. An
	// SDA block reaches everyone; a Company block reaches only that company's tree.
	_ = m.pub.Publish(c.Context(), "CATALOG_BLOCKS:"+strconv.FormatInt(uid, 10), fiber.Map{
		"type": "CATALOG_BLOCKS", "by": uid,
		"itemType": body.ItemType, "itemId": body.ItemID, "blocked": body.Blocked,
	})
	return httpx.OK(c, fiber.Map{"itemType": body.ItemType, "itemId": body.ItemID, "blocked": body.Blocked})
}

// cascadeActive flips the active flag of an item AND everything beneath it, so a
// sport block deactivates its series, matches and markets (and an unblock
// reactivates them). itemID is the local id (sport_id / series_id / match_id) or
// market_id.
func (m *Module) cascadeActive(ctx context.Context, itemType, itemID string, active bool) {
	on := 0
	if active {
		on = 1
	}
	exec := func(q string, args ...any) { _, _ = m.db.ExecContext(ctx, q, args...) }
	switch itemType {
	case Sport:
		exec(`UPDATE sports  SET active = ? WHERE id = ?`, on, itemID)
		exec(`UPDATE markets SET active = ? WHERE match_id IN (SELECT id FROM matches WHERE sport_id = ?)`, on, itemID)
		exec(`UPDATE matches SET active = ? WHERE sport_id = ?`, on, itemID)
		exec(`UPDATE series  SET active = ? WHERE sport_id = ?`, on, itemID)
	case Series:
		exec(`UPDATE markets SET active = ? WHERE match_id IN (SELECT id FROM matches WHERE series_id = ?)`, on, itemID)
		exec(`UPDATE matches SET active = ? WHERE series_id = ?`, on, itemID)
		exec(`UPDATE series  SET active = ? WHERE id = ?`, on, itemID)
	case Match:
		exec(`UPDATE markets SET active = ? WHERE match_id = ?`, on, itemID)
		exec(`UPDATE matches SET active = ? WHERE id = ?`, on, itemID)
	case Market:
		exec(`UPDATE markets SET active = ? WHERE market_id = ?`, on, itemID)
	}
}
