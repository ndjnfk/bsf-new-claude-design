import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/registrationApi', () => ({
  checkUsername: vi.fn().mockResolvedValue({ status: true }),
  registerUser: vi.fn().mockResolvedValue({ status: true }),
}))

import Register from './Register'
import { registerUser } from '../services/registrationApi'
import { useAuth } from '../store/auth'

const registerMock = vi.mocked(registerUser)

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Register />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // show_register gates the Register submit button.
  useAuth.setState({ status: 'ready', user: null, domain: { show_register: true } })
})

describe('Register page', () => {
  it('renders all fields', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Enter Username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter otp')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('shows the existing required-field validation messages', async () => {
    renderPage()
    fireEvent.click(screen.getByText('Register'))
    expect(await screen.findByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('OTP is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(screen.getByText('Confirm Password is required')).toBeInTheDocument()
  })

  it('submits userRegister with the exact payload (FromDate + fixed fields)', async () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText('Enter Username'), { target: { value: 'newuser' } })
    fireEvent.change(screen.getByPlaceholderText('Enter Name'), { target: { value: 'New User' } })
    fireEvent.change(screen.getByPlaceholderText('Enter Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter otp'), { target: { value: '1234' } })
    const [pwd, cpwd] = screen.getAllByPlaceholderText('Enter Password')
    fireEvent.change(pwd, { target: { value: 'secret1' } })
    fireEvent.change(cpwd, { target: { value: 'secret1' } })
    fireEvent.click(screen.getByText('Register'))

    await waitFor(() => expect(registerMock).toHaveBeenCalledTimes(1))
    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'newuser',
        name: 'New User',
        email: 'a@b.com',
        otp: '1234',
        password: 'secret1',
        cPassword: 'secret1',
        ip_address: '1',
        session: '1',
        rememberMe: false,
        FromDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
  })
})
