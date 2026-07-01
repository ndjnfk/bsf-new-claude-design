// Package exposure maintains LIVE per-level liability incrementally and cheaply.
//
// Hot path (per bet): ONE recursive CTE walks the chain, Redis counters are
// updated immediately (authoritative live value), an EXPOSURE event is published,
// and the MySQL deltas are ACCUMULATED in memory. A background flusher writes them
// to users.exposure in a single batched statement every couple of seconds — so a
// bet never blocks on N synchronous MySQL writes.
//
// The bettor's OWN liability is held directly against their balance (debited at
// placement by the betting module), so it is NOT tracked here — this tracker
// carries only the ANCESTORS' unrealised partnership risk (their telescoped share
// of the book). On settlement the same amount is released.
package exposure

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"

	"bsf2020/pkg/events"
)

type node struct {
	id    int64
	share float64
}

// Tracker applies/releases exposure across a bettor's chain.
type Tracker struct {
	db  *sqlx.DB
	rdb *redis.Client
	pub events.Publisher

	mu      sync.Mutex
	pending map[int64]float64 // userID → delta awaiting a MySQL flush
}

// New builds the tracker.
func New(db *sqlx.DB, rdb *redis.Client, pub events.Publisher) *Tracker {
	return &Tracker{db: db, rdb: rdb, pub: pub, pending: map[int64]float64{}}
}

// Apply adjusts exposure for a bet of `liability` placed by bettorID. sign = +1 on
// placement, -1 when the bet settles. Off the MySQL hot path: Redis + publish are
// immediate; MySQL is flushed asynchronously.
func (t *Tracker) Apply(ctx context.Context, bettorID int64, liability, sign float64) {
	if t == nil || liability == 0 {
		return
	}
	chain, err := t.chain(ctx, bettorID)
	if err != nil || len(chain) == 0 {
		return
	}
	// Per-user deltas: only ancestors carry exposure here — each its telescoped
	// share of the book. The bettor's own liability is held against their balance
	// (debited at placement), so it is deliberately excluded.
	deltas := make(map[int64]float64, len(chain))
	for i := 1; i < len(chain); i++ {
		deltas[chain[i].id] += sign * (chain[i].share - chain[i-1].share) / 100 * liability
	}

	pipe := t.rdb.Pipeline()
	t.mu.Lock()
	for id, d := range deltas {
		if d == 0 {
			continue
		}
		pipe.IncrByFloat(ctx, fmt.Sprintf("exposure:%d", id), d) // live, immediate
		t.pending[id] += d                                       // MySQL later, batched
	}
	t.mu.Unlock()
	_, _ = pipe.Exec(ctx)

	if t.pub != nil {
		for id, d := range deltas {
			if d == 0 {
				continue
			}
			_ = t.pub.Publish(ctx, fmt.Sprintf("EXPOSURE:%d", id),
				map[string]any{"type": "EXPOSURE", "userId": id, "delta": d})
		}
	}
}

// chain returns the bettor + every ancestor with its partnership share in ONE
// recursive query. Bettor share 0 (no share on its own bet); SDA (usetype 0) = 100.
func (t *Tracker) chain(ctx context.Context, bettorID int64) ([]node, error) {
	var rows []struct {
		ID             int64   `db:"id"`
		PartnerCricket float64 `db:"partner_cricket"`
		Usetype        int     `db:"usetype"`
		Depth          int     `db:"depth"`
	}
	err := t.db.SelectContext(ctx, &rows, `
		WITH RECURSIVE chain (id, parent_id, partner_cricket, usetype, depth) AS (
		  SELECT id, parent_id, partner_cricket, usetype, 0 FROM users WHERE id = ?
		  UNION ALL
		  SELECT u.id, u.parent_id, u.partner_cricket, u.usetype, c.depth+1
		    FROM users u JOIN chain c ON u.id = c.parent_id
		)
		SELECT id, partner_cricket, usetype, depth FROM chain ORDER BY depth`, bettorID)
	if err != nil {
		return nil, err
	}
	out := make([]node, 0, len(rows))
	for i, r := range rows {
		share := r.PartnerCricket
		if r.Usetype == 0 {
			share = 100
		}
		if i == 0 {
			share = 0 // bettor takes no share on its own bet
		}
		out = append(out, node{id: r.ID, share: share})
	}
	return out, nil
}

// Run flushes the accumulated MySQL exposure deltas in a single batched statement
// on a ticker, until ctx is cancelled.
func (t *Tracker) Run(ctx context.Context) {
	tk := time.NewTicker(2 * time.Second)
	defer tk.Stop()
	for {
		select {
		case <-ctx.Done():
			t.flush(context.Background())
			return
		case <-tk.C:
			t.flush(ctx)
		}
	}
}

func (t *Tracker) flush(ctx context.Context) {
	t.mu.Lock()
	if len(t.pending) == 0 {
		t.mu.Unlock()
		return
	}
	batch := t.pending
	t.pending = map[int64]float64{}
	t.mu.Unlock()

	// One statement for the whole batch:
	//   UPDATE users SET exposure = exposure + CASE id WHEN ? THEN ? ... END
	//   WHERE id IN (?, ...)
	var cases strings.Builder
	cases.WriteString("UPDATE users SET exposure = exposure + CASE id ")
	args := make([]any, 0, len(batch)*2+len(batch))
	ids := make([]any, 0, len(batch))
	for id, d := range batch {
		cases.WriteString("WHEN ? THEN ? ")
		args = append(args, id, d)
		ids = append(ids, id)
	}
	cases.WriteString("ELSE 0 END WHERE id IN (")
	for i := range ids {
		if i > 0 {
			cases.WriteString(",")
		}
		cases.WriteString("?")
	}
	cases.WriteString(")")
	args = append(args, ids...)

	if _, err := t.db.ExecContext(ctx, cases.String(), args...); err != nil {
		// On failure, fold the batch back so it retries next tick.
		t.mu.Lock()
		for id, d := range batch {
			t.pending[id] += d
		}
		t.mu.Unlock()
	}
}
