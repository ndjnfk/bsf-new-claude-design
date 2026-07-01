import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, clearToken } from './token'

describe('token storage', () => {
  beforeEach(() => sessionStorage.clear())

  it('round-trips the JWT in sessionStorage under the "token" key', () => {
    expect(getToken()).toBeNull()
    setToken('abc123')
    expect(sessionStorage.getItem('token')).toBe('abc123') // exact Angular key
    expect(getToken()).toBe('abc123')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
