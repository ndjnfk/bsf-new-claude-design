import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Hoisted mock fns so the factory can reference them safely.
const { getEventMarketsMock, getMatchMock } = vi.hoisted(() => ({
  getEventMarketsMock: vi.fn(),
  getMatchMock: vi.fn(),
}))

vi.mock('../services/bettingApi', () => ({
  getMatch: getMatchMock,
  getEventMarkets: getEventMarketsMock,
  getMarkets: getEventMarketsMock,
  getFancies: vi.fn().mockResolvedValue({ data: [], fancyLimits: [] }),
  getFancyLiability: vi.fn().mockResolvedValue({ data: {} }),
  placeMarketBet: vi.fn(),
  placeFancyBet: vi.fn(),
  placeLineBet: vi.fn(),
}))

vi.mock('../services/socket', () => ({
  socketService: {
    connect: vi.fn(),
    manageRoom: vi.fn(() => []),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    updateData: vi.fn(),
    updateFancyData: vi.fn(() => null),
    updateLineFancyData: vi.fn(),
    needReload: { subscribe: vi.fn(() => () => undefined) },
  },
}))

import Event from './Event'
import { socketService } from '../services/socket'
import { useAuth } from '../store/auth'
import type { AuthUser } from '../types'

const MARKET = {
  marketid: '1.2',
  market_name: 'Match Odds',
  runners: [{ id: 'r1', name: 'India', back0: { price: 2, size: 5 }, lay0: { price: 2.1, size: 4 } }],
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/event/:event_id/:market_id/:sport_id" element={<Event />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getMatchMock.mockResolvedValue({ data: {} })
  getEventMarketsMock.mockResolvedValue({ data: [] })
  useAuth.setState({ status: 'ready', user: { mstrid: 1, usetype: 3, stakes: [100] } as AuthUser })
})

describe('Event page states', () => {
  it('shows an invalid-event page for a malformed id and never calls the markets API', () => {
    renderAt('/event/abc/1.2/4') // eventId not numeric → invalid
    expect(screen.getByText(/invalid event/i)).toBeInTheDocument()
    expect(getEventMarketsMock).not.toHaveBeenCalled()
  })

  it('renders the empty-markets message when there are no markets', async () => {
    getEventMarketsMock.mockResolvedValue({ data: [] })
    renderAt('/event/10/1.2/4')
    expect(await screen.findByText(/no markets available/i)).toBeInTheDocument()
  })

  it('shows an error with a working Retry button', async () => {
    getEventMarketsMock.mockRejectedValueOnce(new Error('network')).mockResolvedValue({ data: [MARKET] })
    renderAt('/event/10/1.2/4')
    const retry = await screen.findByRole('button', { name: /retry/i })
    fireEvent.click(retry)
    expect(await screen.findByText('Match Odds')).toBeInTheDocument()
  })

  it('does not leak technical error details to the UI', async () => {
    getEventMarketsMock.mockRejectedValue(new Error('SQLSTATE 500 secret stack trace'))
    renderAt('/event/10/1.2/4')
    await screen.findByRole('button', { name: /retry/i })
    expect(screen.queryByText(/SQLSTATE|stack trace/i)).not.toBeInTheDocument()
  })

  it('removes socket listeners on unmount', async () => {
    getEventMarketsMock.mockResolvedValue({ data: [MARKET] })
    const { unmount } = renderAt('/event/10/1.2/4')
    await screen.findByText('Match Odds')
    unmount()
    await waitFor(() => expect(vi.mocked(socketService.off)).toHaveBeenCalled())
  })
})
