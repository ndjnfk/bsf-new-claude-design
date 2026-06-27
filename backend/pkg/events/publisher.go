// Package events defines cross-module contracts for real-time messaging so
// modules depend on an interface, not on each other's concrete types.
package events

import "context"

// Publisher fans a message out to everyone subscribed to a room (cluster-wide,
// via Redis pub/sub). The realtime module implements it; betting/sports/etc.
// depend only on this interface.
type Publisher interface {
	Publish(ctx context.Context, room string, data any) error
}

// Nop is a Publisher that discards messages (useful in tests / when realtime
// is disabled).
type Nop struct{}

// Publish implements Publisher and does nothing.
func (Nop) Publish(context.Context, string, any) error { return nil }
