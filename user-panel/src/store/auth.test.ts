import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../services/sessionApi', () => ({ fetchSession: vi.fn() }))
vi.mock('../services/socket', () => ({
  setSocketIdentity: vi.fn(),
  disconnectSocket: vi.fn(),
  connectSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
}))
vi.mock('../services/authApi', () => ({ login: vi.fn(), logout: vi.fn() }))

import { useAuth } from './auth'
import { fetchSession } from '../services/sessionApi'
import { setSocketIdentity } from '../services/socket'
import { login as loginRequest } from '../services/authApi'
import type { AuthUser } from '../types'

const mockFetch = vi.mocked(fetchSession)
const mockLogin = vi.mocked(loginRequest)

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  vi.clearAllMocks()
  useAuth.setState({ status: 'loading', user: null, token: null, domain: null, showDeposit: false })
})

describe('init (APP_INITIALIZER)', () => {
  it('restores the user and wires the socket identity when logged in', async () => {
    mockFetch.mockResolvedValue({ user: { mstrid: 7, usetype: 3, allow_deposit_withdraw: true } })
    await useAuth.getState().init()
    const s = useAuth.getState()
    expect(s.status).toBe('ready')
    expect(s.user?.mstrid).toBe(7)
    expect(s.showDeposit).toBe(true)
    expect(s.isAuthenticated()).toBe(true)
    expect(setSocketIdentity).toHaveBeenCalledWith({ userId: 7, userType: 3 })
  })

  it('finishes ready and logged-out when no user is returned', async () => {
    mockFetch.mockResolvedValue({ user: null })
    await useAuth.getState().init()
    expect(useAuth.getState().status).toBe('ready')
    expect(useAuth.getState().isAuthenticated()).toBe(false)
  })

  it('treats a failed session fetch as logged-out', async () => {
    mockFetch.mockRejectedValue(new Error('network'))
    await useAuth.getState().init()
    expect(useAuth.getState().status).toBe('ready')
    expect(useAuth.getState().user).toBeNull()
  })

  it('honors systemMaintainance without setting a user', async () => {
    mockFetch.mockResolvedValue({ systemMaintainance: true, user: { mstrid: 1, usetype: 3 } })
    await useAuth.getState().init()
    expect(useAuth.getState().status).toBe('ready')
    expect(useAuth.getState().user).toBeNull()
  })
})

describe('session mutations', () => {
  it('setSession persists the token and adopts the user', () => {
    useAuth.getState().setSession('tok-1', { mstrid: 2, usetype: 3 } as AuthUser)
    expect(sessionStorage.getItem('token')).toBe('tok-1')
    expect(useAuth.getState().user?.mstrid).toBe(2)
  })

  it('signIn adopts the session returned by the login request', async () => {
    mockLogin.mockResolvedValue({ user: { mstrid: 9, usetype: 3, TokenId: 't' } })
    const res = await useAuth.getState().signIn({ username: 'u', password: 'p' })
    expect(res.user?.mstrid).toBe(9)
    expect(useAuth.getState().user?.mstrid).toBe(9)
  })

  it('logout clears storage and state', () => {
    sessionStorage.setItem('token', 'x')
    localStorage.setItem('y', '1')
    useAuth.setState({ user: { mstrid: 1, usetype: 3 } as AuthUser, token: 'x' })
    useAuth.getState().logout()
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('y')).toBeNull()
    expect(useAuth.getState().user).toBeNull()
  })
})
