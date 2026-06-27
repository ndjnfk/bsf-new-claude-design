import axios from 'axios'

// Single axios instance. Relative baseURL so Vite's proxy (dev) / ingress (prod)
// routes /api to the Go monolith. Responses are wrapped as { data: ... }.
export const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap the { data } envelope.
async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p
  return res.data.data
}

// ---- Types ----
export type User = {
  id: number
  mstruserid: string
  mstrname: string
  usetype: number
  balance: number
  creditLimit: number
  partnerCricket: number
  partnerCasino: number
  commission: number
  sessionComm: number
  rollingCommission: number
  fancyRollingCommission: number
  settlementAmount: number
  p_l: number          // PL — cumulative settled P&L
  pl: number           // New PL — live chip-ledger standing
  exposure: number     // open bet liability
  casinoLimit: number
  createNoOfChild: number
  remarks: string | null
  phone: string | null
  userLock: boolean
  betLock: boolean
  status: boolean
  createdAt: string
}

export type LoginResult = { token: string; user: User; isHelper?: boolean; permissions?: string[] }

export type DashboardData = {
  username: string
  name: string
  level: string
  balance: number
  profitLoss: number
  myMatchShare: number
  companyMatchShare: number
  myCasinoShare: number
  companyCasinoShare: number
  matchCommission: number
  sessionCommission: number
}

// Matches the backend CreateUserInput JSON contract (doc "Create Company").
export type CreateCompanyInput = {
  username: string
  masterName: string
  password: string
  typeId?: number              // which tier to create (0/undefined = immediate next)
  deposit: number              // "Fix Limit" — coins loaned from the parent
  allowDepositWithdraw: boolean
  isPartnership: boolean
  sportsValue: number          // Company Match Share
  casinoValue: number          // Company Casino Share
  commission: number           // Odds Commission
  sessionCommission: number
  rollingCommission: number    // Company Match Commission
  fancyRollingCommission: number // Company Session Commission
  reference?: string
  createNoOfChild?: number
  domainId?: number
  allowBetDelete?: boolean
  allowResultDeclare?: boolean
  allowResultRevoke?: boolean
  casinoLimit?: number
  remarks?: string
  phone?: string
}

// ---- Calls ----
export const login = (username: string, password: string) =>
  unwrap<LoginResult>(api.post('/api/auth/login', { username, password }))

export const getMe = () => unwrap<User>(api.get('/api/auth/me'))
export const getUser = (id: number) => unwrap<User>(api.get(`/api/users/${id}`))

export const getDashboard = () => unwrap<DashboardData>(api.get('/api/dashboard'))

export const listCompanies = (params?: { status?: string; search?: string }) =>
  unwrap<User[] | null>(api.get('/api/users/company', { params }))

export const createCompany = (input: CreateCompanyInput) =>
  unwrap<User>(api.post('/api/users/company', input))

// SDA-only: create another (independent) Super Duper Admin with a full profile.
export type CreateSuperAdminInput = {
  username: string; masterName: string; password: string
  balance: number; creditLimit: number
  sportsValue: number; casinoValue: number          // My Match / Casino share (default 100)
  commission: number; sessionCommission: number
  rollingCommission: number; fancyRollingCommission: number
  casinoLimit: number; createNoOfChild: number; phone?: string; reference?: string; remarks?: string
  allowDepositWithdraw: boolean; allowBetDelete: boolean
  allowResultDeclare: boolean; allowResultRevoke: boolean
}
export const createSuperAdmin = (input: CreateSuperAdminInput) =>
  unwrap<User>(api.post('/api/users/super-admin', input))

// Live username availability check (doc "Create Company").
export const usernameAvailable = (username: string) =>
  unwrap<{ available: boolean }>(api.get('/api/users/username-available', { params: { username } }))

// Generic downline (works for every tier — the child role is derived server-side).
export const listChildren = (params?: { status?: string; search?: string }) =>
  unwrap<User[] | null>(api.get('/api/users/children', { params }))
export const createChild = (input: CreateCompanyInput) =>
  unwrap<User>(api.post('/api/users/children', input))
