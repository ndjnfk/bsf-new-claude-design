import { get, post } from '../api/http'

export type DreamGame = {
  game_code: string
  name: string
  category: string
  provider_name?: string
  sub_provider_name?: string
  url_thumb?: string
  product?: string
  [key: string]: unknown
}
export type GameThumb = { id: string; name: string; image: string }

// ── Poker ─────────────────────────────────────────────────────────────────────

// GET /poker/getUrl — the launch URLs live at the response root.
export interface PokerUrlResponse {
  mobileUrl: string
  desktopUrl: string
}

// GET /poker/getUserCasinoLimit — casino_limit + the user's net chips (first row).
export interface UserCasinoLimitRow {
  NetChips?: number | string
}
export interface UserCasinoLimitResponse {
  data: {
    casino_limit?: number | string
    data?: UserCasinoLimitRow[]
  }
}

export const getPokerUrl = () => get<PokerUrlResponse>('poker/getUrl')
export const getUserCasinoLimit = () => get<UserCasinoLimitResponse>('poker/getUserCasinoLimit')
export const getPokerGameUrl = (gameCode: string) =>
  get<{ mobileUrl: string; desktopUrl: string }>('poker/getGameUrl', { params: { gameCode } })
export const getPokerGameList = () => get<{ data: GameThumb[] }>('poker/getPokerGameList')

// ── Dream casino ──────────────────────────────────────────────────────────────
export const getDreamGameList = () => get<{ data: DreamGame[] }>('dream/gameList')
export const getDreamGameUrl = (body: Record<string, unknown>) => post<{ data: { url: string } }>('dream/gameUrl', body)

// ── Gamehub casino ────────────────────────────────────────────────────────────
export const getGamehubGameList = (params: { page: number; type: string; mobile: number }) =>
  get<{ data: { data: GameThumb[]; meta?: { total?: number; per_page?: number } }; categories?: Array<{ type: string }> }>(
    'gamehub/gameList',
    { params },
  )
export const getGamehubGameUrl = (body: Record<string, unknown>) => post<{ data: string }>('gamehub/gameUrl', body)

// Casino-limit gate (poker.component): 0 → disabled; NaN → enabled; else netChips > -limit.
export function casinoLimitEnabled(casinoLimit: unknown, netChips: unknown): boolean {
  const cl = Number(casinoLimit)
  const nc = Number(netChips)
  if (cl === 0) return false
  if (Number.isNaN(cl) || Number.isNaN(nc)) return true
  return nc > -cl
}
