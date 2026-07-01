import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  getEventMarkets,
  getFancies,
  type Fancy,
  type FancyLimit,
  type Market,
  type MatchInfo,
  type Runner,
} from '../services/bettingApi'
import { parseRunners } from '../services/dashboardApi'
import {
  socketService,
  type SocketHandler,
  type DbMarket,
  type IndianFancy,
  type MarketMessage,
  type RunnerCacheEntry,
} from '../services/socket'

const MARKET_ORDER = ['Match Odds', 'Bookmaker', 'Toss', 'Tied Match']

// A request aborted via AbortController (unmount / route change) must NOT surface
// as a user-facing error.
function isAbortError(e: unknown): boolean {
  const err = e as { code?: string; name?: string } | null
  return err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError'
}

function sortMarkets(markets: Market[]): Market[] {
  return [...markets].sort((a, b) => {
    const ia = MARKET_ORDER.indexOf(a.market_name)
    const ib = MARKET_ORDER.indexOf(b.market_name)
    return (ia === -1 ? MARKET_ORDER.length : ia) - (ib === -1 ? MARKET_ORDER.length : ib)
  })
}

type Options = {
  /** Current active fancy + side (bet slip) for the "Run Changed" detection. */
  activeFancyRef?: React.MutableRefObject<Fancy | null>
  sideRef?: React.MutableRefObject<'back' | 'lay' | null>
  onRunChanged?: () => void
  /** Called on UPDATE_MATCH_EVENT to clear the open bet slip (Angular clearBet). */
  onClearBet?: () => void
}

