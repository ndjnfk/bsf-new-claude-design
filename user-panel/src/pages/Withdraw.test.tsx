import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/walletApi', async () => {
  const actual = await vi.importActual<typeof import('../services/walletApi')>('../services/walletApi')
  return {
    ...actual,
    getUserBanks: vi.fn().mockResolvedValue({ data: [] }),
    fastWithdrawShow: vi.fn().mockResolvedValue({ data: { min_withdraw: 100, max_withdraw: 10000, fast_withdraw: 0 } }),
    getBanks: vi.fn().mockResolvedValue({
      data: [
        { payment: 9, bankId: 55 },
        { payment: 1, bankId: 11 },
      ],
    }),
    withdraw: vi.fn().mockResolvedValue({ status: true }),
  }
})

import Withdraw from './Withdraw'
import { withdraw } from '../services/walletApi'

const wdMock = vi.mocked(withdraw)

describe('Withdraw', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows bank-only fields for Bank Transfer (9) and submits the exact payload', async () => {
    render(
      <MemoryRouter>
        <Withdraw />
      </MemoryRouter>,
    )
    // pick the Bank Transfer gateway
    fireEvent.click(await screen.findByRole('button', { name: 'Bank Transfer' }))

    // bank gateway → account number/ifsc/bank/branch shown, UPI hidden
    expect(await screen.findByText('ACCOUNT NUMBER')).toBeInTheDocument()
    expect(screen.getByText('IFSC CODE')).toBeInTheDocument()
    expect(screen.getByText('BRANCH NAME')).toBeInTheDocument()
    expect(screen.queryByText('UPI ID / MOBILE NUMBER')).not.toBeInTheDocument()

    const set = (label: string, value: string) => {
      const input = screen.getByText(label).parentElement?.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value } })
    }
    set('ACCOUNT NAME', 'John')
    set('ACCOUNT NUMBER', '123456')
    set('IFSC CODE', 'IFSC0001')
    set('BANK NAME', 'HDFC')
    set('BRANCH NAME', 'MainBranch')
    set('AMOUNT', '500')
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }))

    await waitFor(() => expect(wdMock).toHaveBeenCalledTimes(1))
    expect(wdMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payment: '9',
        acc_name: 'John',
        acc_num: '123456',
        ifsc_code: 'IFSC0001',
        bank_name: 'HDFC',
        branch_name: 'MainBranch',
        amount: 500,
        req_method: 0,
        fast_withdraw: 0,
        acc_type: '55',
      }),
    )
  })
})
