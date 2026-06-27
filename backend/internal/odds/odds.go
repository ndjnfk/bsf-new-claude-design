// Package odds is the live market-odds wrapper. Flow:
//
//	Publish button → market id added to the Redis "published" set →
//	a single publisher reads that set, batches the ids into ONE comma-separated
//	multi-market API call (with failover across providers), then pushes each
//	market's book to its realtime room where many consumers (panels) listen.
//
// If a market's odds don't change for 10s the publisher marks it SUSPENDED and
// betting rejects new bets on it. Today the data is a dummy generator following
// the Betfair structure; swapping in the real provider only touches fetch().
package odds

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"io"
	"math"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"

	"bsf2020/pkg/events"
	"bsf2020/pkg/httpx"
)

// Redis keys.
const (
	publishedKey = "odds:published"   // SET of market ids being streamed
	bookKeyFmt   = "odds:book:%s"     // latest book JSON per market (TTL)
	staleAfter   = 10 * time.Second   // odds unchanged this long → SUSPENDED
	tickInterval = 1500 * time.Millisecond
	bookTTL      = 6 * time.Second
)

// --- Betfair-shaped model (what panels render) ---

type PriceSize struct {
	Price float64 `json:"price"`
	Size  float64 `json:"size"`
}
type RunnerOdds struct {
	SelectionID string      `json:"selectionId"`
	Name        string      `json:"name"`
	Status      string      `json:"status"`
	Back        []PriceSize `json:"back"`
	Lay         []PriceSize `json:"lay"`
}
type MarketBook struct {
	MarketID string       `json:"marketId"`
	MatchID  int64        `json:"matchId"`
	Name     string       `json:"name"`
	Status   string       `json:"status"` // OPEN / SUSPENDED / CLOSED
	Runners  []RunnerOdds `json:"runners"`
	TS       int64        `json:"ts"`
}

// MarketMeta is cached in Redis when a market is published, so the publisher /
// dummy never re-query MySQL on the hot path. The REAL provider gets runners from
// the upstream API and ignores this entirely.
type MarketMeta struct {
	MarketID string       `json:"marketId"`
	MatchID  int64        `json:"matchId"`
	Name     string       `json:"name"`
	Runners  []MetaRunner `json:"runners"`
}
type MetaRunner struct {
	SelectionID string `json:"selectionId"`
	Name        string `json:"name"`
}

// Provider returns books for MANY markets in one shot (the API is multi-market;
// ids are sent comma-separated).
type Provider interface {
	Books(ctx context.Context, marketIDs []string) (map[string]*MarketBook, error)
}

// --- Registry: which markets are published (Redis set) ---

// Registry tracks the markets to stream. The publish/unpublish actions update it;
// the publisher reads it each tick.
type Registry struct{ rdb *redis.Client }

func NewRegistry(rdb *redis.Client) *Registry { return &Registry{rdb: rdb} }

func (r *Registry) Add(ctx context.Context, ids ...string) error {
	if len(ids) == 0 {
		return nil
	}
	return r.rdb.SAdd(ctx, publishedKey, toAny(ids)...).Err()
}
func (r *Registry) Remove(ctx context.Context, ids ...string) error {
	if len(ids) == 0 {
		return nil
	}
	return r.rdb.SRem(ctx, publishedKey, toAny(ids)...).Err()
}
func (r *Registry) Members(ctx context.Context) ([]string, error) {
	return r.rdb.SMembers(ctx, publishedKey).Result()
}

// SetMeta / GetMeta / DelMeta cache the market's runners + matchId in Redis so the
// hot path never touches MySQL.
func (r *Registry) SetMeta(ctx context.Context, m MarketMeta) error {
	raw, err := json.Marshal(m)
	if err != nil {
		return err
	}
	return r.rdb.Set(ctx, "odds:meta:"+m.MarketID, raw, 0).Err()
}
func (r *Registry) GetMeta(ctx context.Context, marketID string) (*MarketMeta, error) {
	raw, err := r.rdb.Get(ctx, "odds:meta:"+marketID).Result()
	if err != nil {
		return nil, err
	}
	var m MarketMeta
	if err := json.Unmarshal([]byte(raw), &m); err != nil {
		return nil, err
	}
	return &m, nil
}
func (r *Registry) DelMeta(ctx context.Context, marketID string) error {
	return r.rdb.Del(ctx, "odds:meta:"+marketID).Err()
}

func toAny(ss []string) []any {
	out := make([]any, len(ss))
	for i, s := range ss {
		out[i] = s
	}
	return out
}

// MarketStatus reads the latest streamed status of a market (for the bet gate).
// Empty = not streamed / unknown.
func MarketStatus(ctx context.Context, rdb *redis.Client, marketID string) string {
	raw, err := rdb.Get(ctx, fmt.Sprintf(bookKeyFmt, marketID)).Result()
	if err != nil {
		return ""
	}
	var b MarketBook
	if json.Unmarshal([]byte(raw), &b) != nil {
		return ""
	}
	return b.Status
}

