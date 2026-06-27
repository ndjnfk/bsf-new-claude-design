// Package realtime is the live plane: a WebSocket hub backed by Redis pub/sub.
//
// Every running instance of the monolith subscribes to the same Redis channels,
// so a message published on one instance reaches sockets connected to any other.
// That is what lets the app scale horizontally behind a load balancer with no
// sticky sessions. The hub implements events.Publisher for other modules.
package realtime

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/redis/go-redis/v9"
)

// Client is a single connected socket with a buffered outbound channel.
type Client struct {
	ID    string
	send  chan []byte
	rooms map[string]struct{}
}

// Send queues a message, dropping it if the buffer is full (slow client).
func (c *Client) Send(msg []byte) {
	select {
	case c.send <- msg:
	default:
	}
}

// Outbound exposes the send channel to the writer goroutine.
func (c *Client) Outbound() <-chan []byte { return c.send }

type envelope struct {
	Room string          `json:"room"`
	Data json.RawMessage `json:"data"`
}

// Hub tracks local clients/rooms and bridges to Redis.
type Hub struct {
	rdb *redis.Client

	mu      sync.RWMutex
	clients map[string]*Client
	rooms   map[string]map[string]*Client
}

// NewHub builds a hub bound to a Redis client.
func NewHub(rdb *redis.Client) *Hub {
	return &Hub{rdb: rdb, clients: map[string]*Client{}, rooms: map[string]map[string]*Client{}}
}

// NewClient registers a new client.
func (h *Hub) NewClient(id string) *Client {
	c := &Client{ID: id, send: make(chan []byte, 256), rooms: map[string]struct{}{}}
	h.mu.Lock()
	h.clients[id] = c
	h.mu.Unlock()
	return c
}

// Remove drops a client from all rooms and closes its channel.
func (h *Hub) Remove(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for room := range c.rooms {
		if m, ok := h.rooms[room]; ok {
			delete(m, c.ID)
			if len(m) == 0 {
				delete(h.rooms, room)
			}
		}
	}
	delete(h.clients, c.ID)
	close(c.send)
}

// Join adds a client to a room.
func (h *Hub) Join(c *Client, room string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	c.rooms[room] = struct{}{}
	if h.rooms[room] == nil {
		h.rooms[room] = map[string]*Client{}
	}
	h.rooms[room][c.ID] = c
}

// Leave removes a client from a room.
func (h *Hub) Leave(c *Client, room string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(c.rooms, room)
	if m, ok := h.rooms[room]; ok {
		delete(m, c.ID)
		if len(m) == 0 {
			delete(h.rooms, room)
		}
	}
}

// Publish sends data to a room across the whole cluster via Redis.
// Implements events.Publisher.
func (h *Hub) Publish(ctx context.Context, room string, data any) error {
	raw, err := json.Marshal(data)
	if err != nil {
		return err
	}
	env, err := json.Marshal(envelope{Room: room, Data: raw})
	if err != nil {
		return err
	}
	return h.rdb.Publish(ctx, channel(room), env).Err()
}

func (h *Hub) deliverLocal(room string, msg []byte) {
	h.mu.RLock()
	members := h.rooms[room]
	targets := make([]*Client, 0, len(members))
	for _, c := range members {
		targets = append(targets, c)
	}
	h.mu.RUnlock()
	for _, c := range targets {
		c.Send(msg)
	}
}

// Run subscribes to all room channels and fans messages to local members until
// ctx is cancelled.
func (h *Hub) Run(ctx context.Context) {
	pubsub := h.rdb.PSubscribe(ctx, channel("*"))
	defer pubsub.Close()
	ch := pubsub.Channel()
	for {
		select {
		case <-ctx.Done():
			return
		case m, ok := <-ch:
			if !ok {
				return
			}
			var env envelope
			if err := json.Unmarshal([]byte(m.Payload), &env); err != nil {
				log.Printf("realtime: bad envelope: %v", err)
				continue
			}
			h.deliverLocal(env.Room, env.Data)
		}
	}
}

func channel(room string) string { return "room:" + room }
