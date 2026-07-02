import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/reportsApi', () => ({
  fetchSportsList: vi.fn().mockResolvedValue({ data: [{ id: 4, name: 'Cricket' }] }),
  fetchBetHistory: vi.fn().mockResolvedValue({
    data: { data: [{ Description: 'IND vs AUS', Type: 'Back', Odds: 1.9, Stack: 100, MstDate: '2026-06-29' }], meta: { total: 1, per_page: 10 } },
  }),
  fetchBetHistoryFilter: vi.fn().mockResolvedValue({ data: { data: [] } }),
}))

import BetHistory from './BetHistory'
import { fetchBetHistory } from '../services/reportsApi'

const histMock = vi.mocked(fetchBetHistory)

describe('BetHistory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps Back→LAGAI and submits the exact betHistory params', async () => {
    render(
      <MemoryRouter initialEntries={['/bet-history']}>
        <BetHistory />
      </MemoryRouter>,
    )
    expect(await screen.findByText('IND vs AUS')).toBeInTheDocument()
    expect(screen.getByText('LAGAI')).toBeInTheDocument() // Back → LAGAI

    expect(histMock).toHaveBeenCalledWith(
      expect.objectContaining({ page_no: 1, bet_type: 'M', type: 1 }),
    )

    histMock.mockClear()
    fireEvent.click(screen.getByText('Search'))
    await waitFor(() => expect(histMock).toHaveBeenCalledTimes(1))
  })
})
