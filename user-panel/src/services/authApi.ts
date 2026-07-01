import axios from 'axios'
import { get, post } from '../api/http'
import { setToken } from '../api/token'
import { GEO_URL } from '../api/env'
import { disconnectSocket } from './socket'
import type { AuthUser } from '../types'

// Login response (Adonis-shaped, as the Angular panel consumed it).
export type LoginResponse = {
  user?: AuthUser
  change_password?: boolean
  [key: string]: unknown
}

// Mirrors ApiService.login: best-effort geo enrichment (never blocks login), POST
// 'login', and persist user.TokenId to sessionStorage. Returns the raw response so
// the caller (login page) can route on `change_password` etc.
export async function login(credentials: Record<string, unknown>): Promise<LoginResponse> {
  let payload: Record<string, unknown> = { ...credentials }
  try {
    const { data } = await axios.get(GEO_URL)
    payload = { ...credentials, city: data?.city, region: data?.region, org: data?.org }
  } catch {
    /* geolocation is best-effort — proceed without it */
  }
  const res = await post<LoginResponse>('login', payload)
  if (res.user?.TokenId) setToken(res.user.TokenId)
  return res
}

// Mirrors ApiService.logout: best-effort backend logout, then fully clear the client
// session (socket + storage), exactly preserving the original teardown.
export async function logout(): Promise<void> {
  try {
    await get('logout')
  } catch {
    /* logout endpoint failures shouldn't block client teardown */
  }
  disconnectSocket()
  sessionStorage.clear()
  localStorage.clear()
}
