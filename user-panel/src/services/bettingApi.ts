import { get, post } from '../api/http'

// ── Types (Adonis-shaped, as the Angular event page consumed them) ────────────
export type PriceSize = { price: number; size?: number | string }

export type Runner = {
  id: number | string
  name: string
  status?: string
  sortPriority?: number
  back0?: PriceSize
  lay0?: PriceSize
  back?: PriceSize[]
  lay?: PriceSize[]
  [key: string]: unknown
}

export type Market = {
  marketid: string
  market_name: string
  min_stack?: number
  max_stack?: number
  max_market_profit?: number
  odds_limit?: number
  runner_json?: string
  runners?: Runner[]
  status?: string
  volume?: number
  active?: number | boolean
  inPlay?: boolean
  // Match info is denormalised onto each market row (legacy markets shape), so the
  // event header can be derived from the markets response itself.
  matchid?: string | number
  matchName?: string
  MstDate?: string
  matchdate?: string
  sportname?: string
  sportid?: string | number
  [key: string]: unknown
}

export type Fancy = {
  ID: number | string
  HeadName: string
  SessInptYes?: number | string
  SessInptNo?: number | string
  YesValume?: number | string
  NoValume?: number | string
  status?: string
  active?: number | boolean
  is_indian_fancy?: number | boolean
  ind_fancy_selection_id: string
  market_id?: string | number | null
  TypeID?: number | string
  MatchID?: number | string
  SprtId?: number | string
  pointDiff?: number | string
  MinStake?: number | string
  MaxStake?: number | string
  min_stack?: number | string
  max_stack?: number | string
  [key: string]: unknown
}

export type MatchInfo = {
  matchName?: string
  MstCode?: number | string
  line_fancy_volume?: number
  tvUrl?: string
  score_board_json?: string
  maxStack?: number
  minStack?: number
  volumeLimit?: number
  [key: string]: unknown
}

export type FancyLimit = { fancy_id: number | string; min_stack: number; max_stack: number }
export type CompanyLimit = { min_stake: number; max_stake: number }

export type FanciesResponse = {
  data: Fancy[]
  priorities?: Array<{ name?: string; value?: string }>
  limits?: Array<{ type: string; min_stake: number; max_stake: number }>
  fancyLimits?: FancyLimit[]
}

// ── Event data ────────────────────────────────────────────────────────────────
// The markets endpoint response. The legacy endpoint denormalises the match info
// onto each row, so the event header is derived from data[0].
export type EventMarketsResponse = { status?: boolean; data: Market[] }

// GET matches/{id} (with optional marketId)
export const getMatch = (matchId: string, marketId?: string, signal?: AbortSignal) =>
  get<{ data: MatchInfo }>(`matches/${matchId}`, { params: marketId ? { marketId } : undefined, signal })

// GET matches/{eventId}/markets?marketId={marketId}&sportId={sportId}
// The query-param spelling (marketId / sportId) is preserved exactly. `signal`
// lets the caller cancel the request on unmount / route change.
export const getEventMarkets = (
  eventId: string,
  marketId: string,
  sportId: string,
  signal?: AbortSignal,
): Promise<EventMarketsResponse> =>
  get<EventMarketsResponse>(`matches/${eventId}/markets`, { params: { marketId, sportId }, signal })

// Back-compatible alias (older callers); delegates to getEventMarkets.
export const getMarkets = (matchId: string, marketId: string, sportId: string, signal?: AbortSignal) =>
  getEventMarkets(matchId, marketId, sportId, signal)

// GET matches/{id}/fancies?category=&filter=&refresh=
export const getFancies = (
  matchId: string,
  params: { category: string; filter: string; refresh?: boolean },
  signal?: AbortSignal,
) => get<FanciesResponse>(`matches/${matchId}/fancies`, { params, signal })

// GET matches/{id}/fancyLiability
export const getFancyLiability = (matchId: string) => get<{ data: unknown }>(`matches/${matchId}/fancyLiability`)

// ── Bet placement — payloads preserved EXACTLY from the Angular component ──────
export type MarketBetPayload = {
  matchId: number | string
  matchName?: string
  selectionId: string
  runnerName: string
  marketId: string
  stake: number
  price: number
  isBack: 0 | 1
  deviceInfo: string
  inPlay: boolean
  profit: number
  isCashout: boolean
  sportId: string
  domain?: unknown
}
export const placeMarketBet = (payload: MarketBetPayload) =>
  post<{ status?: boolean; message?: string }>('bets/market', payload)

export type FancyBetPayload = {
  price: number
  side: 0 | 1
  stake: number
  typeId?: number | string
  matchId?: number | string
  marketId?: string | number | null
  fancyId: number | string
  selectionId: string
  fHeadName: string
  sessInpYes?: number | string
  sessInpNo?: number | string
  sportId?: number | string
  pointDiff?: number | string
  deviceDesc: string
  sessSizeYes?: number | string
  sessSizeNo?: number | string
}
export const placeFancyBet = (payload: FancyBetPayload) =>
  post<{ status?: boolean; message?: string }>('bets/fancy', payload)
export const placeLineBet = (payload: FancyBetPayload) =>
  post<{ status?: boolean; message?: string }>('bets/line', payload)