// Cleanup-safe port of the Angular event component's data + socket layer. Loads the
// match / markets / fancies, joins the per-match rooms, applies live market/fancy
// updates, and tears everything down (rooms, refreshData flag) on unmount.
export function useEventData(
  matchId: string,
  marketId: string,
  sportId: string,
  userId: number | string | undefined,
  opts: Options = {},
) {
  const [match, setMatch] = useState<MatchInfo>({})
  const [markets, setMarkets] = useState<Market[]>([])
  const [fancies, setFancies] = useState<Fancy[]>([])
  const [fancyLimits, setFancyLimits] = useState<FancyLimit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Retry handle for the error state — re-runs the whole load (and re-subscribes
  // the sockets) by bumping the effect key.
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const marketsRef = useRef<Market[]>([])
  const fanciesRef = useRef<Fancy[]>([])
  const runnersRef = useRef<RunnerCacheEntry[]>([])
  const fancyRoomsRef = useRef<string[]>([])
  const lineVolumeRef = useRef<number>(1)
  const refreshRef = useRef(true)
  const [, bump] = useReducer((x: number) => x + 1, 0)

  const optsRef = useRef(opts)
  optsRef.current = opts

  const loadMarkets = useCallback(
    async (signal?: AbortSignal) => {
      const res = await getEventMarkets(matchId, marketId, sportId, signal)
      const data = (res.data ?? []).map((m) => ({
        ...m,
        runners: (m.runners as Runner[] | undefined) ?? (parseRunners(m.runner_json) as Runner[]),
      }))
      marketsRef.current = sortMarkets(data)
      setMarkets(marketsRef.current)
    },
    [matchId, marketId, sportId],
  )

  const loadFancies = useCallback(
    async (refresh = false, signal?: AbortSignal) => {
      if (String(sportId) !== '4') return
      try {
        const res = await getFancies(matchId, { category: 'All', filter: '', ...(refresh ? { refresh } : {}) }, signal)
        fanciesRef.current = res.data ?? []
        setFancies(fanciesRef.current)
        setFancyLimits(res.fancyLimits ?? [])
        // Join each line-fancy market room for live updates.
        for (const f of fanciesRef.current) {
          const room = f.market_id ? String(f.market_id) : ''
          if (room && !fancyRoomsRef.current.includes(room)) {
            fancyRoomsRef.current.push(room)
            socketService.joinRoom(room)
          }
        }
      } catch {
        /* fancies are best-effort */
      }
    },
    [matchId, sportId],
  )

  useEffect(() => {
    refreshRef.current = true
    let active = true
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    ;(async () => {
      try {
        // The match header is derived from the markets response (it denormalises
        // the match info onto every row), so no separate match request is made.
        await loadMarkets(controller.signal)
        if (!active) return
        const first = marketsRef.current[0]
        const info: MatchInfo = first
          ? { matchName: first.matchName, MstDate: first.MstDate, MstCode: first.matchid }
          : {}
        lineVolumeRef.current = 1
        setMatch(info)
        await loadFancies(false, controller.signal)
      } catch (e) {
        if (active && !isAbortError(e)) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    })()

    // ── Join the per-match rooms (exact Angular names) ──────────────────────
    socketService.connect()
    const betsRoom = `BETS_UPDATE_DATA:${userId}_${matchId}`
    socketService.emit('room', { name: betsRoom })
    socketService.emit('room', { name: `MATCH_UPDATE_DATA:${matchId}` })
    socketService.emit('room', { name: `UPDATE_MATCH_EVENT:${matchId}` })
    socketService.emit('room', { name: `MARKET_UPDATE_DATA:${matchId}` })
    socketService.emit('UPDATE_MARKETS', matchId)
    socketService.emit('UPDATE_FANCY', matchId)
    socketService.emit('room', { name: `FANCY${matchId}` })

    // ── Live update handlers ────────────────────────────────────────────────
    const onMessage: SocketHandler = (value) => {
      if (!refreshRef.current) return
      try {
        const data: unknown = JSON.parse(String(value))
        socketService.updateData(marketsRef.current as unknown as DbMarket[], runnersRef.current, data)
        socketService.updateLineFancyData(
          fanciesRef.current as unknown as IndianFancy[],
          data as MarketMessage,
          lineVolumeRef.current,
        )
        bump()
      } catch {
        /* ignore malformed */
      }
    }
    const onFancy: SocketHandler = (value) => {
      try {
        const dd: unknown = JSON.parse(String(value))
        const changed = socketService.updateFancyData(
          fanciesRef.current as unknown as IndianFancy[],
          dd as never,
          (optsRef.current.activeFancyRef?.current ?? null) as unknown as IndianFancy | null,
          optsRef.current.sideRef?.current ?? null,
          null,
        )
        if (changed === 'Run Changed') optsRef.current.onRunChanged?.()
        bump()
      } catch {
        /* ignore */
      }
    }
    const onMarketData: SocketHandler = (value) => {
      try {
        const data = JSON.parse(String(value)) as { data?: { market_id?: string } }
        const mk = marketsRef.current.find((m) => String(m.marketid) === String(data.data?.market_id))
        if (mk && data.data) Object.assign(mk, data.data)
        bump()
      } catch {
        /* ignore */
      }
    }
    const onUpdateMarkets: SocketHandler = () => void loadMarkets()
    const onMatchEvent: SocketHandler = (value) => {
      try {
        const data = JSON.parse(String(value)) as Partial<MatchInfo>
        setMatch((prev) => ({ ...prev, maxStack: data.maxStack, minStack: data.minStack, volumeLimit: data.volumeLimit }))
      } catch {
        /* ignore */
      }
      optsRef.current.onClearBet?.()
    }
    const onMatchUpdate: SocketHandler = (value) => {
      try {
        const data = JSON.parse(String(value)) as Partial<MatchInfo>
        if (data) setMatch((prev) => ({ ...prev, tvUrl: data.tvUrl, score_board_json: data.score_board_json }))
      } catch {
        /* ignore */
      }
    }
    const onUpdateFancy: SocketHandler = (value) => {
      try {
        const v = JSON.parse(String(value)) as Fancy & { ID?: number | string }
        if (v && v.ID !== undefined) {
          const f = fanciesRef.current.find((x) => String(x.ID) === String(v.ID))
          if (f) {
            const { SessInptNo, SessInptYes, ...rest } = v
            void SessInptNo
            void SessInptYes
            Object.assign(f, rest)
            bump()
          }
        } else {
          void loadFancies(true)
        }
      } catch {
        /* ignore */
      }
    }

    socketService.on('message', onMessage)
    socketService.on(`FANCY${matchId}`, onFancy)
    socketService.on(`MARKET_UPDATE_DATA:${matchId}`, onMarketData)
    socketService.on(`UPDATE_MARKETS${matchId}`, onUpdateMarkets)
    socketService.on(`UPDATE_MATCH_EVENT:${matchId}`, onMatchEvent)
    socketService.on(`MATCH_UPDATE_DATA:${matchId}`, onMatchUpdate)
    socketService.on(`UPDATE_FANCY${matchId}`, onUpdateFancy)
    const unsubReload = socketService.needReload.subscribe((reload) => {
      if (reload) socketService.connect()
    })

    return () => {
      active = false
      refreshRef.current = false
      controller.abort()
      socketService.off('message', onMessage)
      socketService.off(`FANCY${matchId}`, onFancy)
      socketService.off(`MARKET_UPDATE_DATA:${matchId}`, onMarketData)
      socketService.off(`UPDATE_MARKETS${matchId}`, onUpdateMarkets)
      socketService.off(`UPDATE_MATCH_EVENT:${matchId}`, onMatchEvent)
      socketService.off(`MATCH_UPDATE_DATA:${matchId}`, onMatchUpdate)
      socketService.off(`UPDATE_FANCY${matchId}`, onUpdateFancy)
      unsubReload()
      socketService.manageRoom(fancyRoomsRef.current, false)
      socketService.leaveRoom(`FANCY${matchId}`, '')
      socketService.leaveRoom(`UPDATE_MARKETS${matchId}`, '')
      socketService.leaveRoom(`UPDATE_FANCY${matchId}`, '')
      socketService.leaveRoom(`MATCH_UPDATE_DATA:${matchId}`, '')
      socketService.leaveRoom(`MARKET_UPDATE_DATA:${matchId}`, '')
      socketService.leaveRoom(betsRoom, '')
      fancyRoomsRef.current = []
    }
  }, [matchId, marketId, sportId, userId, loadMarkets, loadFancies, reloadKey])

  return { match, markets, fancies, fancyLimits, loading, error, reload }
}
