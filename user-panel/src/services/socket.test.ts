import { describe, it, expect, beforeEach } from 'vitest'
import type { Socket } from 'socket.io-client'
import {
  SocketService,
  type SocketHandler,
  type DbMarket,
  type RunnerCacheEntry,
  type MarketMessage,
  type IndianFancy,
  type FancyFeed,
} from './socket'

type Listener = (...args: unknown[]) => void

// Minimal in-memory stand-in for a socket.io Socket, capturing emits/handlers so the
// service can be exercised without a real connection.
class FakeSocket {
  connected = false
  auth: unknown = undefined
  connectCount = 0
  emitted: Array<{ event: string; payload: unknown }> = []
  private handlers: Record<string, Listener[]> = {}
  private managerHandlers: Record<string, Listener[]> = {}

  io = {
    on: (event: string, h: Listener): void => {
      const list = (this.managerHandlers[event] ??= [])
      list.push(h)
    },
  }

  on(event: string, h: Listener): this {
    const list = (this.handlers[event] ??= [])
    list.push(h)
    return this
  }
  off(event: string, h?: Listener): this {
    if (h) this.handlers[event] = (this.handlers[event] ?? []).filter((x) => x !== h)
    else delete this.handlers[event]
    return this
  }
  emit(event: string, payload?: unknown): this {
    this.emitted.push({ event, payload })
    return this
  }
  connect(): this {
    this.connectCount += 1
    this.connected = true
    this.trigger('connect')
    return this
  }
  disconnect(): this {
    this.connected = false
    this.trigger('disconnect')
    return this
  }
  trigger(event: string, ...args: unknown[]): void {
    const list = this.handlers[event] ?? []
    list.forEach((h) => h(...args))
  }
}

function makeService() {
  const fake = new FakeSocket()
  const svc = new SocketService(() => fake as unknown as Socket)
  return { fake, svc }
}

beforeEach(() => sessionStorage.clear())

describe('connection handling', () => {
  it('connects only once and never duplicates the connection', () => {
    const { fake, svc } = makeService()
    svc.connect()
    svc.connect()
    expect(fake.connectCount).toBe(1)
    expect(svc.connectAttempts).toBe(1)
    expect(svc.isConnected).toBe(true)
  })

  it('marks disconnected on disconnect()', () => {
    const { svc } = makeService()
    svc.connect()
    svc.disconnect()
    expect(svc.isConnected).toBe(false)
  })

  it('fires needReload(true) on the connect lifecycle event', () => {
    const { svc } = makeService()
    const seen: boolean[] = []
    svc.needReload.subscribe((v) => seen.push(v))
    svc.connect()
    expect(seen).toContain(true)
  })
})

describe('auth payload', () => {
  it('builds the handshake auth from token + currentUserId/Type', () => {
    const { fake, svc } = makeService()
    sessionStorage.setItem('token', 'jwt')
    svc.currentUserId = 5
    svc.currentUserType = 3
    svc.socketAuth()
    expect(fake.auth).toEqual({ token: 'jwt', xId: 5, xType: 3 })
  })
})

describe('rooms', () => {
  it('joins and leaves EID rooms with the exact event + payload', () => {
    const { fake, svc } = makeService()
    svc.joinRoom(42)
    svc.leaveRoom(42)
    svc.leaveRoom(7, 'FANCY')
    expect(fake.emitted).toContainEqual({ event: 'room', payload: { name: 'EID42' } })
    expect(fake.emitted).toContainEqual({ event: 'leave_room', payload: { name: 'EID42' } })
    expect(fake.emitted).toContainEqual({ event: 'leave_room', payload: { name: 'FANCY7' } })
  })

  it('manageRoom connects and joins all on true, leaves all on false', () => {
    const { fake, svc } = makeService()
    expect(svc.manageRoom([1, 2], true)).toEqual([1, 2])
    expect(fake.emitted.filter((e) => e.event === 'room')).toHaveLength(2)
    expect(svc.manageRoom([1, 2], false)).toEqual([])
    expect(fake.emitted.filter((e) => e.event === 'leave_room')).toHaveLength(2)
  })
})

describe('event subscription', () => {
  it('on/off add and remove a handler', () => {
    const { fake, svc } = makeService()
    const calls: unknown[] = []
    const h: SocketHandler = (d) => calls.push(d)
    svc.on('USER', h)
    fake.trigger('USER', { a: 1 })
    expect(calls).toHaveLength(1)
    svc.off('USER', h)
    fake.trigger('USER', { a: 2 })
    expect(calls).toHaveLength(1)
  })
})

