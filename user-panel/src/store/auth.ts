import { create } from 'zustand'
import type { AuthUser, Banner, DomainConfig } from '../types'
import { getToken, setToken, clearToken } from '../api/token'
import { fetchSession, type SessionResponse } from '../services/sessionApi'
import { login as loginRequest, type LoginResponse } from '../services/authApi'
import { setSocketIdentity, disconnectSocket } from '../services/socket'
import { liveSocket } from '../services/liveSocket'
import { applyDomain } from '../utils/domain'

type Status = 'loading' | 'ready'

type AuthState = {
  /** 'loading' until the initial session probe finishes (APP_INITIALIZER). */
  status: Status
  user: AuthUser | null
  token: string | null
  domain: DomainConfig | null
  banners: Banner[]
  /** Whether the user may see deposit/withdraw (user.allow_deposit_withdraw). */
  showDeposit: boolean
  isAuthenticated: () => boolean
  /** App initialization: restore the session, apply branding, wire the socket. */
  init: () => Promise<void>
  /** Perform a login (geo-enriched) and adopt the returned session. */
  signIn: (credentials: Record<string, unknown>) => Promise<LoginResponse>
  setSession: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser | null) => void
  /** Re-read the current session and update live balance/exposure in place. */
  refreshUser: () => Promise<void>
  logout: () => void
}

// setUser() equivalent — record the socket identity for the handshake. The actual
// connect is deferred to the realtime phase (native-WS bridge).
function attachSocket(user: AuthUser): void {
  setSocketIdentity({ userId: user.mstrid, userType: user.usetype })
}

// Auth store. The JWT is mirrored to sessionStorage (via api/token) so the axios
// interceptor and refreshes read the same value — preserving the Angular
// ApiService's sessionStorage('token') behaviour exactly.
export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  token: getToken(),
  domain: null,
  banners: [],
  showDeposit: false,

  isAuthenticated: () => !!get().user,

  // Equivalent of Angular's APP_INITIALIZER → ApiService.init(): fetch the current
  // session, apply domain branding, and restore the user if logged in. Any failure
  // (network/maintenance/401) is treated as logged-out. Always ends 'ready'.
  init: async () => {
    try {
      const { user, domain, banners, systemMaintainance }: SessionResponse = await fetchSession()
      if (systemMaintainance) return
      applyDomain(domain)
      set({ banners: (banners as Banner[]) ?? [] })
      if (user) {
        set({ user, domain: domain ?? null, showDeposit: !!user.allow_deposit_withdraw })
        attachSocket(user)
      } else {
        set({ user: null, domain: domain ?? null })
      }
    } catch {
      set({ user: null })
    } finally {
      set({ status: 'ready' })
    }
  },

  signIn: async (credentials) => {
    const res = await loginRequest(credentials)
    if (res.user) {
      set({ user: res.user, token: getToken(), showDeposit: !!res.user.allow_deposit_withdraw })
      attachSocket(res.user)
    }
    return res
  },

  setSession: (token, user) => {
    setToken(token)
    set({ token, user, showDeposit: !!user.allow_deposit_withdraw })
    attachSocket(user)
  },

  setUser: (user) => set({ user, showDeposit: !!user?.allow_deposit_withdraw }),

  // Pull fresh balance/exposure (and any other session fields) from /me and swap
  // the user object in place. Called on live socket signals; a transient failure
  // keeps the current values rather than logging the user out.
  refreshUser: async () => {
    try {
      const { user } = await fetchSession()
      if (user) set({ user })
    } catch {
      /* transient — keep current values */
    }
  },

  // Equivalent of ApiService.logout(): tear down socket + storage and clear state.
  logout: () => {
    disconnectSocket()
    liveSocket.close()
    clearToken()
    sessionStorage.clear()
    localStorage.clear()
    set({ user: null, token: null, showDeposit: false })
  },
}))
