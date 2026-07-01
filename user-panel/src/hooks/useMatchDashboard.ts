import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { fetchDashboard, parseRunners, type MatchRow } from '../services/dashboardApi'
import { socketService, type SocketHandler, type DbMarket, type RunnerCacheEntry } from '../services/socket'

// Cleanup-safe port of the Angular home/in-play match-dashboard logic: fetch matches,
// merge them in/out by marketid (joining/leaving the matching socket rooms), apply
// live 'message' odds via socketService.updateData, and refresh on
// DASHBOARD_UPDATE_USER / needReload. All subscriptions and rooms are torn down on
// unmount or when sportId changes. `enabled` is false for horse/greyhound sports.
export function useMatchDashboard(sportId: string, enabled = true) {
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const matchesRef = useRef<MatchRow[]>([])
  const runnersRef = useRef<RunnerCacheEntry[]>([])
  const roomsRef = useRef<string[]>([])
  const refreshRef = useRef(true)
  const [, bump] = useReducer((x: number) => x + 1, 0)

  const load = useCallback(async (id: string) => {
    setError(false)
    try {
      const res = await fetchDashboard(id)
      const data = res.data ?? []
      const next = matchesRef.current.slice()

      // Drop matches that are no longer present (leave their rooms).
      for (const f of next.slice()) {
        const marketId = f.marketid?.toString()
        if (marketId && !data.find((el) => el.marketid?.toString() === marketId)) {
          const idx = next.findIndex((el) => el.marketid?.toString() === marketId)
          if (idx > -1) next.splice(idx, 1)
          const sa = roomsRef.current.indexOf(marketId)
          if (sa > -1) {
            roomsRef.current.splice(sa, 1)
            socketService.leaveRoom(marketId)
          }
        }
      }
      // Add new matches (join their rooms).
      for (const el of data) {
        const marketId = el.marketid?.toString()
        if (marketId && !next.find((f) => f.marketid?.toString() === marketId)) {
          el.runners = parseRunners(el.runner_json)
          next.push(el)
          roomsRef.current.push(marketId)
          socketService.joinRoom(marketId)
        }
      }
      matchesRef.current = next
      setMatches([...next])
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setMatches([])
      matchesRef.current = []
      return
    }
    refreshRef.current = true
    setLoading(true)
    void load(sportId).finally(() => setLoading(false))

    socketService.connect()
    socketService.manageRoom(roomsRef.current, true)
    socketService.emit('room', { name: 'DASHBOARD_UPDATE_USER' })

    const onMessage: SocketHandler = (value) => {
      try {
        const data: unknown = JSON.parse(String(value))
        if (refreshRef.current) {
          socketService.updateData(matchesRef.current as unknown as DbMarket[], runnersRef.current, data)
          bump()
        }
      } catch {
        /* ignore malformed payloads */
      }
    }
    const onDash: SocketHandler = () => void load(sportId)
    socketService.on('message', onMessage)
    socketService.on('DASHBOARD_UPDATE_USER', onDash)
    const unsub = socketService.needReload.subscribe((v) => {
      if (v) {
        socketService.connect()
        socketService.manageRoom(roomsRef.current, true)
      }
    })

    return () => {
      refreshRef.current = false
      socketService.off('message', onMessage)
      socketService.off('DASHBOARD_UPDATE_USER', onDash)
      unsub()
      socketService.manageRoom(roomsRef.current, false)
      socketService.leaveRoom('DASHBOARD_UPDATE_USER', '')
      roomsRef.current = []
      matchesRef.current = []
    }
  }, [sportId, enabled, load])

  return { matches, loading, error }
}
