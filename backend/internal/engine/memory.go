package engine

import (
	"context"
	"sort"
	"strings"
	"sync"
)

// restingOrder is an unmatched order sitting in the book.
type restingOrder struct {
	userID int64
	price  float64
	size   float64
}

// book holds resting backs and lays for a single market+selection, with its OWN
// lock so matching on different markets/selections runs fully concurrently.
type book struct {
	mu    sync.Mutex
	backs []restingOrder // unmatched back orders (backers waiting)
	lays  []restingOrder // unmatched lay orders (layers waiting)
}

// MemoryEngine is an in-process MatchingEngine. The top-level lock guards only the
// books map (lookup/create); the actual matching holds just the per-book lock, so
// throughput scales with the number of markets instead of being serialized
// through one global mutex. Swapping in a Rust-backed client later needs no caller
// changes.
type MemoryEngine struct {
	mu    sync.RWMutex // guards the books map only
	books map[string]*book
}

// NewMemoryEngine builds an empty in-memory engine.
func NewMemoryEngine() *MemoryEngine {
	return &MemoryEngine{books: make(map[string]*book)}
}

func key(marketID, selection string) string { return marketID + "|" + selection }

// bookFor returns the (created-on-demand) book for a key. The map is read-locked
// for the common lookup and only write-locked to create a new book.
func (e *MemoryEngine) bookFor(k string) *book {
	e.mu.RLock()
	b := e.books[k]
	e.mu.RUnlock()
	if b != nil {
		return b
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	if b = e.books[k]; b == nil { // double-check after upgrading the lock
		b = &book{}
		e.books[k] = b
	}
	return b
}

// Submit matches an incoming order against the opposite side of the book.
//
// Simplified exchange model: a BACK at price P matches resting LAY orders with
// price >= P (best/highest first); a LAY at price P matches resting BACK orders
// with price <= P (best/lowest first). Matches execute at the resting price; any
// remainder rests on the incoming order's side. Only this order's market+selection
// book is locked, so unrelated markets proceed in parallel.
func (e *MemoryEngine) Submit(_ context.Context, o Order) (*MatchResult, error) {
	b := e.bookFor(key(o.MarketID, o.Selection))
	b.mu.Lock()
	defer b.mu.Unlock()

	res := &MatchResult{}
	remaining := o.Size

	if o.Side == Back {
		sort.SliceStable(b.lays, func(i, j int) bool { return b.lays[i].price > b.lays[j].price })
		b.lays = consume(b.lays, func(r restingOrder) bool { return r.price >= o.Price }, &remaining, res)
		if remaining > 0 {
			b.backs = append(b.backs, restingOrder{userID: o.UserID, price: o.Price, size: remaining})
		}
		res.Exposure = o.Size // backer risks the stake
	} else {
		sort.SliceStable(b.backs, func(i, j int) bool { return b.backs[i].price < b.backs[j].price })
		b.backs = consume(b.backs, func(r restingOrder) bool { return r.price <= o.Price }, &remaining, res)
		if remaining > 0 {
			b.lays = append(b.lays, restingOrder{userID: o.UserID, price: o.Price, size: remaining})
		}
		res.Exposure = o.Size * (o.Price - 1) // layer risks stake * (odds-1)
	}

	res.OpenSize = remaining
	return res, nil
}

// consume walks a resting side, filling the incoming order while the predicate
// holds and size remains, and returns the side with consumed orders removed.
func consume(side []restingOrder, ok func(restingOrder) bool, remaining *float64, res *MatchResult) []restingOrder {
	kept := side[:0]
	for _, r := range side {
		if *remaining <= 0 || !ok(r) {
			kept = append(kept, r)
			continue
		}
		m := r.size
		if m > *remaining {
			m = *remaining
		}
		res.Fills = append(res.Fills, Fill{MatchedSize: m, Price: r.price})
		res.MatchedSize += m
		*remaining -= m
		if r.size > m {
			r.size -= m
			kept = append(kept, r)
		}
	}
	return kept
}

// Book returns an aggregated depth snapshot for a market. It snapshots the set of
// relevant books under a read lock, then locks each briefly to read its depth — so
// it never blocks matching on unrelated markets.
func (e *MemoryEngine) Book(_ context.Context, marketID string) (*BookSnapshot, error) {
	prefix := marketID + "|"
	e.mu.RLock()
	relevant := make([]*book, 0)
	for k, b := range e.books {
		if strings.HasPrefix(k, prefix) {
			relevant = append(relevant, b)
		}
	}
	e.mu.RUnlock()

	backAgg := map[float64]float64{}
	layAgg := map[float64]float64{}
	for _, b := range relevant {
		b.mu.Lock()
		for _, r := range b.backs {
			backAgg[r.price] += r.size
		}
		for _, r := range b.lays {
			layAgg[r.price] += r.size
		}
		b.mu.Unlock()
	}
	return &BookSnapshot{MarketID: marketID, Backs: levels(backAgg), Lays: levels(layAgg)}, nil
}

func levels(agg map[float64]float64) []Level {
	out := make([]Level, 0, len(agg))
	for p, s := range agg {
		out = append(out, Level{Price: p, Size: s})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Price > out[j].Price })
	return out
}
