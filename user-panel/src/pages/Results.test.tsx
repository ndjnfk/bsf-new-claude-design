import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/dashboardApi', () => ({
  fetchResultsSports: vi.fn().mockResolvedValue({
    data: [
      { id: 4, name: 'Cricket' },
      { id: 2, name: 'Tennis' },
      { id: 77, name: 'Casino' },
    ],
  }),
  fetchResults: vi.fn().mockResolvedValue({
    data: [{ MatchName: 'IND vs AUS) extra', MarketName: 'Match Odds', SelectionName: 'IND', result: 'IND', date: '2026-06-29T10:00:00Z' }],
    meta: { total: 1, per_page: 70 },
  }),
}))

import Results from './Results'
import { fetchResults } from '../services/dashboardApi'

const resMock = vi.mocked(fetchResults)

beforeEach(() => vi.clearAllMocks())

describe('Results', () => {
  it('renders results and filters out casino sports', async () => {
    render(
      <MemoryRouter>
        <Results />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Match Odds')).toBeInTheDocument()
    expect(screen.getByText('Cricket')).toBeInTheDocument()
    expect(screen.getByText('Tennis')).toBeInTheDocument()
    expect(screen.queryByText('Casino')).not.toBeInTheDocument() // sport 77 filtered out
  })

  it('queries with the exact params (sport_id, date, page) on sport change', async () => {
    render(
      <MemoryRouter>
        <Results />
      </MemoryRouter>,
    )
    await screen.findByText('Match Odds') // initial load done
    expect(resMock).toHaveBeenCalledWith({ sport_id: 4, date: '', page: 1 })
    resMock.mockClear()
    fireEvent.click(screen.getByText('Tennis'))
    await waitFor(() => expect(resMock).toHaveBeenCalledWith({ sport_id: 2, date: '', page: 1 }))
  })
})