// A specific user's downline (Direct Agents / Direct Client from the Client Dashboard).
export const listChildrenOf = (userId: number, search?: string) =>
  unwrap<User[] | null>(api.get(`/api/users/${userId}/children`, { params: search ? { search } : {} }))

export const changePassword = (oldPassword: string, newPassword: string) =>
  unwrap<{ changed: boolean }>(api.post('/api/auth/change-password', { oldPassword, newPassword }))

export const setLocks = (id: number, body: { userLock?: boolean; betLock?: boolean }) =>
  unwrap<User>(api.post(`/api/users/${id}/lock`, body))

export const walletTransaction = (body: { userId: number; amount: number; type: 'deposit' | 'withdraw'; remark?: string }) =>
  unwrap<{ userId: number; balance: number }>(api.post('/api/wallet/transactions', body))

// ---- Sports / matches ----
export type Sport = { id: number; name: string; active: boolean; isBetfair: boolean }
export type Match = {
  id: number; sportId: number; name: string; startTime: string; status: string
  blocked: boolean; active: boolean; seriesId: number | null
}
export type Series = { id: number; sportId: number; name: string; isManual: boolean; active: boolean }

export const listSports = () => unwrap<Sport[] | null>(api.get('/api/sports'))
export const toggleSport = (id: number, active: boolean) =>
  unwrap<unknown>(api.put(`/api/sports/${id}`, { active }))
export const listMatches = (sportId?: number, seriesId?: number) =>
  unwrap<Match[] | null>(api.get('/api/sports/matches', {
    params: { ...(sportId ? { sportId } : {}), ...(seriesId ? { seriesId } : {}) },
  }))
export const blockMatch = (id: number, blocked: boolean) =>
  unwrap<unknown>(api.put(`/api/sports/matches/${id}/block`, { blocked }))

// ---- Betting ----
export type Bet = {
  id: string; userId: number; marketId: string; selection: string; side: string
  price: number; stake: number; matchedSize: number; exposure: number; createdAt: string
  settled?: boolean; pl?: number
}
export const listBets = (params?: { marketId?: string; userId?: number; matchId?: number; betType?: string }) =>
  unwrap<Bet[] | null>(api.get('/api/betting/bets', { params }))
export const deleteBet = (id: string) => unwrap<unknown>(api.delete(`/api/betting/bets/${id}`))

