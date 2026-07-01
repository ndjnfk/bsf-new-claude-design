import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/walletApi', () => ({
  getUserBanks: vi.fn().mockResolvedValue({
    data: [{ id: 1, account_name: 'A', account_number: '123', ifsc_code: 'IFSC0', bank_name: 'HDFC', is_default: true }],
  }),
  createUserBank: vi.fn().mockResolvedValue({}),
  updateUserBank: vi.fn().mockResolvedValue({}),
  deleteUserBank: vi.fn().mockResolvedValue({}),
}))

import BankDetails from './BankDetails'
import { createUserBank, deleteUserBank } from '../services/walletApi'

const createMock = vi.mocked(createUserBank)
const deleteMock = vi.mocked(deleteUserBank)

describe('BankDetails', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists saved banks and creates one with the exact body', async () => {
    render(
      <MemoryRouter>
        <BankDetails />
      </MemoryRouter>,
    )
    expect(await screen.findByText('HDFC')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Add New'))
    fireEvent.change(screen.getByLabelText('Account Name'), { target: { value: 'New A' } })
    fireEvent.change(screen.getByLabelText('Account Number'), { target: { value: '999' } })
    fireEvent.change(screen.getByLabelText('IFSC Code'), { target: { value: 'IFSC9' } })
    fireEvent.change(screen.getByLabelText('Bank Name'), { target: { value: 'SBI' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1))
    expect(createMock).toHaveBeenCalledWith({
      account_name: 'New A',
      account_number: '999',
      ifsc_code: 'IFSC9',
      bank_name: 'SBI',
      is_default: false,
    })
  })

  it('deletes via a React-controlled confirmation modal', async () => {
    render(
      <MemoryRouter>
        <BankDetails />
      </MemoryRouter>,
    )
    await screen.findByText('HDFC')
    fireEvent.click(screen.getByText('Delete')) // row action opens the confirm modal
    expect(await screen.findByText(/are you sure you want to delete/i)).toBeInTheDocument()
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
    fireEvent.click(deleteButtons[deleteButtons.length - 1]) // the modal's Delete
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(1))
  })
})
