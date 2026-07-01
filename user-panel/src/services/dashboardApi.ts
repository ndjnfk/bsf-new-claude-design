import { get } from '../api/http'

// A match row from the dashboard feed (Adonis-shaped, as the Angular pages used it).
export type MatchRow = {
  matchid: number | string
  marketid?: string
  sportid?: number | string
  matchName?: string
  series_name?: string
  MstDate?: string
  inPlay?: boolean
  has_bookmaker?: number
  isfancy?: number | boolean
  match_bets_count?: number
  session_bets_count?: number
  runner_json?: string
  runners?: unknown[]
  country_code?: string
  start_times?: string
  times?: Array<{ marketId: string; time: string }>
  [key: string]: unknown
}

export type ResultRow = {
  MatchName: string
  MarketName: string
  SelectionName: string
  result: string
  date: string
  [key: string]: unknown
}

// Dashboard — GET dashboard?sport_id=<id> (empty when id is not a positive number),
// exactly preserving the Angular query param.
export const fetchDashboard = (sportId: string | number) =>
  get<{ data: MatchRow[] }>(`dashboard?sport_id=${Number(sportId) > 0 ? sportId : ''}`)

// Horse / greyhound — GET dashboard/horse?sport_id=<id>.
export const fetchHorse = (sportId: string | number) =>
  get<{ data: MatchRow[] }>(`dashboard/horse?sport_id=${sportId}`)

// Results — GET results?sport_id=&date=&page= (paginated).
export const fetchResults = (params: { sport_id: number | string; date: string; page: number }) =>
  get<{ data: ResultRow[]; meta: { total: number; per_page: number; current_page?: number } }>('results', { params })

// Sports list for the results filter — GET sports.
export const fetchResultsSports = () => get<{ data: Array<{ id: number; name: string }> }>('sports')

// Casino limit (games list gate) — GET poker/getUserCasinoLimit.
export const fetchCasinoLimit = () =>
  get<{ data: { casino_limit?: number | string; data?: Array<{ NetChips?: number | string }> } }>(
    'poker/getUserCasinoLimit',
  )

// Safely parse the runner_json string into an array.
export function parseRunners(json?: string): unknown[] {
  if (!json) return []
  try {
    const r: unknown = JSON.parse(json)
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}
