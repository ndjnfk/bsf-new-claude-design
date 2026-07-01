import { get } from '../api/http'
import type { AuthUser, DomainConfig } from '../types'

// Shape returned by the session endpoint (Adonis `me?origin=`), as the Angular
// init() consumed it.
export type SessionResponse = {
  user?: AuthUser | null
  domain?: DomainConfig
  banners?: unknown[]
  demoUser?: unknown
  socialMedia?: unknown[]
  systemMaintainance?: boolean
}

// Mirrors ApiService.init()'s data source: GET me?origin=<origin>. The backend uses
// origin for per-tenant branding; we send the current origin.
export function fetchSession(): Promise<SessionResponse> {
  const origin = typeof location !== 'undefined' ? location.origin : ''
  // skipAuthRedirect: a 401 here just means "not logged in" — don't trigger a logout.
  return get<SessionResponse>('me?origin=' + encodeURIComponent(origin), { skipAuthRedirect: true })
}