// --- Dummy provider (Betfair-structured fake odds + a stall cycle to demo SUSPENDED) ---

type DummyProvider struct{ registry *Registry }

// NewDummy reads runner metadata from Redis (cached at publish time) — no MySQL
// on the hot path.
func NewDummy(registry *Registry) *DummyProvider { return &DummyProvider{registry: registry} }

func (d *DummyProvider) Books(ctx context.Context, marketIDs []string) (map[string]*MarketBook, error) {
	out := make(map[string]*MarketBook, len(marketIDs))
	for _, id := range marketIDs {
		out[id] = d.book(ctx, id)
	}
	return out, nil
}

func (d *DummyProvider) book(ctx context.Context, marketID string) *MarketBook {
	runners := []MetaRunner{{SelectionID: "1", Name: "Back"}, {SelectionID: "2", Name: "Lay"}}
	var matchID int64
	var name string
	if meta, err := d.registry.GetMeta(ctx, marketID); err == nil && meta != nil {
		matchID, name = meta.MatchID, meta.Name
		if len(meta.Runners) > 0 {
			runners = meta.Runners
		}
	}

	// Per-market stall cycle (34s): ~20s of changing odds, then ~14s frozen so the
	// publisher's 10s staleness rule trips → SUSPENDED. Offset per market so they
	// don't all suspend together. The same bucket → identical odds (deterministic).
	now := time.Now().Unix()
	off := int64(hashID(marketID) % 34)
	phase := (now + off) % 34
	var bucket int64
	if phase < 20 {
		bucket = (now + off) / 2 // changes every 2s
	} else {
		bucket = (now + off) / 34 // constant through the frozen window
	}
	rng := rand.New(rand.NewSource(int64(hashID(marketID)) ^ bucket)) //nolint:gosec

	book := &MarketBook{MarketID: marketID, MatchID: matchID, Name: name, Status: "OPEN", TS: time.Now().UnixMilli()}
	for i, r := range runners {
		book.Runners = append(book.Runners, dummyRunner(rng, r.SelectionID, r.Name, i))
	}
	return book
}

func dummyRunner(rng *rand.Rand, selID, name string, idx int) RunnerOdds {
	base := 1.4 + float64(idx)*0.9 + rng.Float64()*0.6
	back := round2(base)
	lay := round2(base + 0.03 + rng.Float64()*0.05)
	sz := func() float64 { return float64(500 + rng.Intn(80000)) }
	ladder := func(p, dir float64) []PriceSize {
		return []PriceSize{
			{Price: round2(p), Size: sz()},
			{Price: round2(p + dir*0.01), Size: sz()},
			{Price: round2(p + dir*0.02), Size: sz()},
		}
	}
	return RunnerOdds{SelectionID: selID, Name: name, Status: "ACTIVE", Back: ladder(back, -1), Lay: ladder(lay, +1)}
}

func round2(f float64) float64 { return math.Round(f*100) / 100 }
func hashID(s string) uint32   { h := fnv.New32a(); _, _ = h.Write([]byte(s)); return h.Sum32() }

// --- Multi-provider failover (real HTTP feeds + dummy fallback) ---

// MultiProvider sends ALL ids in one comma-separated multi-market call, trying
// each provider URL in priority order; if every provider is down it falls back
// to the dummy so panels keep receiving data.
type MultiProvider struct {
	urls     []string
	client   *http.Client
	fallback Provider
}

func NewMulti(urls []string, fallback Provider) *MultiProvider {
	return &MultiProvider{urls: urls, client: &http.Client{Timeout: 4 * time.Second}, fallback: fallback}
}

func (m *MultiProvider) Books(ctx context.Context, marketIDs []string) (map[string]*MarketBook, error) {
	csv := strings.Join(marketIDs, ",")
	for _, u := range m.urls {
		if books, err := m.fetch(ctx, u, csv); err == nil {
			return books, nil
		}
	}
	return m.fallback.Books(ctx, marketIDs) // all providers down → dummy keeps it live
}

// fetch is the ONLY place that knows a real provider's JSON. The API is called
// multi-market (?marketIds=a,b,c). Replace the passthrough with the real
// normalization when a provider is available.
func (m *MultiProvider) fetch(ctx context.Context, base, csv string) (map[string]*MarketBook, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base+"?marketIds="+csv, nil)
	if err != nil {
		return nil, err
	}
	res, err := m.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("odds %s: status %d", base, res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 16<<20))
	if err != nil {
		return nil, err
	}
	// Accept either a keyed map or an array; key the array by MarketID.
	out := map[string]*MarketBook{}
	if err := json.Unmarshal(body, &out); err == nil && len(out) > 0 {
		return out, nil
	}
	var arr []*MarketBook
	if err := json.Unmarshal(body, &arr); err != nil {
		return nil, err
	}
	for _, b := range arr {
		out[b.MarketID] = b
	}
	return out, nil
}

