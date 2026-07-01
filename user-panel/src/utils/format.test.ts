import { describe, it, expect } from 'vitest'
import { formatAmount, apiDate } from './format'

describe('format utils', () => {
  it('formats amounts to two decimals', () => {
    expect(formatAmount(1234.5)).toBe('1234.50')
    expect(formatAmount(null)).toBe('0.00')
    expect(formatAmount(undefined)).toBe('0.00')
  })

  it('formats an API date as YYYY-MM-DD', () => {
    expect(apiDate('2026-06-29T10:30:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
