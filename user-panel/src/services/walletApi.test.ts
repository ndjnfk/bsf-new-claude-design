import { describe, it, expect } from 'vitest'
import { amountCal } from './walletApi'

describe('amountCal (fast-withdraw fee)', () => {
  it('deducts fast_withdraw% on a fast request', () => {
    // 1000 - (10% of 1000) = 900
    expect(amountCal(1, 1000, 10)).toBe(900)
  })
  it('returns the amount unchanged for a normal request', () => {
    expect(amountCal(0, 1000, 10)).toBe(1000)
  })
})
