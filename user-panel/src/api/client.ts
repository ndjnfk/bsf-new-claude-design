import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { toast } from 'react-toastify'
import { API_BASE } from './env'
import { clearToken, getToken } from './token'
import { disconnectSocket } from '../services/socket'

// Per-request opt-out of the 401 auto-logout. Used for the session/sports "probe"
// calls so a 401 there (e.g. an endpoint not built yet, or simply not logged in)
// degrades to a normal rejection instead of forcing a redirect.
declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}

// Single typed axios instance. baseURL comes from env (default '/api/'), so calls
// pass bare paths like 'login', 'me?origin=…', 'sports' — exactly as Angular did
// (it concatenated environment.base + url).
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach the bearer token, read live from sessionStorage every request
// (matches the Angular interceptor reading ApiService.token, which mirrors storage).
export function authRequestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getToken()
  if (token) {
    if (!config.headers) config.headers = new AxiosHeaders()
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
}

// Bet-placement responses drive their own "Bet Placed" UI, so the Angular
// interceptor suppressed the auto toast for /bets/market and /bets/fancy. Same here.
export function shouldSkipToast(url: string | undefined): boolean {
  if (!url) return false
  const path = url.split('?')[0].replace(/\/+$/, '')
  return path.endsWith('bets/market') || path.endsWith('bets/fancy')
}

// ── Response (success): mirror Angular's { status, message } toast behaviour.
//   status === true  → success toast (unless it's a "Bet Placed" message)
//   status falsy     → error toast of the message, if any
// Responses without a { status, message } envelope (e.g. {data:…} lists) toast nothing.
export function successResponseInterceptor(response: AxiosResponse): AxiosResponse {
  if (shouldSkipToast(response.config.url)) return response
  const body = response.data as unknown
  if (body && typeof body === 'object') {
    const b = body as { status?: unknown; message?: unknown }
    if (b.status === true) {
      const m = b.message
      if (typeof m === 'string' && m !== 'Bet Placed' && m !== 'Bet placed Successfully.') {
        toast.success(m)
      }
    } else if (typeof b.message === 'string' && b.message.length > 0) {
      toast.error(b.message)
    }
  }
  return response
}

type ApiErrorBody = { message?: string; errors?: Array<{ field?: string; message?: string }> }

// ── Response (error): mirror Angular's status-based handling.
export function errorResponseInterceptor(error: AxiosError): Promise<never> {
  const status = error.response?.status
  const data = error.response?.data as ApiErrorBody | undefined
  if (status === 422 && data?.errors) {
    for (const e of data.errors) toast.error(`${e.field} - ${e.message}`)
  } else if (status === 400 && data?.message) {
    toast.error(data.message)
  } else if (status === 401 && !error.config?.skipAuthRedirect) {
    handleUnauthorized()
  } else if (status === 429 && data?.errors?.length) {
    toast.error(data.errors[0].message ?? 'Too many requests')
  }
  return Promise.reject(error)
}

// ── Unauthorized (401): clear the session WITHOUT a hard reload. The app registers
// a router-aware handler (setUnauthorizedHandler) that clears the auth store so
// ProtectedRoute redirects to the login page in-app — a hard window.location reload
// here would re-run the session probe and loop. The default just drops the token.
let unauthorizedHandler: () => void = defaultUnauthorized

export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn
}

function handleUnauthorized(): void {
  unauthorizedHandler()
}

function defaultUnauthorized(): void {
  try {
    disconnectSocket()
  } catch {
    /* socket may not be connected */
  }
  clearToken()
}

api.interceptors.request.use(authRequestInterceptor)
api.interceptors.response.use(successResponseInterceptor, errorResponseInterceptor)
