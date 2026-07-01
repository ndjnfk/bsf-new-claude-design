// Native WebSocket client for the Go realtime hub. The Go backend speaks a plain
// WS protocol at /ws — {action:'join'|'leave', room} out, raw room payloads in —
// NOT socket.io. The legacy socket.io client (services/socket.ts) therefore never
// connects to it; this client is the native-WS bridge the migration plan (§4)
// prescribes, used here to keep the header/footer balance + exposure live.
//
// Joins are queued until the socket is OPEN and re-sent on reconnect, so callers
// can join() immediately. A single shared instance is reused app-wide.
export type RoomMessage = unknown

export class LiveSocket {
  private ws?: WebSocket
  private handlers = new Set<(msg: RoomMessage) => void>()
  private rooms = new Set<string>() // desired memberships
  private reconnectTimer?: ReturnType<typeof setTimeout>
  private started = false

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }
    this.started = true
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
      // Auto-reconnect while we still want a connection; onopen re-joins all rooms.
      if (this.started && !this.reconnectTimer) {
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
    this.connect()
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
    this.started = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    this.ws?.close()
  }
}

// Single shared instance for the app.
export const liveSocket = new LiveSocket()
