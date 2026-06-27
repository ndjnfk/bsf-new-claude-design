// Thin wrapper over the native WebSocket for the live pages.
// Protocol matches the Go hub: send {action:'join'|'leave', room} and receive
// raw room payloads. Joins are queued until the socket is OPEN and re-sent on
// reconnect, so callers can join() immediately without hitting CONNECTING errors.
export type RoomMessage = unknown

export class LiveSocket {
  private ws?: WebSocket
  private handlers = new Set<(msg: RoomMessage) => void>()
  private rooms = new Set<string>() // desired memberships
  private reconnectTimer?: ReturnType<typeof setTimeout>

  connect(): void {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}/ws`)
    this.ws = ws

    ws.onopen = () => {
      // Flush every desired room once the connection is actually open.
      this.rooms.forEach((room) => this.rawSend({ action: 'join', room }))
    }
    ws.onmessage = (e) => {
      let parsed: RoomMessage = e.data
      try {
        parsed = JSON.parse(e.data)
      } catch {
        /* keep raw */
      }
      this.handlers.forEach((h) => h(parsed))
    }
    ws.onclose = () => {
      // Auto-reconnect; the onopen handler re-joins all desired rooms.
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = undefined
          this.connect()
        }, 1500)
      }
    }
    ws.onerror = () => ws.close()
  }

  private rawSend(msg: { action: string; room: string }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  join(room: string): void {
    this.rooms.add(room)
    this.rawSend({ action: 'join', room }) // no-op if still CONNECTING; flushed on open
  }

  leave(room: string): void {
    this.rooms.delete(room)
    this.rawSend({ action: 'leave', room })
  }

  onMessage(handler: (msg: RoomMessage) => void): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  close(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
  }
}
