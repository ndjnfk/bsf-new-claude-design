import { get, post } from '../api/http'

export type Row = Record<string, unknown>
export type Meta = { total?: number; per_page?: number; current_page?: number }

// ── Account statement / ledger ────────────────────────────────────────────────
export const fetchAccountStatement = (params: { page: number; type: string; from_date: string; to_date: string }) =>
  get<{ data: Row[]; meta?: Meta; openingBalance?: number }>('accountStatement', { params })

export const fetchLedger = (params: { page: number }) =>
  get<{ data: Row[]; meta?: Meta; openingBalance?: number }>('ledger', { params })

export type LedgerMatchResponse = {
  matchToss?: Row[]
  matchodds?: Row[]
  bookmakerodds?: Row[]
  goalBets?: Row[]
  tiedMatch?: Row[]
  fancy?: Row[]
  matchTossFinalValue?: number
  matchOddsFinalValue?: number
  bookmakerOddsFinalValue?: number
  goalFinalValue?: number
  tiedMatchFinalValue?: number
  fancyFinalValue?: number
  commission?: number
}
export const fetchLedgerByMatch = (matchId: string) => get<LedgerMatchResponse>(`ledger/${matchId}`)

// ── Bet history ───────────────────────────────────────────────────────────────
export const fetchBetHistory = (body: {
  page_no: number
  sport_id: string
  from_date: string
  to_date: string
  bet_type: string
  type: number
}) => post<{ data: { data: Row[]; meta?: Meta } }>('betHistory', body)

export const fetchBetHistoryFilter = (body: { match_id: string; market_id: string; fancy_id: string }) =>
  post<{ data: { data: Row[] } }>('betHistoryFilter', body)

// ── Profit / loss ─────────────────────────────────────────────────────────────
export const fetchProfitLoss = (body: { page: number; sportId: number; fromDate: string; toDate: string }) =>
  post<{ data: Row[]; meta?: Meta }>('profitLoss', body)

export const fetchProfitLossByMatch = (body: {
  matchId: number
  sportId: number
  fromDate: string
  toDate: string
  userId: string | number
}) => post<{ data: Row[] }>('profitLossByMatch', body)

// ── History / logs ────────────────────────────────────────────────────────────
export const fetchLoginHistory = (page: number) => get<{ data: Row[]; meta?: Meta }>('loginHistory', { params: { page } })
export const fetchPasswordHistory = (page: number) =>
  get<{ data: { data: Row[]; meta?: Meta } }>('passwordHistory', { params: { page } })
export const fetchLogs = (page: number) => get<{ data: Row[]; total?: number; pageSize?: number }>('logs', { params: { page } })
export const clearLiability = (userId: string) => post('clearLiability', { userId })

// ── Forms ─────────────────────────────────────────────────────────────────────
export const changePasswordReq = (body: { old_password: string; newpassword: string; Renewpassword: string }) =>
  post<{ message?: string }>('changePassword', body)
export const saveStakes = (stakes: string[]) => post<{ status?: boolean }>('stakes', { stakes })

export const fetchSportsList = () => get<{ data: Array<{ id: number; name: string }> }>('sports')
