import { io, type Socket } from 'socket.io-client'
import { SOCKET_URL, SOCKET_PATH } from '../api/env'
import { BehaviorSubject } from '../utils/observable'

// ─────────────────────────────────────────────────────────────────────────────
// Types for the realtime payloads. These ONLY add typing — the merge logic in
// updateData / updateFancyData / updateLineFancyData is preserved byte-for-byte
// from the Angular SocketService (no calculation changed or simplified).
// ─────────────────────────────────────────────────────────────────────────────

/** A best back/lay ladder entry from the feed: [level, price, size]. */
export type LadderEntry = number[]

export interface FeedRunnerChange {
  id: number | string
  batb?: LadderEntry[]
  batl?: LadderEntry[]
  [key: string]: unknown
}

export interface MarketDefinitionRunner {
  id?: number | string
  status?: string
  sortPriority?: number
  [key: string]: unknown
}

export interface MarketDefinition {
  inPlay?: boolean
  status?: string
  runners?: MarketDefinitionRunner[]
  [key: string]: unknown
}

export interface MarketMessage {
  id: number | string
  marketDefinition?: MarketDefinition
  rc?: FeedRunnerChange[]
  inPlay?: boolean
  status?: string
  [key: string]: unknown
}

export interface PriceSize {
  price: number
  size: string
}

export interface DbRunner {
  id: number | string
  status?: string
  back?: PriceSize[]
  lay?: PriceSize[]
  [key: string]: unknown // dynamic back0/back1/lay0… keys
}

export interface DbMarket {
  marketid: number | string
  volume: number
  inPlay?: boolean
  status?: string
  isLive?: boolean
  runners?: DbRunner[]
  [key: string]: unknown
}

export interface RunnerCacheEntry {
  marketId: number | string
  runners: MarketDefinitionRunner[]
}

export interface IndianFancy {
  ind_fancy_selection_id: number | string
  is_indian_fancy?: number
  status?: string
  SessInptYes?: number | string
  YesValume?: number | string
  SessInptNo?: number | string
  NoValume?: number | string
  market_id?: number | string | null
  hasResult?: boolean
  [key: string]: unknown
}

export interface FancyFeed {
  SelectionId: number | string
  GameStatus: string
  BackPrice1: number | string
  BackSize1: number | string
  LayPrice1: number | string
  LaySize1: number | string
  [key: string]: unknown
}

export type SocketHandler = (data: unknown) => void

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key)

// Default factory — one Socket.IO client, autoConnect off, exact URL/path/transport
// preserved from the Angular SocketIoConfig.
const defaultFactory = (): Socket =>
  io(SOCKET_URL, { autoConnect: false, path: SOCKET_PATH, transports: ['websocket'] })

// React-compatible port of the Angular SocketService. A single underlying socket is
// created lazily and reused, so connections can never duplicate.
export class SocketService {
  currentUserId: number | undefined
  currentUserType: number | undefined
  isConnected = false
  readonly needReload = new BehaviorSubject<boolean>(false)

  private socket: Socket | null = null
  private connectCalls = 0

  constructor(private readonly socketFactory: () => Socket = defaultFactory) {}

  /** Lazily create the single socket and wire lifecycle handlers exactly once. */
  private ensureSocket(): Socket {
    if (!this.socket) {
      const s = this.socketFactory()
      s.on('connect', () => {
        this.isConnected = true
        this.needReload.next(true)
      })
      s.on('disconnect', () => {
        this.isConnected = false
      })
      // In socket.io v4 'reconnect' is a Manager event; same effect as Angular.
      s.io.on('reconnect', () => {
        this.isConnected = true
      })
      s.on('connect_error', () => {
        this.isConnected = false
      })
      this.socket = s
    }
    return this.socket
  }

  socketAuth(): void {
    this.ensureSocket().auth = {
      token: sessionStorage.getItem('token'),
      xId: this.currentUserId,
      xType: this.currentUserType,
    }
  }

