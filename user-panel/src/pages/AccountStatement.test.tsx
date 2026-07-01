import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/reportsApi', () => ({
  fetchAccountStatement: vi.fn().mockResolvedValue({
    data: [{ Sdate: '2026-06-29', Narration: 'Bet settled', Debit: 0, Credit: 100, balance: 1100 }],
    meta: { total: 1, per_page: 50 },
    openingBalance: 1000,
  }),
  fetchLedger: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, per_page: 50 } }),
}))

import AccountStatement from './AccountStatement'

describe('AccountStatement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders statement rows with the opening balance and filters', async () => {
    render(
      <MemoryRouter initialEntries={['/account-statement']}>
        <AccountStatement />
      </MemoryRouter>,
    )
    // Statement page loads rows from /api/user/accountStatement (mocked above).
    expect(await screen.findByText('Bet settled')).toBeInTheDocument()
    expect(screen.getByText('Opening balance')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument() // opening balance row
    expect(screen.getByText('1100')).toBeInTheDocument() // row balance
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument() // filter shown for account statement
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument() // export icon
    expect(screen.getByText('Balance')).toBeInTheDocument() // balance column
  })
})
