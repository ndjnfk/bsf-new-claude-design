import { useEffect, useRef } from 'react'
import { socketService, type SocketHandler } from '../services/socket'

// Subscribe to a socket event for the component's lifetime; auto-`off` on unmount.
// A ref keeps the latest handler so re-renders don't re-subscribe.
export function useSocketEvent(event: string, handler: SocketHandler): void {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const listener: SocketHandler = (data) => ref.current(data)
    socketService.on(event, listener)
    return () => socketService.off(event, listener)
  }, [event])
}

// Join an 'EID<id>' room on mount and leave it on unmount (Angular manageRoom flow).
export function useSocketRoom(id: number | string | null | undefined, prefix = 'EID'): void {
  useEffect(() => {
    if (id === null || id === undefined) return
    socketService.connect()
    socketService.joinRoom(id)
    return () => socketService.leaveRoom(id, prefix)
  }, [id, prefix])
}

// Join/leave a raw room name (USER_UPDATE_DATA:<id>, MARKET_UPDATE_DATA:<id>, …).
export function useNamedRoom(name: string | null | undefined): void {
  useEffect(() => {
    if (!name) return
    socketService.connect()
    socketService.emit('room', { name })
    return () => socketService.emit('leave_room', { name })
  }, [name])
}

// React to the needReload signal (fired on socket connect).
export function useSocketReload(onReload: () => void): void {
  const ref = useRef(onReload)
  ref.current = onReload
  useEffect(
    () =>
      socketService.needReload.subscribe((v) => {
        if (v) ref.current()
      }),
    [],
  )
}
