import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/casinoApi', async () => {
  const actual = await vi.importActual<typeof import('../services/casinoApi')>('../services/casinoApi')
  return { ...actual, getDreamGameList: vi.fn() }
})

import DreamCasino from './DreamCasino'
import { getDreamGameList } from '../services/casinoApi'

const listMock = vi.mocked(getDreamGameList)

describe('DreamCasino', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listMock.mockResolvedValue({
      data: [
        { game_code: 'g1', name: 'Roulette', category: 'Live', url_thumb: '/t1.png' },
        { game_code: 'g2', name: 'Slots', category: 'Slot', url_thumb: '/t2.png' },
      ],
    })
  })

  it('groups games by category, shows the warning modal and filters', async () => {
    render(
      <MemoryRouter>
        <DreamCasino />
      </MemoryRouter>,
    )
    // entry warning modal (React-controlled)
    expect(await screen.findByText('100 Points = 1 Casino Point')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /okay/i }))

    // category filter buttons + games
    expect(screen.getByRole('button', { name: 'Live' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Slot' })).toBeInTheDocument()
    expect(screen.getByAltText('Roulette')).toBeInTheDocument()
    expect(screen.getByAltText('Slots')).toBeInTheDocument()

    // filtering to Slot hides the Live game
    fireEvent.click(screen.getByRole('button', { name: 'Slot' }))
    expect(screen.queryByAltText('Roulette')).not.toBeInTheDocument()
    expect(screen.getByAltText('Slots')).toBeInTheDocument()
  })
})