// ─── The market/betting merge calculations — must be byte-for-byte preserved ───

describe('updateData', () => {
  it('merges back/lay ladders with volume-scaled sizes and live flags', () => {
    const { svc } = makeService()
    const all: DbMarket[] = [{ marketid: '1.1', volume: 2, runners: [{ id: 100 }, { id: 200 }] }]
    const runners: RunnerCacheEntry[] = []
    const data: MarketMessage = {
      id: '1.1',
      inPlay: true,
      status: 'OPEN',
      marketDefinition: {
        inPlay: true,
        status: 'OPEN',
        runners: [
          { id: 100, sortPriority: 1 },
          { id: 200, sortPriority: 2 },
        ],
      },
      rc: [
        {
          id: 100,
          batb: [
            [0, 1.5, 10],
            [1, 1.4, 20],
          ],
          batl: [[0, 1.6, 5]],
        },
      ],
    }

    svc.updateData(all, runners, data)

    const r100 = all[0].runners?.find((r) => r.id === 100)
    expect(r100?.back0).toEqual({ price: 1.5, size: '20.00' }) // 10 * volume(2)
    expect(r100?.back).toEqual([
      { price: 1.5, size: '20.00' },
      { price: 1.4, size: '40.00' },
    ])
    expect(r100?.lay0).toEqual({ price: 1.6, size: '10.00' }) // 5 * volume(2)
    expect(all[0].inPlay).toBe(true)
    expect(all[0].status).toBe('OPEN')
    expect(all[0].isLive).toBe(true)
    expect(runners).toHaveLength(1) // runner cache populated
  })

  it('ignores null / array payloads', () => {
    const { svc } = makeService()
    const all: DbMarket[] = [{ marketid: '1', volume: 1 }]
    expect(() => svc.updateData(all, [], null)).not.toThrow()
    expect(() => svc.updateData(all, [], [1, 2])).not.toThrow()
  })
})

describe('updateFancyData', () => {
  const feed: FancyFeed[] = [
    { SelectionId: '55', GameStatus: 'ONLINE', BackPrice1: 100, BackSize1: 1000, LayPrice1: 102, LaySize1: 1000 },
  ]

  it('maps live session prices and clears status when ONLINE', () => {
    const { svc } = makeService()
    const fancies: IndianFancy[] = [{ ind_fancy_selection_id: '55', is_indian_fancy: 1, market_id: 1 }]
    const err = svc.updateFancyData(fancies, feed)
    expect(fancies[0].status).toBe('')
    expect(fancies[0].SessInptYes).toBe(100)
    expect(fancies[0].YesValume).toBe(1000)
    expect(fancies[0].SessInptNo).toBe(102)
    expect(err).toBeNull()
  })

  it('flags "Run Changed" when the active fancy values move', () => {
    const { svc } = makeService()
    const fancies: IndianFancy[] = [{ ind_fancy_selection_id: '55', is_indian_fancy: 1, market_id: 1 }]
    const active: IndianFancy = { ind_fancy_selection_id: '55', NoValume: 999, YesValume: 0, status: '', SessInptYes: 0 }
    expect(svc.updateFancyData(fancies, feed, active, 'back')).toBe('Run Changed')
  })

  it('marks unmatched fancies without a market_id as Result Awaiting', () => {
    const { svc } = makeService()
    const fancies: IndianFancy[] = [{ ind_fancy_selection_id: '99', is_indian_fancy: 1, market_id: null }]
    svc.updateFancyData(fancies, feed)
    expect(fancies[0].hasResult).toBe(true)
    expect(fancies[0].status).toBe('Result Awaiting')
  })
})

describe('updateLineFancyData', () => {
  it('rounds line prices and scales volume', () => {
    const { svc } = makeService()
    const fancies: IndianFancy[] = [{ ind_fancy_selection_id: '7', market_id: 'm1' }]
    const data: MarketMessage = {
      id: 'm1',
      marketDefinition: { status: 'OPEN' },
      rc: [{ id: 1, batb: [[0, 99.6, 500]], batl: [[0, 100.4, 600]] }],
    }
    svc.updateLineFancyData(fancies, data, 1)
    expect(fancies[0].status).toBe('')
    expect(fancies[0].SessInptYes).toBe(100) // Math.round(99.6)
    expect(fancies[0].YesValume).toBe('500.00')
    expect(fancies[0].SessInptNo).toBe(100) // Math.round(100.4)
    expect(fancies[0].NoValume).toBe('600.00')
  })
})
