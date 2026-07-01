import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../services/captchaApi', () => ({
  fetchCaptcha: vi.fn().mockResolvedValue({ captcha: [1, 2, 3, 4], unix: 123 }),
}))
vi.mock('../../services/authApi', () => ({
  login: vi.fn().mockResolvedValue({ user: { mstrid: 1, usetype: 3 }, change_password: false }),
  logout: vi.fn(),
}))
vi.mock('../../services/sportsApi', () => ({ fetchSports: vi.fn().mockResolvedValue([]), toMenu: () => [] }))
vi.mock('../../services/socket', () => ({
  setSocketIdentity: vi.fn(),
  disconnectSocket: vi.fn(),
  connectSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
}))

import { LoginForm } from './LoginForm'
import { login as loginRequest } from '../../services/authApi'
import { useAuth } from '../../store/auth'

const loginMock = vi.mocked(loginRequest)

function renderForm() {
  render(
    <MemoryRouter initialEntries={['/login-m']}>
      <LoginForm />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  useAuth.setState({ status: 'ready', user: null, domain: null, showDeposit: false })
})

describe('LoginForm', () => {
  it('renders the username/password/captcha inputs and the captcha challenge', async () => {
    renderForm()
    expect(screen.getByPlaceholderText('Enter Username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Password')).toBeInTheDocument()
    expect(screen.getByText('LOG IN')).toBeInTheDocument()
    expect(await screen.findByText('1')).toBeInTheDocument() // captcha digit loaded
    expect(screen.getByPlaceholderText('Enter captcha')).toBeInTheDocument() // shown once challenge arrives
  })

  it('shows the existing required-field validation messages', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText('This field is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('submits the exact login payload (incl. captcha challenge + device info)', async () => {
    renderForm()
    await screen.findByText('1') // ensure captcha state populated
    fireEvent.change(screen.getByPlaceholderText('Enter Username'), { target: { value: 'demo' } })
    fireEvent.change(screen.getByPlaceholderText('Enter Password'), { target: { value: 'secret' } })
    fireEvent.change(screen.getByPlaceholderText('Enter captcha'), { target: { value: '1234' } })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1))
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'demo',
        password: 'secret',
        captcha: '1234',
        device_info: 'Desktop',
        captcha_time: 123,
        captcha_numbers: '1234',
      }),
    )
  })
})
