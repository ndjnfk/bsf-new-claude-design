import type { AxiosRequestConfig } from 'axios'
import { api } from './client'

// Typed verb helpers. Each resolves to the response BODY (response.data) — the
// same thing Angular's HttpClient handed back — so callers get e.g. { user, domain }
// for `me` or { data: [...] } for list endpoints. Pass `config.params` for query
// strings, `config.headers` for per-call headers (e.g. multipart for uploads).
export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  api.get<T>(url, config).then((r) => r.data)

export const post = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  api.post<T>(url, data, config).then((r) => r.data)

export const put = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  api.put<T>(url, data, config).then((r) => r.data)

export const del = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  api.delete<T>(url, config).then((r) => r.data)
