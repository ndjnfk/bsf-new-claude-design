import { useEffect, useRef } from 'react'
import { liveSocket } from '../services/liveSocket'
import { useAuth } from '../store/auth'

// Keeps the header/footer Coins + Total Exp. live. The Go backend publishes
// USER_UPDATE_DATA:<id> whenever a bettor's balance moves (bet placed / voided /
// settled, or a parent deposit/withdraw once wired) and EXPOSURE:<id> when their
// exposure changes. On either signal we re-read /api/user/me so both figures match
// the server immediately. Mounted once from AppLayout so every authenticated page
// gets live values.
export function useLiveBalance(): void {
  const userId = useAuth((s) => s.user?.mstrid)
  const refreshUser = useAuth((s) => s.refreshUser)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!userId) return
    const rooms = [`USER_UPDATE_DATA:${userId}`, `EXPOSURE:${userId}`]
    rooms.forEach((r) => liveSocket.join(r))

    const off = liveSocket.onMessage((msg) => {
      const m = msg as { type?: string; userId?: number | string } | null
      if (!m || typeof m !== 'object') return
      if (m.type !== 'USER_UPDATE_DATA' && m.type !== 'EXPOSURE') return
      // Ignore payloads addressed to a different user sharing the connection.
      if (m.userId != null && String(m.userId) !== String(userId)) return
      // Debounce bursts — one bet fires an exposure delta and a balance move.
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void refreshUser(), 150)
    })

    return () => {
      off()
      rooms.forEach((r) => liveSocket.leave(r))
      if (timer.current) clearTimeout(timer.current)
    }
  }, [userId, refreshUser])
}
