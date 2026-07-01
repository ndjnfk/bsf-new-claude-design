// Betting business calculations, ported VERBATIM from the Angular event component.
// DO NOT change these formulas — parity with the backend settlement depends on them.
import type { CompanyLimit, Fancy, FancyLimit, Market, Runner } from '../services/bettingApi'

// A placed bet as the position calculators consume it.
export type PositionBet = {
  SelectionId: number | string
  Stack: number | string
  P_L: number | string
  Odds: number | string
  isBack: number | string
  volume: number | string
}

// Bookmaker odds are sent as integers; convert to decimal: (odds/100)+1.
export const bookmakerOdds = (odds: number): number => odds / 100 + 1

// A market is a bookmaker market when its id contains 'B'.
export const isBookmaker = (marketid: string): boolean => marketid.includes('B')

// calProfit — back/lay market vs indian/line fancy. (event.component.ts calProfit)
//   market:        Math.round(odds*stake - stake)
//   indian YES(0): (volume*stake)/100
//   indian NO(1):  stake
//   line fancy:    stake
export function calcProfit(p: {
  isFancy: boolean
  isIndianFancy: boolean
  isBack: 0 | 1
  stake: number
  odds: number
  volume: number
}): number {
  if (p.isFancy) {
    if (p.isIndianFancy) return p.isBack === 0 ? (p.volume * p.stake) / 100 : p.stake
    return p.stake
  }
  return Math.round(p.odds * p.stake - p.stake)
}

const CLOSED_STATUSES = ['CLOSED', 'CLOSE', 'SUSPENDED', 'SUSPEND', 'BALL RUNNING']
const SUSPEND_STATUSES = ['CLOSED', 'CLOSE', 'SUSPENDED', 'SUSPEND']

// getStatus — returns the blocking status string, or false when bettable.
export function getStatus(market: Market, runner: Runner): string | false {
  if (CLOSED_STATUSES.includes(String(market.status))) return String(market.status)
  if (runner.status !== 'ACTIVE' && isBookmaker(String(market.marketid))) return runner.status ?? 'SUSPENDED'
  return false
}

// marketSuspended — whether the runner's odds cannot be backed/laid.
export function marketSuspended(market: Market, runner: Runner): boolean {
  if (SUSPEND_STATUSES.includes(String(market.status))) return true
  if (runner.status !== 'ACTIVE' && isBookmaker(String(market.marketid))) return runner.status === undefined
  // Match Odds stays bettable (green runner + blue LAGAI / orange KHAI cells)
  // even with empty 0/0 prices, like the screenshot — it only suspends on an
  // explicit market status. Other markets (Bookmaker, Toss) still suspend on 0/0.
  if (market.market_name === 'Match Odds') return false
  return (runner?.back0?.price ?? 0) === 0 && (runner?.lay0?.price ?? 0) === 0
}

// getFancyStatus — an OPEN fancy with 0/0 prices is SUSPENDED.
export function getFancyStatus(fancy: Fancy): string {
  if (fancy.status === 'OPEN' && Number(fancy.SessInptNo) === 0 && Number(fancy.SessInptYes) === 0) {
    return 'SUSPENDED'
  }
  return String(fancy.status ?? '')
}

// getLimits — fancy-specific > company > global, exactly as the Angular hierarchy.
export function getLimits(
  fancy: Fancy | null | undefined,
  companyLimit: CompanyLimit | null | undefined,
  fancyLimits: FancyLimit[] | undefined,
): { min: number | string; max: number | string } {
  const fancyData = fancyLimits?.find((f) => String(f.fancy_id) === String(fancy?.ID))
  if (fancyData) return { min: fancyData.min_stack, max: fancyData.max_stack }
  if (companyLimit) return { min: companyLimit.min_stake, max: companyLimit.max_stake }
  return { min: fancy?.MinStake ?? 0, max: fancy?.MaxStake ?? 0 }
}

// getProfitLoss — position per selection across all bets (event.component.ts).
//   back: +P_L on the selection, -Stack on the others
//   lay : -P_L on the selection, +Stack on the others
export function getProfitLoss(bets: PositionBet[], selectionId: number | string): string {
  let profitLoss = 0
  for (const b of bets) {
    const stack = b.Stack === '' ? 0 : Number(b.Stack)
    const pl = b.P_L === '' ? 0 : Number(b.P_L)
    if (String(b.isBack) === '0') {
      profitLoss += String(b.SelectionId) === String(selectionId) ? pl : -stack
    } else {
      profitLoss += String(b.SelectionId) === String(selectionId) ? -pl : stack
    }
  }
  return Number(profitLoss).toFixed(2)
}

// viewBook (liability-only branch) — worst-case loss across the odds ladder for a
// session-fancy selection. Ported verbatim from event.component.ts viewBook().
export function viewBookLiability(bets: PositionBet[], runnerId: number | string, minValue = 5): number {
  const data = bets
    .filter((el) => String(el.SelectionId) === String(runnerId))
    .sort((a, b) => (Number(a.Odds) > Number(b.Odds) ? 1 : -1))
  if (data.length === 0) return 0

  const oddsList = data.map((a) => Number(a.Odds))
  const min = Math.min(...oddsList) - minValue
  const max = Math.max(...oddsList) + minValue
  const r: Array<{ odds: number; value: number }> = []
  for (let i = min < minValue ? 0 : min; i < max; i++) r.push({ odds: i, value: 0 })

  for (const fancy of data) {
    const stake = Number(fancy.Stack)
    if (Number(fancy.isBack) === 0) {
      for (const rs of r) rs.value += rs.odds >= Number(fancy.Odds) ? (stake * Number(fancy.volume)) / 100 : -stake
    } else {
      for (const rs of r) rs.value += rs.odds < Number(fancy.Odds) ? stake : -(stake * Number(fancy.volume)) / 100
    }
  }
  const liability = Math.min(...r.map((a) => a.value))
  return liability < 0 ? liability : 0
}
