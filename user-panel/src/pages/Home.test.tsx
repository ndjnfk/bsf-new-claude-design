import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/dashboardApi', () => ({
  fetchDashboard: vi.fn().mockResolvedValue({
    data: [
      { matchid: 10, marketid: '1.2', sportid: 4, matchName: 'IND vs AUS', series_name: 'Test', match_bets_count: 3, runner_json: '[]' },
    ],
  }),
  fetchHorse: vi.fn().mockResolvedValue({ data: [] }),
  parseRunners: () => [],
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
    needReload: { subscribe: vi.fn(() => () => undefined) },
  },
}))

import Home from './Home'
import { useSports } from '../store/sports'
import type { SportMenuItem } from '../types'

const sportMenu: SportMenuItem[] = [
  { id: 4, name: 'Cricket', image: '/assets/image/cricket.png', url: '/home', qr: { sport_id: 4 } },
]

beforeEach(() => useSports.setState({ sportMenu, loaded: true }))

describe('Home', () => {
  it('renders the sport tab and the matches from the dashboard feed', async () => {
    render(
      <MemoryRouter initialEntries={['/home?sport_id=4']}>
        <Home />
      </MemoryRouter>,
    )
    expect(await screen.findByText('IND vs AUS')).toBeInTheDocument()
    expect(screen.getByText('Cricket')).toBeInTheDocument() // sport tab
    expect(screen.getByText('Match Bets - 3')).toBeInTheDocument()
  })
})