  /** Connect once — never opens a second connection if already connected. */
  connect(): void {
    const s = this.ensureSocket()
    if (s.connected) return
    this.connectCalls += 1
    s.connect()
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.isConnected = false
  }

  /** Number of times an actual connect was issued (duplicate-prevention assert). */
  get connectAttempts(): number {
    return this.connectCalls
  }

  on(event: string, handler: SocketHandler): void {
    this.ensureSocket().on(event, handler)
  }

  off(event: string, handler?: SocketHandler): void {
    this.ensureSocket().off(event, handler)
  }

  emit(event: string, payload?: unknown): void {
    this.ensureSocket().emit(event, payload)
  }

  manageRoom(array: Array<number | string>, joinRoom = true): Array<number | string> {
    if (joinRoom) {
      if (array.length > 0) {
        this.connect()
        array.forEach((s) => {
          this.joinRoom(s)
        })
      }
      return array
    } else {
      if (array.length > 0) {
        array.forEach((s) => {
          this.leaveRoom(s)
        })
      }
      return []
    }
  }

  joinRoom(id: number | string): void {
    this.emit('room', { name: 'EID' + id?.toString() })
  }

  leaveRoom(id: number | string, prefix = 'EID'): void {
    this.emit('leave_room', { name: prefix + id?.toString() })
  }

  // ── Odds merge (preserved verbatim from Angular; only types added) ──────────
  updateData(all: DbMarket[], runners: RunnerCacheEntry[], data: unknown): void {
    if (data === null || !data || Array.isArray(data)) {
      return
    }

    if (all.length > 0) {
      const m = data as MarketMessage
      const mm = all.find((el) => el.marketid?.toString() === m.id?.toString())
      if (mm) {
        const marketVolume = mm.volume
        let runnersTemp: MarketDefinitionRunner[] = []

        const runnerArray = runners.find((el) => el.marketId === m.id)
        if (runnerArray) {
          runnersTemp = runnerArray.runners
        }
        if (hasOwn(m, 'marketDefinition') && m.marketDefinition) {
          mm.inPlay = m.marketDefinition.inPlay
          mm.status = m.marketDefinition.status

          mm.isLive = m.inPlay && m.status === 'OPEN'

          if (hasOwn(m.marketDefinition, 'runners') && m.marketDefinition.runners) {
            runnersTemp = m.marketDefinition.runners

            const i = runners.findIndex((el) => el.marketId === m.id)

            const dataToApply: RunnerCacheEntry = { marketId: m.id, runners: runnersTemp }

            if (i > -1) {
              runners[i] = dataToApply
            } else {
              runners.push(dataToApply)
            }
          }
        }

        const runner = runnersTemp.sort((a, b) => ((a.sortPriority ?? 0) > (b.sortPriority ?? 0) ? 1 : -1))

        const rc = m.rc
        if (hasOwn(m, 'rc') && rc) {
          runner.forEach((r) => {
            const blData = rc.find((el) => el.id === r.id)
            if (blData) {
              const dbRunner: DbRunner =
                mm.runners?.find((dr) => dr.id?.toString() === r.id?.toString()) ?? ({} as DbRunner)

              if (hasOwn(blData, 'batb') && blData.batb) {
                const back = blData.batb.sort((a, b) => (a[0] > b[0] ? 1 : -1))

                const bTemp: PriceSize[] = []
                back.forEach((b, i) => {
                  dbRunner['back' + i] = { price: b[1], size: (b[2] * marketVolume).toFixed(2) }
                  bTemp.push({ price: b[1], size: (b[2] * marketVolume).toFixed(2) })
                })

                dbRunner.back = bTemp
              }

              if (hasOwn(blData, 'batl') && blData.batl) {
                const lay = blData.batl.sort((a, b) => (a[0] > b[0] ? 1 : -1))

                const lTemp: PriceSize[] = []

                lay.forEach((b, i) => {
                  dbRunner['lay' + i] = { price: b[1], size: (b[2] * marketVolume).toFixed(2) }
                  lTemp.push({ price: b[1], size: (b[2] * marketVolume).toFixed(2) })
                })

                dbRunner.lay = lTemp
              }

              if (hasOwn(r, 'status') && r.status !== undefined) {
                dbRunner.status = r.status
              }
            }
          })
        }
      }
    }
  }

