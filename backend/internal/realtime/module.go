package realtime

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Module wires the WebSocket endpoint to the hub.
type Module struct{ hub *Hub }

// New builds the realtime module.
func New(hub *Hub) *Module { return &Module{hub: hub} }

// Register mounts the WebSocket endpoint at GET /ws. Clients send
// {action:"join"|"leave", room:"..."} and receive raw room payloads.
func (m *Module) Register(app *fiber.App) {
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws", websocket.New(m.handle))
}

func (m *Module) handle(conn *websocket.Conn) {
	client := m.hub.NewClient(uuid.NewString())
	defer m.hub.Remove(client)

	done := make(chan struct{})
	go func() {
		defer close(done)
		for msg := range client.Outbound() {
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}()

	type ctrl struct {
		Action string `json:"action"`
		Room   string `json:"room"`
	}
	for {
		var msg ctrl
		if err := conn.ReadJSON(&msg); err != nil {
			break
		}
		switch msg.Action {
		case "join":
			m.hub.Join(client, msg.Room)
		case "leave":
			m.hub.Leave(client, msg.Room)
		}
	}
	<-done
}
