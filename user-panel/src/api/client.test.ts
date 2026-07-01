import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the toast surface so interceptor side-effects are observable, not rendered.
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { AxiosHeaders, type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'
import {
  authRequestInterceptor,
  shouldSkipToast,
  successResponseInterceptor,
  errorResponseInterceptor,
  setUnauthorizedHandler,
} from './client'

const resp = (data: unknown, url = 'sports'): AxiosResponse =>
  ({ data, status: 200, statusText: 'OK', headers: {}, config: { url, headers: new AxiosHeaders() } }) as unknown as AxiosResponse

const httpError = (status: number, data: unknown): AxiosError =>
  ({ isAxiosError: true, message: 'err', response: { status, data, statusText: '', headers: {}, config: {} } }) as unknown as AxiosError

beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('authRequestInterceptor', () => {
  it('adds a Bearer Authorization header when a token exists', () => {
    sessionStorage.setItem('token', 'tkn')
    const out = authRequestInterceptor({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig)
    expect(out.headers.get('Authorization')).toBe('Bearer tkn')
  })

  it('leaves Authorization unset when there is no token', () => {
    const out = authRequestInterceptor({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig)
    expect(out.headers.get('Authorization')).toBeFalsy()
  })
})

describe('shouldSkipToast', () => {
  it('skips bet-placement endpoints (with or without query/leading path)', () => {
    expect(shouldSkipToast('bets/market')).toBe(true)
    expect(shouldSkipToast('bets/fancy')).toBe(true)
    expect(shouldSkipToast('/api/bets/market?x=1')).toBe(true)
    expect(shouldSkipToast('sports')).toBe(false)
    expect(shouldSkipToast(undefined)).toBe(false)
  })
})

describe('successResponseInterceptor', () => {
  it('shows a success toast for { status:true, message }', () => {
    successResponseInterceptor(resp({ status: true, message: 'Saved' }))
    expect(toast.success).toHaveBeenCalledWith('Saved')
  })

  it('shows an error toast for { status:false, message }', () => {
    successResponseInterceptor(resp({ status: false, message: 'Nope' }))
    expect(toast.error).toHaveBeenCalledWith('Nope')
  })

  it('does not toast "Bet Placed" or bet endpoints', () => {
    successResponseInterceptor(resp({ status: true, message: 'Bet Placed' }, 'bets/market'))
    successResponseInterceptor(resp({ status: true, message: 'Bet Placed' }))
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('stays silent for plain list/data responses', () => {
    successResponseInterceptor(resp({ data: [1, 2, 3] }))
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('errorResponseInterceptor', () => {
  it('toasts each 422 field error and rejects', async () => {
    await expect(
      errorResponseInterceptor(httpError(422, { errors: [{ field: 'amount', message: 'required' }] })),
    ).rejects.toBeTruthy()
    expect(toast.error).toHaveBeenCalledWith('amount - required')
  })

  it('toasts the 400 message and rejects', async () => {
    await expect(errorResponseInterceptor(httpError(400, { message: 'Bad request' }))).rejects.toBeTruthy()
    expect(toast.error).toHaveBeenCalledWith('Bad request')
  })

  it('toasts the first 429 error', async () => {
    await expect(errorResponseInterceptor(httpError(429, { errors: [{ message: 'Slow down' }] }))).rejects.toBeTruthy()
    expect(toast.error).toHaveBeenCalledWith('Slow down')
  })

  it('invokes the unauthorized handler on 401', async () => {
    const onUnauth = vi.fn()
    setUnauthorizedHandler(onUnauth)
    await expect(errorResponseInterceptor(httpError(401, {}))).rejects.toBeTruthy()
    expect(onUnauth).toHaveBeenCalledTimes(1)
  })
})
