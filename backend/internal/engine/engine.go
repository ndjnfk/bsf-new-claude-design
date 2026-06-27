// Package engine is the processing layer: back/lay order matching and risk
// (exposure) computation — the latency-critical hot path of the exchange.
//
// Everything here sits behind the MatchingEngine interface. The betting module
// depends ONLY on that interface, never on this concrete implementation. That
// is the "Rust-ready boundary": when match throughput outgrows in-process Go,
// this package can be replaced by a client that talks to a dedicated Rust
// matching service, and no caller changes.
package engine

import "context"

// Side is the bet side. In the panel UI these are LAGAI (back) and KHAI (lay).
type Side string

const (
	Back Side = "back" // LAGAI — bet FOR a selection
	Lay  Side = "lay"  // KHAI  — bet AGAINST a selection
)

// Order is a request to match at a price/size on a market selection.
// JSON tags define the wire contract shared with the Rust engine service.
type Order struct {
	UserID    int64   `json:"userId"`
	MarketID  string  `json:"marketId"`
	Selection string  `json:"selection"`
	Side      Side    `json:"side"`
	Price     float64 `json:"price"` // decimal odds
	Size      float64 `json:"size"`  // stake
}

// Fill is a (partial) match produced by the engine.
type Fill struct {
	MatchedSize float64 `json:"matchedSize"`
	Price       float64 `json:"price"`
}

// MatchResult is what the engine returns for a submitted order.
type MatchResult struct {
	Fills       []Fill  `json:"fills"`
	MatchedSize float64 `json:"matchedSize"`
	OpenSize    float64 `json:"openSize"` // remainder resting in the book
	Exposure    float64 `json:"exposure"` // worst-case liability for the user
}

// MatchingEngine matches orders against the book and computes exposure.
// Implementations must be safe for concurrent use.
type MatchingEngine interface {
	// Submit matches an order against the order book for its market.
	Submit(ctx context.Context, o Order) (*MatchResult, error)
	// Book returns the current resting orders for a market (depth snapshot).
	Book(ctx context.Context, marketID string) (*BookSnapshot, error)
}

// Level is one price level of aggregated resting size.
type Level struct {
	Price float64 `json:"price"`
	Size  float64 `json:"size"`
}

// BookSnapshot is the back/lay depth for a market selection.
type BookSnapshot struct {
	MarketID string  `json:"marketId"`
	Backs    []Level `json:"backs"`
	Lays     []Level `json:"lays"`
}
