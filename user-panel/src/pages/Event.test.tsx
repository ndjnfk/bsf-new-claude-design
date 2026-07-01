import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const { MARKETS } = vi.hoisted(() => ({
  MARKETS: {
    data: [
      {
        marketid: '1.2',
        market_name: 'Match Odds',
        min_stack: 100,
        max_stack: 100000,
        runners: [{ id: 'r1', name: 'India', status: 'ACTIVE', back0: { price: 2, size: 50 }, lay0: { price: 2.1, size: 40 } }],
      },
    ],
  },
}))
vi.mock('../services/bettingApi', () => ({
  getMatch: vi.fn().mockResolvedValue({ data: { matchName: 'IND vs AUS', MstCode: 'M1' } }),
  getEventMarkets: vi.fn().mockResolvedValue(MARKETS),
  getMarkets: vi.fn().mockResolvedValue(MARKETS),
  getFancies: vi.fn().mockResolvedValue({ data: [], fancyLimits: [] }),
  getFancyLiability: vi.fn().mockResolvedValue({ data: {} }),
  placeMarketBet: vi.fn().mockResolvedValue({ status: true }),
  placeFancyBet: vi.fn().mockResolvedValue({ status: true }),
  placeLineBet: vi.fn().mockResolvedValue({ status: true }),
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
import { placeMarketBet } from '../services/bettingApi'
import { useAuth } from '../store/auth'
import type { AuthUser } from '../types'

const placeMock = vi.mocked(placeMarketBet)

function renderEvent() {
  render(
    <MemoryRouter initialEntries={['/event/10/1.2/4']}>
      <Routes>
        <Route path="/event/:event_id/:market_id/:sport_id" element={<Event />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.setState({ status: 'ready', user: { mstrid: 1, usetype: 3, stakes: [100, 500] } as AuthUser })
})

describe('Event page', () => {
  it('renders the match, market and runner with back/lay prices', async () => {
    renderEvent()
    expect(await screen.findByText('IND vs AUS')).toBeInTheDocument()
    expect(screen.getByText('India')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // back price
    expect(screen.getByText('2.1')).toBeInTheDocument() // lay price
  })

  it('opens the bet slip and places a bet with the exact market payload', async () => {
    renderEvent()
    await screen.findByText('India')
    fireEvent.click(screen.getByText('2')) // click the back price → opens slip
    const stakeInput = await screen.findByPlaceholderText('0')
    fireEvent.change(stakeInput, { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: /place bet/i }))

    await waitFor(() => expect(placeMock).toHaveBeenCalledTimes(1))
    expect(placeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'M1',
        matchName: 'IND vs AUS',
        selectionId: 'r1',
        runnerName: 'India',
        marketId: '1.2',
        stake: 100,
        price: 2,
        isBack: 0,
        deviceInfo: '1',
        inPlay: true,
        profit: 100, // round(2*100 - 100)
        isCashout: false,
        sportId: '4',
      }),
    )
  })

  it('prevents duplicate submissions on rapid double-click', async () => {
    renderEvent()
    await screen.findByText('India')
    fireEvent.click(screen.getByText('2'))
    const stakeInput = await screen.findByPlaceholderText('0')
    fireEvent.change(stakeInput, { target: { value: '100' } })
    const place = screen.getByRole('button', { name: /place bet/i })
    fireEvent.click(place)
    fireEvent.click(place) // second click should be ignored by the in-flight guard
    await waitFor(() => expect(placeMock).toHaveBeenCalledTimes(1))
  })
})
