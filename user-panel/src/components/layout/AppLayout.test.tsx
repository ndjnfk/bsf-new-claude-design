import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../../services/sportsApi', () => ({ fetchSports: vi.fn().mockResolvedValue([]), toMenu: () => [] }))
vi.mock('../../services/socket', () => ({
  setSocketIdentity: vi.fn(),
  disconnectSocket: vi.fn(),
  connectSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
}))
vi.mock('../../api/http', () => ({
  get: vi.fn().mockResolvedValue({ data: [] }),
  post: vi.fn().mockResolvedValue({}),
  put: vi.fn(),
  del: vi.fn(),
}))

import { AppLayout } from './AppLayout'
import { useAuth } from '../../store/auth'
import { useSports } from '../../store/sports'
import { useLayoutUi } from '../../store/layoutUi'
import type { AuthUser, SportMenuItem } from '../../types'

const user: AuthUser = {
  mstrid: 1,
  usetype: 3,
  mstruserid: 'demo',
  mstrname: 'Demo User',
  balance: 1000,
  liability: 50,
  allow_deposit_withdraw: true,
}
const sportMenu: SportMenuItem[] = [
  { id: 4, name: 'Cricket', image: '/assets/image/cricket.png', url: '/home', qr: { sport_id: 4 } },
]

function renderLayout(path = '/home') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<div>PAGE CONTENT</div>} />
          <Route path="/wallet-home" element={<div>PAGE CONTENT</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuth.setState({ status: 'ready', user, domain: { name: 'Brand', user_headline: 'Welcome!' }, showDeposit: true })
  useSports.setState({ sportMenu, loaded: true })
  useLayoutUi.setState({ leftOpen: false, rightOpen: false, sideMenuOpen: false, modal: null })
})

describe('AppLayout', () => {
  it('renders header user info, nav, right-bar and page outlet', () => {
    renderLayout()
    expect(screen.getAllByText('Demo User').length).toBeGreaterThan(0) // header + right-bar
    expect(screen.getByText(/Coins :/)).toBeInTheDocument() // balance row
    expect(screen.getByText('Inplay')).toBeInTheDocument() // header nav
    expect(screen.queryByText('Cricket')).not.toBeInTheDocument() // left "All Sports" drawer removed
    expect(screen.getByText('Account Statement')).toBeInTheDocument() // right-bar
    expect(screen.getByText('PAGE CONTENT')).toBeInTheDocument() // outlet
  })

  it('hides the footer on non-footer routes (Angular comments <app-footer> out there)', () => {
    renderLayout('/home')
    expect(screen.queryByText('About us')).not.toBeInTheDocument()
  })

  it('shows the footer only on footer routes (e.g. /wallet-home)', () => {
    renderLayout('/wallet-home')
    expect(screen.getByText('About us')).toBeInTheDocument()
  })

  it('shows the welcome marquee with the domain headline appended', () => {
    renderLayout()
    expect(screen.getByText(/welcome to bsf test/i)).toBeInTheDocument()
    expect(screen.getByText(/Welcome!/)).toBeInTheDocument()
  })

  it('opens the Open Bets modal from the right-bar "view" (replacing jQuery .modal)', async () => {
    renderLayout()
    fireEvent.click(screen.getByText('view'))
    expect(await screen.findByText('Open Bets')).toBeInTheDocument()
    expect(await screen.findByText('No Data')).toBeInTheDocument()
  })

  it('toggles the left drawer body class via state (no jQuery)', () => {
    renderLayout()
    expect(document.body.classList.contains('sidebar-enable')).toBe(false)
    act(() => useLayoutUi.getState().toggleLeft())
    expect(document.body.classList.contains('sidebar-enable')).toBe(true)
  })
})
