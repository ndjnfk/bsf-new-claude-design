import { describe, it, expect } from 'vitest'
import {
  bookmakerOdds,
  calcProfit,
  getFancyStatus,
  getLimits,
  getProfitLoss,
  isBookmaker,
  viewBookLiability,
  type PositionBet,
} from './eventCalc'
import type { Fancy } from '../services/bettingApi'

describe('calcProfit', () => {
  it('market: round(odds*stake - stake)', () => {
    expect(calcProfit({ isFancy: false, isIndianFancy: false, isBack: 0, stake: 100, odds: 2, volume: 0 })).toBe(100)
    expect(calcProfit({ isFancy: false, isIndianFancy: false, isBack: 1, stake: 100, odds: 1.5, volume: 0 })).toBe(50)
  })
  it('indian fancy YES: (volume*stake)/100', () => {
    expect(calcProfit({ isFancy: true, isIndianFancy: true, isBack: 0, stake: 100, odds: 0, volume: 80 })).toBe(80)
  })
  it('indian fancy NO: full stake', () => {
    expect(calcProfit({ isFancy: true, isIndianFancy: true, isBack: 1, stake: 100, odds: 0, volume: 80 })).toBe(100)
  })
  it('line fancy: full stake', () => {
    expect(calcProfit({ isFancy: true, isIndianFancy: false, isBack: 0, stake: 100, odds: 0, volume: 0 })).toBe(100)
  })
})

describe('bookmaker helpers', () => {
  it('bookmakerOdds = odds/100 + 1', () => {
    expect(bookmakerOdds(100)).toBe(2)
    expect(bookmakerOdds(50)).toBe(1.5)
  })
  it('isBookmaker when marketid contains B', () => {
    expect(isBookmaker('1.234B')).toBe(true)
    expect(isBookmaker('1.234')).toBe(false)
  })
})

describe('getFancyStatus', () => {
  it('OPEN with 0/0 prices is SUSPENDED', () => {
    expect(getFancyStatus({ status: 'OPEN', SessInptYes: 0, SessInptNo: 0 } as unknown as Fancy)).toBe('SUSPENDED')
  })
  it('OPEN with prices stays OPEN', () => {
    expect(getFancyStatus({ status: 'OPEN', SessInptYes: 100, SessInptNo: 102 } as unknown as Fancy)).toBe('OPEN')
  })
})

describe('getLimits hierarchy (fancy-specific > company > global)', () => {
  const fancy = { ID: 7, MinStake: 1, MaxStake: 10 } as unknown as Fancy
  it('uses the global fancy min/max when nothing else set', () => {
    expect(getLimits(fancy, null, [])).toEqual({ min: 1, max: 10 })
  })
  it('prefers the company limit over global', () => {
    expect(getLimits(fancy, { min_stake: 5, max_stake: 50 }, [])).toEqual({ min: 5, max: 50 })
  })
  it('prefers the fancy-specific limit over everything', () => {
    expect(getLimits(fancy, { min_stake: 5, max_stake: 50 }, [{ fancy_id: 7, min_stack: 20, max_stack: 200 }])).toEqual({
      min: 20,
      max: 200,
    })
  })
})

describe('getProfitLoss', () => {
  const bets: PositionBet[] = [{ SelectionId: '1', Stack: 100, P_L: 90, Odds: 1.9, isBack: 0, volume: 0 }]
  it('back: +P_L on the selection, -Stack on others', () => {
    expect(getProfitLoss(bets, '1')).toBe('90.00')
    expect(getProfitLoss(bets, '2')).toBe('-100.00')
  })
})

describe('viewBookLiability', () => {
  it('returns the worst-case negative position, else 0', () => {
    const bets: PositionBet[] = [{ SelectionId: '5', Stack: 100, P_L: 0, Odds: 50, isBack: 0, volume: 100 }]
    expect(viewBookLiability(bets, '5')).toBe(-100)
    expect(viewBookLiability(bets, '9')).toBe(0) // no bets on this selection
  })
})
