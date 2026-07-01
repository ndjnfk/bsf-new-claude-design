import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/reportsApi', () => ({
  changePasswordReq: vi.fn().mockResolvedValue({ message: 'ok' }),
}))
vi.mock('../hooks/useLogout', () => ({ useLogout: () => vi.fn() }))

import ChangePassword from './ChangePassword'
import { changePasswordReq } from '../services/reportsApi'

const cpMock = vi.mocked(changePasswordReq)

describe('ChangePassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the existing required-field messages and submits the exact field names', async () => {
    render(
      <MemoryRouter>
        <ChangePassword />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Done'))
    expect(await screen.findByText('Current Password is required')).toBeInTheDocument()
    expect(screen.getByText('New Password is required')).toBeInTheDocument()
    expect(screen.getByText('Confirm Password is required')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('OLD PASSWORD'), { target: { value: 'old' } })
    fireEvent.change(screen.getByPlaceholderText('NEW PASSWORD'), { target: { value: 'new1' } })
    fireEvent.change(screen.getByPlaceholderText('CONFIRM PASSWORD'), { target: { value: 'new1' } })
    fireEvent.click(screen.getByText('Done'))

    await waitFor(() => expect(cpMock).toHaveBeenCalledTimes(1))
    expect(cpMock).toHaveBeenCalledWith({ old_password: 'old', newpassword: 'new1', Renewpassword: 'new1' })
  })
})
