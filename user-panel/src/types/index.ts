// Shared domain types for the User Panel (the bettor / Player).

// The authenticated user as the backend returns it (Adonis-shaped, as the Angular
// panel consumed it). Loosely typed with an index signature since several optional
// flags are read across the app.
export type AuthUser = {
  mstrid: number
  usetype: number
  TokenId?: string
  allow_deposit_withdraw?: boolean
  bet_lock?: number | boolean
  change_password?: boolean
  stakes?: number[]
  name?: string
  mstruserid?: string
  mstrname?: string
  balance?: number
  liability?: number
  [key: string]: unknown
}

// A sport entry shaped for the sidebar menu (icon + target route), mirroring the
// Angular sidebar getSport() mapping.
export type SportMenuItem = {
  id: number
  name: string
  image: string
  url: string
  qr?: { sport_id: number }
}

// An open bet row shown in the header/sidebar "Open Bets" modal.
export type OpenBet = {
  matchName?: string
  marketName?: string
  Odds?: number
  Stack?: number
  MstDate?: string
  P_L?: number
  isBack?: string | number
  MatchId?: number | string
  MarketId?: string
  sportsId?: number | string
  [key: string]: unknown
}

// A promotional banner (carousel slide) returned with the session.
export type Banner = { id?: number | string; name?: string; image?: string; [key: string]: unknown }

// Per-tenant branding returned alongside the session (logo → favicon, name → title).
export type DomainConfig = {
  name?: string
  logo?: string
  mobile?: string
  headline?: string
  [key: string]: unknown
}

export type User = {
  id: number
  username: string
  name: string
  usetype: number
  balance: number
  exposure: number
  creditLimit: number
  /** Quick-stake buttons configured by the user. */
  stakes: number[]
  allowDepositWithdraw: boolean
  betLock: boolean
  userLock: boolean
}

export type LoginResult = { token: string; user: User }

export type Sport = { id: number; name: string; active: boolean }

/** A market runner with its current best back/lay price (Betfair-shaped). */
export type Runner = {
  selectionId: string
  name: string
  back: number | null
  lay: number | null
  status: string
}
