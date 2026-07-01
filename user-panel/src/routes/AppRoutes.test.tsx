import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// The authenticated layout loads sports + uses the socket — stub both so routing
// tests don't hit the network.
vi.mock('../services/sportsApi', () => ({ fetchSports: vi.fn().mockResolvedValue([]), toMenu: () => [] }))
vi.mock('../services/captchaApi', () => ({ fetchCaptcha: vi.fn().mockResolvedValue({ captcha: [1, 2, 3, 4], unix: 1 }) }))
vi.mock('../services/dashboardApi', () => ({
  fetchDashboard: vi.fn().mockResolvedValue({ data: [] }),
  fetchHorse: vi.fn().mockResolvedValue({ data: [] }),
  fetchResults: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, per_page: 70 } }),
  fetchResultsSports: vi.fn().mockResolvedValue({ data: [] }),
  fetchCasinoLimit: vi.fn().mockResolvedValue({ data: { casino_limit: 100, data: [{ NetChips: 50 }] } }),
  parseRunners: () => [],
}))
vi.mock('../services/reportsApi', () => ({
  fetchBetHistory: vi.fn().mockResolvedValue({ data: { data: [], meta: { total: 0, per_page: 10 } } }),
  fetchBetHistoryFilter: vi.fn().mockResolvedValue({ data: { data: [] } }),
  fetchSportsList: vi.fn().mockResolvedValue({ data: [] }),
  fetchAccountStatement: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, per_page: 50 }, openingBalance: 0 }),
  fetchLedger: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, per_page: 50 } }),
}))
vi.mock('../services/bettingApi', () => ({
  getMatch: vi.fn().mockResolvedValue({ data: { matchName: 'IND vs AUS' } }),
  getEventMarkets: vi.fn().mockResolvedValue({ data: [] }),
  getMarkets: vi.fn().mockResolvedValue({ data: [] }),
  getFancies: vi.fn().mockResolvedValue({ data: [], fancyLimits: [] }),
  getFancyLiability: vi.fn().mockResolvedValue({ data: {} }),
  placeMarketBet: vi.fn(),
  placeFancyBet: vi.fn(),
  placeLineBet: vi.fn(),
}))
vi.mock('../services/socket', () => ({
  setSocketIdentity: vi.fn(),
  disconnectSocket: vi.fn(),
  connectSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
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

import { AppRoutes } from './AppRoutes'
import { useAuth } from '../store/auth'
import type { AuthUser } from '../types'

const asUser = { mstrid: 1, usetype: 3 } as AuthUser

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

beforeEach(() => useAuth.setState({ status: 'ready', user: null }))

describe('routing', () => {
  it('redirects the default route to /login-m', async () => {
    renderAt('/')
    expect(await screen.findByPlaceholderText(/enter username/i)).toBeInTheDocument()
  })

  it('shows NotFound for unknown URLs', async () => {
    renderAt('/totally-unknown-path')
    expect(await screen.findByText(/page not found/i)).toBeInTheDocument()
  })

  it('redirects a protected route to login when unauthenticated', async () => {
    renderAt('/bet-history')
    expect(await screen.findByPlaceholderText(/enter username/i)).toBeInTheDocument()
  })

  it('renders a protected page when authenticated', async () => {
    useAuth.setState({ user: asUser })
    renderAt('/bet-history')
    expect(await screen.findByRole('heading', { name: /bet history/i })).toBeInTheDocument()
  })

  it('resolves the dynamic event route and loads the match', async () => {
    useAuth.setState({ user: asUser })
    renderAt('/event/10/1.2/4')
    expect(await screen.findByText('IND vs AUS')).toBeInTheDocument()
  })

  it('keeps the exact camelCase URL spelling (gamesList)', async () => {
    useAuth.setState({ user: asUser })
    renderAt('/gamesList')
    expect(await screen.findByAltText('Royal Casino')).toBeInTheDocument()
  })

  it('treats /ledger as the account-statement component (ledger mode)', async () => {
    useAuth.setState({ user: asUser })
    renderAt('/ledger')
    expect(await screen.findByRole('heading', { name: /^ledger$/i })).toBeInTheDocument()
  })
})
