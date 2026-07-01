import { describe, it, expect } from 'vitest'
import { casinoLimitEnabled } from './casinoApi'

describe('casinoLimitEnabled', () => {
  it('disabled when casino_limit is 0', () => {
    expect(casinoLimitEnabled(0, 100)).toBe(false)
  })
  it('enabled when limit or netChips is not a number', () => {
    expect(casinoLimitEnabled('x', 100)).toBe(true)
    expect(casinoLimitEnabled(100, 'x')).toBe(true)
  })
  it('enabled only when netChips > -casino_limit', () => {
    expect(casinoLimitEnabled(100, 50)).toBe(true) // 50 > -100
    expect(casinoLimitEnabled(100, -150)).toBe(false) // -150 > -100 is false
  })
})
