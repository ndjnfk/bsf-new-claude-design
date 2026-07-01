import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/dashboardApi', () => ({ fetchCasinoLimit: vi.fn() }))

import GamesList from './GamesList'
import { fetchCasinoLimit } from '../services/dashboardApi'

const mock = vi.mocked(fetchCasinoLimit)

beforeEach(() => vi.clearAllMocks())

describe('GamesList', () => {
  it('shows the casino games when net chips are within the limit', async () => {
    mock.mockResolvedValue({ data: { casino_limit: 100, data: [{ NetChips: 50 }] } })
    render(
      <MemoryRouter>
        <GamesList />
      </MemoryRouter>,
    )
    expect(await screen.findByAltText('Royal Casino')).toBeInTheDocument()
  })

  it('renders nothing when the casino limit is 0', async () => {
    mock.mockResolvedValue({ data: { casino_limit: 0, data: [] } })
    const { container } = render(
      <MemoryRouter>
        <GamesList />
      </MemoryRouter>,
    )
    await waitFor(() => expect(mock).toHaveBeenCalled())
    expect(container.querySelector('.game-box')).toBeNull()
  })
})