// ---- Reports ----
export const reportBetHistory = (userId?: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/bet-history', { params: userId ? { userId } : {} }))
export const reportStatement = (userId?: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/statement', { params: userId ? { userId } : {} }))
export const reportProfitLoss = (userId?: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/profit-loss', { params: userId ? { userId } : {} }))
export const reportLoginHistory = (userId?: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/login-history', { params: userId ? { userId } : {} }))
export const reportDeletedBets = (userId?: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/deleted-bets', { params: userId ? { userId } : {} }))
export const reportPasswordHistory = (userId?: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/password-history', { params: userId ? { userId } : {} }))

// ---- Domains (Website Setting) ----
export type Domain = {
  id: number; name: string; url: string; alternateUrl: string | null
  adminHeadline: string | null; showRegister: boolean; createdAt: string
}
export const listDomains = () => unwrap<Domain[] | null>(api.get('/api/domains'))
export const createDomain = (body: { name: string; url: string; alternateUrl?: string; adminHeadline?: string }) =>
  unwrap<{ id: number }>(api.post('/api/domains', body))
export const updateDomain = (id: number, body: { alternateUrl?: string; adminHeadline?: string; showRegister?: boolean }) =>
  unwrap<{ id: number }>(api.put(`/api/domains/${id}`, body))

// ---- Results / Completed (§22, §6) ----
export type Result = {
  id: number; matchId: number; sportId: number; marketId: string
  marketName: string | null; selectionName: string | null
  declaredBy: string | null; status: string; declaredAt: string
}
export const listResults = (sportId?: number) =>
  unwrap<Result[] | null>(api.get('/api/sports/results', { params: sportId ? { sportId } : {} }))
export const declareResult = (body: {
  matchId: number; sportId: number; marketId: string; marketName: string; selectionName: string
}) => unwrap<unknown>(api.post('/api/sports/results', body))
export const revokeResult = (id: number) => unwrap<unknown>(api.post(`/api/sports/results/${id}/revoke`, {}))
export const listCompletedMatches = () => unwrap<Match[] | null>(api.get('/api/sports/matches/completed'))

// ---- Settings (§32) ----
export type Setting = { key: string; value: string }
export const listSettings = () => unwrap<Setting[] | null>(api.get('/api/settings'))
export const setSetting = (key: string, value: string) =>
  unwrap<Setting>(api.put(`/api/settings/${key}`, { value }))

// ---- News (§29) ----
export type NewsPost = { id: string; slug: string; content: string; createdOn: string }
export const listNews = () => unwrap<NewsPost[] | null>(api.get('/api/news'))
export const createNews = (body: { slug: string; content: string }) =>
  unwrap<{ id: string }>(api.post('/api/news', body))
export const deleteNews = (id: string) => unwrap<unknown>(api.delete(`/api/news/${id}`))
export const updateNews = (id: string, body: { slug: string; content: string }) =>
  unwrap<unknown>(api.put(`/api/news/${id}`, body))

// ---- Queries (§28) ----
export type Query = {
  id: string; mobile: string; category: string; query: string
  status: string; issueDate: string; resolveDate: string | null
}
export const listQueries = (status?: string) =>
  unwrap<Query[] | null>(api.get('/api/queries', { params: status ? { status } : {} }))
export const createQuery = (body: { mobile: string; category: string; query: string }) =>
  unwrap<{ id: string }>(api.post('/api/queries', body))
export const resolveQuery = (id: string) => unwrap<unknown>(api.put(`/api/queries/${id}`, {}))

// ---- Blocked clients / parents (§9, §12) ----
export const listBlocked = () => unwrap<User[] | null>(api.get('/api/users/blocked'))

export type ParentInfo = { userId: number; role: string; username: string; name: string; share: number }
export const getParents = (username: string) =>
  unwrap<ParentInfo[] | null>(api.get('/api/users/parents', { params: { username } }))
export const resetUserPassword = (id: number, newPassword: string) =>
  unwrap<{ changed: boolean }>(api.post(`/api/users/${id}/password`, { newPassword }))
export const updateAccount = (id: number, body: { name: string; phone: string }) =>
  unwrap<User>(api.put(`/api/users/${id}/account`, body))
// Edit-Profile tab: name + no. of users + remark.
export const updateProfileFields = (id: number, body: { name: string; noOfChild: number; remark: string }) =>
  unwrap<User>(api.put(`/api/users/${id}/account`, body))
// Casino Limit tab: increment the casino limit.
export const addCasinoLimit = (id: number, add: number) =>
  unwrap<User>(api.put(`/api/users/${id}/casino-limit`, { add }))

// ---- Per-user restrictions: Sport Block / Sport Limit / Poker Block ----
export const getBlockedSports = (userId: number) =>
  unwrap<number[] | null>(api.get('/api/restrictions/blocked-sports', { params: { userId } }))
export const setBlockedSports = (userId: number, sportIds: number[]) =>
  unwrap<unknown>(api.post('/api/restrictions/blocked-sports', { userId, sportIds }))
export type SportLimit = {
  userId: number; sportId: number; type: string; minStake: number; maxStake: number; maxProfit: number
  betDelay: number; marketVolume: number; maxMarketExposure: number; layDiff: number
}
export const getSportLimits = (userId: number) =>
  unwrap<SportLimit[] | null>(api.get('/api/restrictions/sport-limits', { params: { userId } }))
export const setSportLimit = (body: SportLimit) => unwrap<unknown>(api.post('/api/restrictions/sport-limits', body))
export const getPokerBlock = (userId: number) =>
  unwrap<{ blocked: boolean }>(api.get('/api/restrictions/poker-block', { params: { userId } }))
export const setPokerBlock = (userId: number, blocked: boolean) =>
  unwrap<{ blocked: boolean }>(api.post('/api/restrictions/poker-block', { userId, blocked }))

// ---- Settlements (§26) ----
export type Settlement = {
  id: number; parentUser: string; childUser: string; amount: number; remark: string | null; onDate: string
}
export const listSettlements = () => unwrap<Settlement[] | null>(api.get('/api/settlements'))
export const createSettlement = (body: { childId: number; amount: number; remark?: string }) =>
  unwrap<unknown>(api.post('/api/settlements', body))
export const deleteSettlement = (id: number) => unwrap<unknown>(api.delete(`/api/settlements/${id}`))

// ---- Helpers / Add Worker (§24) ----
export type Helper = {
  id: number; mstruserid: string; mstrname: string; parentId: number
  permissions: string[]; createdAt: string
}
export const listHelpers = () => unwrap<Helper[] | null>(api.get('/api/helpers'))
export const createHelper = (body: {
  name: string; userId: string; password: string; permissions: string[]; question?: string; answer?: string
}) => unwrap<unknown>(api.post('/api/helpers', body))
export const deleteHelper = (id: number) => unwrap<unknown>(api.delete(`/api/helpers/${id}`))
export const updateHelper = (id: number, body: { name: string; permissions: string[] }) =>
  unwrap<unknown>(api.put(`/api/helpers/${id}`, body))
export const resetHelperPassword = (id: number, password: string) =>
  unwrap<unknown>(api.put(`/api/helpers/${id}/password`, { password }))

// ---- Concurrent users (§31) ----
export type CountPerUser = {
  totalUsers: number; totalBets: number; users: { userId: number; bets: number }[]
}
export const countPerUser = (marketId: string) =>
  unwrap<CountPerUser>(api.get('/api/betting/count-per-user', { params: { marketId } }))

// ---- Commission & Limits (§10) ----
export type CommissionUpdate = {
  partnerCricket: number; partnerCasino: number; commission: number
  rollingCommission: number; sessionComm: number; creditLimit: number
}
export const updateCommission = (id: number, body: CommissionUpdate) =>
  unwrap<User>(api.put(`/api/users/${id}/commission`, body))

export type AccountSummary = { balance: number; downlineBalance: number; exposure: number }
export const getSummary = () => unwrap<AccountSummary>(api.get('/api/users/summary'))
// Full-subtree downline balance for a specific user (Commission & Limits "Down Bal").
export const downlineBalanceOf = (userId: number) =>
  unwrap<{ downlineBalance: number }>(api.get(`/api/users/${userId}/downline-balance`))

// ---- Series / matches (§18, §19) ----
export const listSeries = (sportId?: number) =>
  unwrap<Series[] | null>(api.get('/api/sports/series', { params: sportId ? { sportId } : {} }))
export const createSeries = (body: { sportId: number; name: string }) =>
  unwrap<{ id: number }>(api.post('/api/sports/series', body))
export const toggleSeries = (id: number, active: boolean) =>
  unwrap<unknown>(api.put(`/api/sports/series/${id}`, { active }))
export const createMatch = (body: { sportId: number; name: string; seriesId?: number; startTime?: string }) =>
  unwrap<{ id: number }>(api.post('/api/sports/matches', body))
export const activateMatch = (id: number, active: boolean) =>
  unwrap<unknown>(api.put(`/api/sports/matches/${id}/activate`, { active }))

// ---- Ip Surveillance / login history (§30) ----
export type IpGroup = { ip: string; users: string[]; count: number; last: string }
export const loginHistoryToday = () => unwrap<IpGroup[] | null>(api.get('/api/login-history/today'))

// ---- Fancy / Set Fancy BetLimit (§27) ----
export type Fancy = {
  id: number; matchId: number; headName: string; minStake: number; maxStake: number
  maxSessionLiability: number; maxSessionBetLiability: number; message: string | null
  status: string; result: string | null
}
export const listFancy = (matchId?: number) =>
  unwrap<Fancy[] | null>(api.get('/api/fancy', { params: matchId ? { matchId } : {} }))
export const updateFancyStake = (id: number, body: {
  minStake: number; maxStake: number; maxSessionLiability: number; maxSessionBetLiability: number; message: string
}) => unwrap<unknown>(api.put(`/api/fancy/${id}/stake`, body))
export const updateFancyStatus = (id: number, status: string) =>
  unwrap<unknown>(api.put(`/api/fancy/${id}/status`, { status }))
export const declareFancy = (id: number, result: string) =>
  unwrap<unknown>(api.post(`/api/fancy/${id}/declare`, { result }))
export const createFancy = (body: { matchId: number; headName: string; selectionId?: string }) =>
  unwrap<{ id: number }>(api.post('/api/fancy', body))

// ---- Markets / runners catalog (Manage Betfair / Line markets) ----
export type Market = {
  id: number; matchId: number; marketId: string; name: string; category: string
  isManual: boolean; active: boolean; isPublished: boolean; totalMatched: number; startTime: string | null
}
export type Runner = { id: number; marketRowId: number; selectionId: string; name: string; sortOrder: number }
export const listMarkets = (matchId: number, category?: string) =>
  unwrap<Market[] | null>(api.get('/api/markets', { params: { matchId, ...(category ? { category } : {}) } }))
export const marketRunners = (id: number) => unwrap<Runner[] | null>(api.get(`/api/markets/${id}/runners`))
export const createMarket = (body: {
  matchId: number; name: string; marketId?: string; category?: string
  runners: { selectionId?: string; name: string }[]
}) => unwrap<{ id: number }>(api.post('/api/markets', body))
export const activateMarket = (id: number, active: boolean) =>
  unwrap<unknown>(api.put(`/api/markets/${id}/activate`, { active }))
export const publishMarket = (id: number, published: boolean) =>
  unwrap<unknown>(api.put(`/api/markets/${id}/publish`, { published }))

// Activate Matches — match-level feature state + toggles (Publish/Fancy/Bookmaker/Toss).
export type MatchFeatureState = { isPublished: boolean; hasBookmaker: boolean; hasToss: boolean; hasFancy: boolean }
export const matchFeatureState = (matchId: number) =>
  unwrap<MatchFeatureState>(api.get(`/api/markets/match/${matchId}/state`))
export const toggleMatchFeature = (matchId: number, feature: 'publish' | 'fancy' | 'bookmaker' | 'toss', on: boolean) =>
  unwrap<unknown>(api.post(`/api/markets/match/${matchId}/feature`, { feature, on }))

// ---- Bank requests / Agent Bank DP-WD (§20) ----
export type BankRequest = {
  id: number; userId: number; username: string; reqType: number; amount: number
  method: string | null; accountName: string | null; accountNumber: string | null
  ifsc: string | null; utr: string | null; remark: string | null; status: string; createdAt: string
}
export const listRequests = (params?: { type?: number; status?: string }) =>
  unwrap<BankRequest[] | null>(api.get('/api/requests', { params }))
export const createRequest = (body: {
  reqType: number; amount: number; method?: string; accountName?: string; accountNumber?: string; ifsc?: string
}) => unwrap<unknown>(api.post('/api/requests', body))
export const updateRequestStatus = (id: number, body: { status: string; amount?: number; utr?: string; remark?: string }) =>
  unwrap<unknown>(api.put(`/api/requests/${id}`, body))

// ---- Casino / Aura GGR (§7) ----
export type GGRRow = { summaryDate: string; label: string; netChips: number }
export const casinoGGR = (from?: string, to?: string) =>
  unwrap<{ total: number; rows: GGRRow[] | null }>(api.get('/api/casino/ggr', { params: { from, to } }))

// ---- Wallet statement (for Deduct Dealer §21) ----
export type WalletRow = {
  id: number; userId: number; narration: string; credit: number; debit: number
  balanceAfter: number; accountType: number; crdr: number; createdAt: string // crdr: 1=Credit, 2=Debit
}
export const walletStatement = (userId: number) =>
  unwrap<WalletRow[] | null>(api.get('/api/wallet/statement', { params: { userId } }))

// ---- Collection Report / Chips Summary (§13, §16) ----
export type CollectionUser = { id: number; username: string; name: string; balance: number }
export type CollectionReportData = {
  minusUsers: CollectionUser[]; plusUsers: CollectionUser[]; zeroUsers: CollectionUser[]
}
export const collectionReport = () => unwrap<CollectionReportData>(api.get('/api/collection-report'))

// ---- Order book + place bet (My Markets §5) ----
export type BookLevel = { price: number; size: number }
export type BookSnapshot = { marketId: string; backs: BookLevel[] | null; lays: BookLevel[] | null }
export const getBook = (marketId: string) =>
  unwrap<BookSnapshot>(api.get('/api/betting/book', { params: { marketId } }))
export const placeBet = (body: {
  marketId: string; selection: string; side: 'back' | 'lay'; price: number; stake: number
  matchId?: number; betType?: string
}) => unwrap<{ bet: Bet; match: unknown }>(api.post('/api/betting/bets', body))

// ---- Per-match reports (Agent Match Dashboard hub) ----
export const reportClientReport = (matchId: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/client-report', { params: { matchId } }))
export const reportCompanyReport = (matchId: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/company-report', { params: { matchId } }))
export const reportSessionEarning = (matchId: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/session-earning', { params: { matchId } }))
export const reportMatchLedger = (matchId: number) =>
  unwrap<Record<string, unknown>[] | null>(api.get('/api/reports/match-ledger', { params: { matchId } }))

// A user's net P&L per match — the dedicated "Match ledger" view.
export type MatchLedgerRow = {
  matchId: number; matchName: string; bets: number; settled: number; open: number; stake: number; pl: number
}
export const userMatchLedger = (userId: number) =>
  unwrap<MatchLedgerRow[] | null>(api.get('/api/reports/user-match-ledger', { params: userId ? { userId } : {} }))

// ---- Live market odds (wrapper; dummy now, real providers later) ----
export type PriceSize = { price: number; size: number }
export type RunnerOdds = { selectionId: string; name: string; status: string; back: PriceSize[]; lay: PriceSize[] }
export type MarketBook = { marketId: string; matchId: number; name: string; status: string; runners: RunnerOdds[]; ts: number }
export const getOdds = (marketId: string) => unwrap<MarketBook>(api.get('/api/odds', { params: { marketId } }))
// All of an event's published markets (event page first paint; live via MATCH_ODDS room).
export const getMatchOdds = (matchId: number) => unwrap<MarketBook[] | null>(api.get('/api/odds/match', { params: { matchId } }))

// ---- Catalog block cascade (any tier blocks for its downline) ----
export const getMyBlocks = (itemType?: string) =>
  unwrap<string[] | null>(api.get('/api/catalog/blocks', { params: itemType ? { itemType } : {} }))
export const setCatalogBlock = (itemType: 'sport' | 'series' | 'match' | 'market', itemId: string, blocked: boolean) =>
  unwrap<unknown>(api.post('/api/catalog/block', { itemType, itemId, blocked }))

// ---- Third-party events feed (Super Duper Admin only) — failover wrapper ----
export type FeedSport = { id: string; name: string }
export type FeedSeries = { id: string; sportId: string; name: string }
export type FeedRunner = { id: string; name: string; status: string }
export type FeedMarket = { id: string; name: string; type: string; status: string; runners: FeedRunner[] }
export type FeedMatch = {
  id: string; sportId: string; seriesId: string; name: string; startTime: string; inPlay: boolean; markets: FeedMarket[]
  activated: boolean; localId: number // set by the wrapper after cross-referencing our DB
}
export type FeedSnapshot = { source: string; sports: FeedSport[]; series: FeedSeries[]; matches: FeedMatch[] }
export const feedEvents = (sportId?: string) =>
  unwrap<FeedSnapshot>(api.get('/api/feed/events', { params: sportId ? { sportId } : {} }))
export const feedSports = () => unwrap<FeedSport[] | null>(api.get('/api/feed/sports'))
// Import ("activate") a feed event into our catalog; returns our local match id.
export const feedActivate = (eid: string) =>
  unwrap<{ matchId: number; activated: boolean }>(api.post('/api/feed/activate', { eid }))

export type ReadyResponse = { status: 'ready' | 'degraded'; checks: Record<string, string> }
export const getReady = async (): Promise<ReadyResponse> => {
  const { data } = await api.get<ReadyResponse>('/health/ready')
  return data
}
