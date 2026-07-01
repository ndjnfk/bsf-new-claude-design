import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../services/casinoApi', async () => {
  const actual = await vi.importActual<typeof import('../services/casinoApi')>('../services/casinoApi')
  return { ...actual, getUserCasinoLimit: vi.fn(), getPokerUrl: vi.fn() }
})

import Poker from './Poker'
import { getUserCasinoLimit, getPokerUrl } from '../services/casinoApi'

const limitMock = vi.mocked(getUserCasinoLimit)
const urlMock = vi.mocked(getPokerUrl)

describe('Poker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    urlMock.mockResolvedValue({ mobileUrl: 'https://m.example', desktopUrl: 'https://d.example' })
  })

  it('launches the game iframe when within the casino limit', async () => {
    limitMock.mockResolvedValue({ data: { casino_limit: 100, data: [{ NetChips: 50 }] } })
    render(<Poker />)
    expect(await screen.findByTitle('Poker')).toBeInTheDocument()
  })

  it('shows the limit-over message when casino_limit is 0', async () => {
    limitMock.mockResolvedValue({ data: { casino_limit: 0, data: [] } })
    render(<Poker />)
    expect(await screen.findByText(/entertainment limit is over/i)).toBeInTheDocument()
  })
})