  updateFancyData(
    fancies: IndianFancy[],
    data: FancyFeed[] | null | undefined,
    activeFancy: IndianFancy | null = null,
    side: string | null = null,
    stakeError: string | null = null,
  ): string | null {
    if (!data || data.length == 0) {
      return stakeError
    }

    fancies.forEach((f) => {
      const find = data.find(
        (e) => e.SelectionId.toString() === f.ind_fancy_selection_id.toString() && f.is_indian_fancy === 1,
      )
      f.hasResult = false

      if (find) {
        f.status = find.GameStatus.trim() === 'ONLINE' ? '' : find.GameStatus.trim()
        f.SessInptYes = find.BackPrice1
        f.YesValume = find.BackSize1
        f.SessInptNo = find.LayPrice1
        f.NoValume = find.LaySize1

        if (activeFancy) {
          if (f.ind_fancy_selection_id === activeFancy.ind_fancy_selection_id) {
            const valueType = side === 'lay' ? 'SessInptNo' : 'SessInptYes'
            if (
              f.NoValume !== activeFancy.NoValume ||
              f.YesValume !== activeFancy.YesValume ||
              f.status !== activeFancy.status ||
              f[valueType] !== activeFancy[valueType]
            ) {
              stakeError = 'Run Changed'
            }
          }
        }
      } else {
        if (!f.market_id) {
          f.hasResult = true
          f.status = 'Result Awaiting'
        }
      }
    })

    // Angular mutated `fancies` in place and discarded stakeError; we additionally
    // return it so callers can react to "Run Changed". Mutation behaviour unchanged.
    return stakeError
  }

  updateLineFancyData(fancies: IndianFancy[], data: MarketMessage | null | undefined, volume = 1): void {
    if (data === null || !data || Array.isArray(data)) {
      return
    }

    fancies.forEach((f) => {
      if (data.id == f.market_id) {
        if (hasOwn(data, 'marketDefinition') && data.marketDefinition) {
          f.status = data.marketDefinition.status === 'OPEN' ? '' : data.marketDefinition.status

          const rc = data.rc
          if (hasOwn(data, 'rc') && rc) {
            if (rc.length > 0) {
              const runner = rc[0]

              if (hasOwn(runner, 'batb') && runner.batb) {
                const back = runner.batb.sort((a, b) => (a[0] > b[0] ? 1 : -1))
                f.SessInptYes = Math.round(back[0][1])
                f.YesValume = (back[0][2] * volume).toFixed(2)
              }

              if (hasOwn(runner, 'batl') && runner.batl) {
                const lay = runner.batl.sort((a, b) => (a[0] > b[0] ? 1 : -1))
                f.SessInptNo = Math.round(lay[0][1])
                f.NoValume = (lay[0][2] * volume).toFixed(2)
              }
            }
          }
        }
      }
    })
  }
}

// Single shared instance for the app.
export const socketService = new SocketService()

// ── Backward-compatible helpers (used by the auth store / api client) ──────────

// setUser() equivalent — record identity and prime the handshake auth. Connect is
// deferred to the realtime phase.
export function setSocketIdentity(id: { userId?: number; userType?: number }): void {
  socketService.currentUserId = id.userId
  socketService.currentUserType = id.userType
  socketService.socketAuth()
}

export const connectSocket = (): void => socketService.connect()
export const disconnectSocket = (): void => socketService.disconnect()
export const joinRoom = (id: number | string): void => socketService.joinRoom(id)
export const leaveRoom = (id: number | string, prefix = 'EID'): void => socketService.leaveRoom(id, prefix)
