import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('./services/sessionApi', () => ({ fetchSession: vi.fn() }))
vi.mock('./services/captchaApi', () => ({ fetchCaptcha: vi.fn().mockResolvedValue({ captcha: [1, 2, 3, 4], unix: 1 }) }))
vi.mock('./services/sportsApi', () => ({ fetchSports: vi.fn().mockResolvedValue([]), toMenu: () => [] }))
vi.mock('./services/dashboardApi', () => ({
  fetchDashboard: vi.fn().mockResolvedValue({ data: [] }),
  fetchHorse: vi.fn().mockResolvedValue({ data: [] }),
  parseRunners: () => [],
}))
vi.mock('./services/socket', () => ({
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
    needReload: { subscribe: vi.fn(() => () => undefined) },
  },
}))

import { App } from './App'
import { fetchSession } from './services/sessionApi'
import { useAuth } from './store/auth'

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  useAuth.setState({ status: 'loading', user: null, token: null, domain: null, showDeposit: false })
})

describe('App initialization', () => {
  it('shows the loader, then redirects an unauthenticated user to the login page', async () => {
    vi.mocked(fetchSession).mockResolvedValue({ user: null })
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText(/starting/i)).toBeInTheDocument() // loading gate
    expect(await screen.findByPlaceholderText(/enter username/i)).toBeInTheDocument() // login form

  })

  it('lands an authenticated user on the user-home hub inside the shared layout', async () => {
    vi.mocked(fetchSession).mockResolvedValue({ user: { mstrid: 1, usetype: 3 } })
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByAltText('IN PLAY')).toBeInTheDocument() // user-home card image
    expect(screen.getByText('Inplay')).toBeInTheDocument() // header nav (shared layout)
  })
})