// --- Publisher: batch fetch + staleness + fan-out ---

type marketState struct {
	sig       string
	changedAt time.Time
}

// Publisher reads the published set, batch-fetches all books in one call, applies
// the staleness→SUSPENDED rule, pushes each book to its room, and caches it in
// Redis for the bet gate.
type Publisher struct {
	provider Provider
	registry *Registry
	rdb      *redis.Client
	pub      events.Publisher
	state    map[string]*marketState
}

func NewPublisher(provider Provider, registry *Registry, rdb *redis.Client, pub events.Publisher) *Publisher {
	return &Publisher{provider: provider, registry: registry, rdb: rdb, pub: pub, state: map[string]*marketState{}}
}

func (p *Publisher) Run(ctx context.Context) {
	t := time.NewTicker(tickInterval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			p.tick(ctx)
		}
	}
}

func (p *Publisher) tick(ctx context.Context) {
	ids, err := p.registry.Members(ctx)
	if err != nil || len(ids) == 0 {
		return
	}
	books, err := p.provider.Books(ctx, ids) // ONE batched multi-market call
	if err != nil {
		return
	}
	now := time.Now()
	live := make(map[string]bool, len(ids))
	for _, mid := range ids {
		live[mid] = true
		book := books[mid]
		if book == nil {
			continue
		}
		// Staleness: if the odds signature hasn't moved in 10s → SUSPENDED.
		sig := signature(book)
		st := p.state[mid]
		if st == nil {
			st = &marketState{sig: sig, changedAt: now}
			p.state[mid] = st
		} else if sig != st.sig {
			st.sig, st.changedAt = sig, now
		}
		if now.Sub(st.changedAt) >= staleAfter {
			book.Status = "SUSPENDED"
		} else if book.Status == "" {
			book.Status = "OPEN"
		}
		book.TS = now.UnixMilli()

		raw, _ := json.Marshal(book)
		// Per-market room (single-market live page) AND per-event room (event page
		// subscribes once and gets all its markets — no load from other events).
		_ = p.pub.Publish(ctx, "MARKET_ODDS:"+mid, book)
		if book.MatchID != 0 {
			_ = p.pub.Publish(ctx, fmt.Sprintf("MATCH_ODDS:%d", book.MatchID), book)
		}
		p.rdb.Set(ctx, fmt.Sprintf(bookKeyFmt, mid), raw, bookTTL) // for the bet gate
	}
	for k := range p.state { // forget unpublished markets
		if !live[k] {
			delete(p.state, k)
		}
	}
}

// signature is the price-only fingerprint of a book (sizes ignored — only odds
// movement matters for staleness).
func signature(b *MarketBook) string {
	var sb strings.Builder
	for _, r := range b.Runners {
		sb.WriteString(r.Status)
		for _, ps := range r.Back {
			fmt.Fprintf(&sb, "b%.2f", ps.Price)
		}
		for _, ps := range r.Lay {
			fmt.Fprintf(&sb, "l%.2f", ps.Price)
		}
	}
	return sb.String()
}

// --- HTTP (initial snapshot for the live page) ---

type Module struct {
	provider Provider
	registry *Registry
}

func NewModule(p Provider, registry *Registry) *Module { return &Module{provider: p, registry: registry} }

func (m *Module) Register(api fiber.Router, requireAuth fiber.Handler) {
	g := api.Group("/odds", requireAuth)
	g.Get("", m.book)        // one market snapshot
	g.Get("/match", m.match) // all of an event's published markets (event page first paint)
}

func (m *Module) book(c *fiber.Ctx) error {
	mid := c.Query("marketId")
	if mid == "" {
		return httpx.BadRequest(c, "marketId is required")
	}
	books, err := m.provider.Books(c.Context(), []string{mid})
	if err != nil || books[mid] == nil {
		return httpx.Internal(c, "failed to load odds")
	}
	return httpx.OK(c, books[mid])
}

// match returns the current books of every PUBLISHED market for a match — the
// event page's first paint; live updates then arrive on room MATCH_ODDS:<id>.
func (m *Module) match(c *fiber.Ctx) error {
	matchID := int64(c.QueryInt("matchId"))
	if matchID == 0 {
		return httpx.BadRequest(c, "matchId is required")
	}
	members, err := m.registry.Members(c.Context())
	if err != nil {
		return httpx.Internal(c, "failed to load published markets")
	}
	var ids []string
	for _, id := range members {
		if meta, err := m.registry.GetMeta(c.Context(), id); err == nil && meta != nil && meta.MatchID == matchID {
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 {
		return httpx.OK(c, []MarketBook{})
	}
	books, err := m.provider.Books(c.Context(), ids)
	if err != nil {
		return httpx.Internal(c, "failed to load odds")
	}
	out := make([]*MarketBook, 0, len(ids))
	for _, id := range ids {
		if books[id] != nil {
			out = append(out, books[id])
		}
	}
	return httpx.OK(c, out)
}
