import { useEffect } from 'react'
import { LiveSocket, type RoomMessage } from '../lib/socket'

// One shared WebSocket for the whole app, lazily connected.
let shared: LiveSocket | null = null
function socket(): LiveSocket {
  if (!shared) {
    shared = new LiveSocket()
    shared.connect()
  }
  return shared
}

// useRoom subscribes to a realtime room and invokes onMessage for each payload.
// Pass room = null to subscribe to nothing.
export function useRoom(room: string | null, onMessage: (msg: RoomMessage) => void) {
  useEffect(() => {
    if (!room) return
    const s = socket()
    s.join(room)
    const off = s.onMessage(onMessage)
    return () => {
      off()
      s.leave(room)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])
}

// useRooms subscribes to several rooms at once (e.g. one per ancestor in the
// hierarchy chain) with a single message handler.
export function useRooms(rooms: string[], onMessage: (msg: RoomMessage) => void) {
  const key = rooms.join(',')
  useEffect(() => {
    if (!rooms.length) return
    const s = socket()
    rooms.forEach((r) => s.join(r))
    const off = s.onMessage(onMessage)
    return () => {
      off()
      rooms.forEach((r) => s.leave(r))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
