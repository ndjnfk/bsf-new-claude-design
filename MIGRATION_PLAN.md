# User Panel — Angular → React Migration Plan

**Status:** Step 1 (audit + plan) complete. **No React code written yet, no Angular source modified.**

## Context & sources

| Thing | Location | Mutability |
|---|---|---|
| Angular User Panel (reference) | `D:\bsf-claude-fine_code\bsf GUI\bsf2020` | **READ-ONLY** |
| Reference backend (AdonisJS, what Angular calls today) | `D:\bsf-claude-fine_code\bsf-api-main-test-jack-branch\bsf2020-api` | **READ-ONLY** (reference only) |
| **New** React User Panel (to be built) | `D:\new-bsf-tanya\user-panel` (proposed, separate project) | new |
| **Our** Go backend (where new user APIs go) | `D:\new-bsf-tanya\backend` → new module `internal/userpanel`, mounted at **`/api/user/*`** | new code only |
| Existing React Admin panel (stack to mirror) | `D:\new-bsf-tanya\frontend` | reference |

### The single most important fact
The Angular panel targets the **AdonisJS** backend (`https://bsftest.co/api/`) over **socket.io** (`/api/socket.io`). Endpoint names (`login`, `me`, `dashboard`, `bets/market`, `accountStatement`, …) and the realtime protocol are **AdonisJS-shaped**, and **do not match our Go backend** (`/api/auth/login`, `/api/sports/matches`, `/api/betting/bets`, native WebSocket `/ws` with `room:*` pub/sub).

**Decision baked into this plan:** we do **not** port the Adonis contract verbatim. We build a **new, isolated Go module `internal/userpanel` under the URL prefix `/api/user/*`** that exposes the bettor-shaped endpoints the React panel needs, delegating to existing modules (identity, sports, odds, betting, wallet, reporting, requests, exposure) and adding only the genuinely missing pieces. The React panel talks **only** to `/api/user/*` (+ `/ws`). This keeps the bettor surface cleanly separated from the admin surface, as requested ("alg folder … different url").

---

## 1. Complete route inventory

Angular routing: `src/app/app-routing.module.ts`. Guard: `_helpers/auth.guard.ts` — functional `AuthGuard` = `!!api.user.getValue()` (in-memory user present). Token lives in `sessionStorage['token']`.

| # | Angular path | Component | Guard | React route (proposed) | Migrate? |
|---|---|---|---|---|---|
| 1 | `/` → `/login-m` | redirect | — | `/` → `/login` | ✅ |
| 2 | `/login-m` | LoginMain | public | `/login` | ✅ (merge with login) |
| 3 | `/login` | Login | public | `/login` | ✅ core |
| 4 | `/register` | Register | public | `/register` | ⚠️ scope (OTP/captcha) |
| 5 | `/home` | Home | auth | `/home` | ✅ core |
| 6 | `/in-play` | InPlay | auth | `/in-play` | ✅ core |
| 7 | `/event/:event_id/:market_id/:sport_id` | Event | auth | `/event/:matchId/:marketId/:sportId` | ✅ core (highest complexity) |
| 8 | `/profit-loss` | ProfitLoss | auth | `/profit-loss` | ✅ |
| 9 | `/account-statement` & `/ledger` | AccountStatement | auth | `/account-statement` | ✅ core |
| 10 | `/ledger/:matchid` | LedgerByMatch | auth | `/ledger/:matchId` | ✅ |
| 11 | `/bet-history` | BatHistory (My Bets) | auth | `/bet-history` | ✅ core |
| 12 | `/results` | Results | auth | `/results` | ✅ |
| 13 | `/change-password` | ChangePassword | auth | `/change-password` | ✅ |
| 14 | `/login-history` | LoginHistory | auth | `/login-history` | ✅ |
| 15 | `/password-history` | PasswordHistory | auth | `/password-history` | ✅ |
| 16 | `/deposit` | Deposit | auth | `/deposit` | ⚠️ scope (gateways) |
| 17 | `/withdraw` | Withdraw | auth | `/withdraw` | ⚠️ scope (gateways) |
| 18 | `/wallet-home` | WalletHome | auth | `/wallet` | ✅ |
| 19 | `/request` | Request (dep/wd history) | auth | `/request` | ✅ |
| 20 | `/banks` | BankDetails | auth | `/banks` | ✅ (needs backend) |
| 21 | `/stake-value` | ButtonValue | auth | `/stake-value` | ✅ (needs backend `stakes`) |
| 22 | `/rules` | Rules | auth | `/rules` | ✅ (static) |
| 23 | `/setting` | Setting | auth | `/setting` | ✅ (hub page) |
| 24 | `/userhome` | Userhome | auth | `/userhome` | ✅ (alt home) |
| 25 | `/tournament` | Tournament | auth | `/tournament` | 🟡 placeholder |
| 26 | `/logs` | Logs | auth | — | ❌ admin/support, drop |
| 27 | `/poker`, `/poker/detail/:id`, `/pokerUrl`, `/gamesPoker` | Poker* | auth | `/poker*` | 🔴 deferred (3rd-party) |
| 28 | `/kingCasino`, `/gamesCasino`, `/dreamCasino`(+`/game/:code`), `/gamehubCasino`(+`/game/:id`), `/gamesList` | Casino* | auth | `/casino/*` | 🔴 deferred (3rd-party) |
| 29 | `maintainance` | Maintenance | — | global state | ✅ as a guard/state |

Legend: ✅ in scope · ⚠️ in scope but needs a scope decision · 🟡 placeholder · 🔴 deferred/out of MVP · ❌ drop.

---

## 2. Component migration mapping

Layout (shared): **Header** (balance + exposure, nav, change-password modal, open-bets modal, casino-transfer modal), **Sidebar** (sport list + quick links), **Footer**. Build these as a single `AppLayout` (mirror admin `AppShell.tsx`).

| Angular component | Purpose | React target | Notes / business logic to preserve |
|---|---|---|---|
| Header | balance/exposure bar, nav, modals | `components/Header.tsx` | live balance via socket `USER_UPDATE_DATA` → our `EXPOSURE:<id>` / a new `USER_UPDATE_DATA:<id>` room; open-bets list |
| Sidebar | sport nav + links | `components/Sidebar.tsx` | sport filter (exclude casino sport ids 1233/1235/1236/1234) |
| Footer | brand/info | `components/Footer.tsx` | static |
| Login / LoginMain | auth + captcha + forgot | `routes/Login.tsx` | captcha refresh 240s; device info (UAParser); `mustMatch` validators |
| Register | signup + OTP | `routes/Register.tsx` | async username check; email/phone OTP |
| Home / Userhome | match dashboard by sport | `routes/Home.tsx` | parse `runner_json`; In-Play badge; click → `/event/...` |
| InPlay | live-only dashboard | `routes/InPlay.tsx` | same as Home, live filter |
| **Event** | **bet placement hub** | `routes/Event.tsx` (+ `BetSlip`, `MarketCard`, `FancyCard`, `BookModal`) | back/lay ladders, bet slip, profit calc, 8s odds expiry, suspend/ball-running, cashout, fancy (Indian + line), limits hierarchy |
| BatHistory | My Bets | `routes/BetHistory.tsx` | filters (date/sport/status); LAGAI/KHAI labels; pagination |
| Results | match results | `routes/Results.tsx` | sport+date filter; pagination |
| AccountStatement | ledger/commission/credit | `routes/AccountStatement.tsx` | type filter; opening balance; running balance; link to bet-history by match |
| LedgerByMatch | per-match P/L | `routes/LedgerMatch.tsx` | matchOdds/bookmaker/toss/fancy breakdown + commission |
| ProfitLoss | P/L by match+market | `routes/ProfitLoss.tsx` | collapsible match → market drill-down; color by sign |
| Deposit | deposit via gateways | `routes/Deposit.tsx` | gateway tabs, account details copy, QR, UTR/screenshot |
| Withdraw | withdraw request | `routes/Withdraw.tsx` | conditional fields by gateway; preset bank fill |
| WalletHome | wallet hub | `routes/Wallet.tsx` | nav links |
| BankDetails | saved banks CRUD | `routes/BankDetails.tsx` | formly→RHF; is_default |
| Request | dep/wd request history | `routes/Request.tsx` | date quick-filters; view modal; screenshot modal; fast-withdraw fee calc |
| ChangePassword | password update | `routes/ChangePassword.tsx` | logout on success |
| LoginHistory / PasswordHistory | history tables | `routes/LoginHistory.tsx`, `routes/PasswordHistory.tsx` | paginated tables |
| ButtonValue | quick-stake config | `routes/StakeValue.tsx` | save stakes array on user |
| Rules / Setting / Tournament | static/hub | `routes/Rules.tsx` etc. | static or link hubs |
| Casino*/Poker* | 3rd-party launchers | `routes/casino/*` | **deferred** — iframe launchers; no Go backend yet |

---

## 3. API endpoint inventory + Go backend mapping

The reference contract is **AdonisJS** (base `…/api/`). Below maps each Angular call to its **Go `/api/user/*` target**, marking **EXISTS** (already in Go, possibly under another path — the user module will re-expose/delegate), **ADAPT** (exists but shape/verb differs), or **NEW** (must be built).

### 3.1 Auth & profile
| Angular call | Verb | Go target (`/api/user/...`) | Backing | Status |
|---|---|---|---|---|
| `login` | POST | `POST /api/auth/login` (reuse) | identity | **EXISTS** (admin login works for Players too) |
| `me?origin=` | GET | `GET /api/user/me` | identity `/auth/me` + domain/banners | **ADAPT** (wrap profile; domain/banners NEW/optional) |
| `logout` | GET | client-side token drop (JWT stateless) | — | **ADAPT** (no server logout needed) |
| `captcha` | GET | `GET /api/user/captcha` | — | **NEW** (optional) |
| `username` (availability) | POST | `GET /api/users/username-available` | identity | **EXISTS** |
| `userRegister` | POST | `POST /api/user/register` | identity CreateChild | **NEW** (+ scope decision) |
| `verifyEmail` / `sendOtp` / `passwordOtp` / `updatePassword` | POST | `/api/user/otp/*` | — | **NEW** (needs SMS/email provider) |
| `changePassword` | POST | `POST /api/auth/change-password` | identity | **EXISTS** |
| `stakes` | POST | `PUT /api/user/stakes` | users column | **NEW** (store quick-stakes) |
| `loginHistory` | GET | `GET /api/reports/login-history` | reporting | **EXISTS** |
| `passwordHistory` | GET | `GET /api/reports/password-history` | reporting | **EXISTS** |

### 3.2 Sports / dashboard / results
| Angular call | Verb | Go target | Backing | Status |
|---|---|---|---|---|
| `sports` | GET | `GET /api/sports` | sports | **EXISTS** |
| `dashboard?sport_id=` | GET | `GET /api/user/dashboard?sportId=` | sports/matches + odds | **ADAPT** (assemble `runner_json`+inPlay+counts) |
| `dashboard/horse?sport_id=` | GET | `GET /api/user/dashboard/horse` | — | **NEW** (or defer horse/greyhound) |
| `results` | GET | `GET /api/sports/results` | sports | **EXISTS** (verify shape) |

### 3.3 Match / market / fancy (Event page)
| Angular call | Verb | Go target | Backing | Status |
|---|---|---|---|---|
| `matches/{id}` | GET | `GET /api/user/matches/{id}` | sports + odds | **ADAPT** (scoreboard/tv optional) |
| `matches/{id}/markets` | GET | `GET /api/user/matches/{id}/markets` | odds `/odds/match` | **ADAPT** (Betfair book → `runner_json` shape) |
| `matches/{id}/fancies` | GET | `GET /api/user/matches/{id}/fancies` | fancy (limits only today) | **NEW** (fancy book + priorities + limits) |
| `matches/{id}/fancyLiability` | GET | `GET /api/user/matches/{id}/fancy-liability` | exposure/bets | **NEW** |
| `bets/market` (place) | POST | `POST /api/user/bets` | betting `place` | **ADAPT** (place as logged-in Player — currently SDA-only) |
| `bets/fancy` (place) | POST | `POST /api/user/bets/fancy` | betting + fancy | **NEW** (fancy settlement model) |
| `bets/line` | POST | `POST /api/user/bets/fancy` | betting | **NEW** |
| `bookmakerBets`/`tossBets`/`tiedMatchBets`/`fancyBets` | GET | `GET /api/user/bets?matchId=&type=` | betting list | **ADAPT** |

### 3.4 My Bets / statement / P-L
| Angular call | Verb | Go target | Backing | Status |
|---|---|---|---|---|
| `betHistory` | POST | `GET /api/user/bet-history` | reporting bet-history | **ADAPT** (verb + filters) |
| `betHistoryFilter` | POST | `GET /api/user/bet-history?matchId=` | reporting | **ADAPT** |
| `bets?paginate=no` (open bets) | GET | `GET /api/betting/bets?userId=me&settled=open` | betting | **EXISTS** |
| `me/trade` (exposures) | POST | `GET /api/user/exposure` | exposure + bets | **ADAPT/NEW** |
| `accountStatement` | GET | `GET /api/wallet/statement` | wallet | **EXISTS** (add date/type filter) |
| `ledger` | GET | `GET /api/wallet/statement?type=ledger` | wallet | **ADAPT** |
| `ledger/{matchId}` | GET | `GET /api/reports/user-match-ledger` | reporting | **ADAPT** |
| `profitLoss` | POST | `GET /api/reports/profit-loss` | reporting | **ADAPT** (settled P/L sum is a known gap) |
| `profitLossByMatch` | POST | `GET /api/user/profit-loss/{matchId}` | reporting | **NEW/ADAPT** |

### 3.5 Wallet (deposit / withdraw / banks / requests)
| Angular call | Verb | Go target | Backing | Status |
|---|---|---|---|---|
| `getBanks {type:0/1}` | POST | `GET /api/user/payment-accounts?type=` | — | **NEW** (gateway/account catalog not modeled) |
| `fastWithdrawShow` | POST | `GET /api/user/wallet-settings` | settings | **NEW** (min/max/fast-fee) |
| `deposit` (manual UTR/screenshot) | POST | `POST /api/requests` (type=1) | requests | **ADAPT** (add UTR/screenshot fields) |
| `depositNew` (gateway redirect) | POST | — | — | 🔴 **DEFER** (payment gateway integration) |
| `withdraw` | POST | `POST /api/requests` (type=2) | requests | **ADAPT** (bank fields) |
| `getRequest` | POST | `GET /api/requests?type=&from=&to=` | requests | **ADAPT** (verb + filters) |
| `userBanks` GET/POST/PUT/DELETE | — | `GET/POST/PUT/DELETE /api/user/banks` | — | **NEW** (user_banks table) |

### 3.6 Casino / poker / casino-balance — 🔴 DEFER (third-party, no Go backend)
`dream/gameList`, `dream/gameUrl`, `gamehub/gameList`, `gamehub/gameUrl`, `poker/getUrl`, `poker/getPokerGameList`, `poker/getGameUrl`, `poker/getUserCasinoLimit`, `casino_balance/deposit|withdraw`. None exist in the Go backend. **Recommend out of MVP**; revisit after core bettor flow.

### 3.7 Proposed new Go module
```
backend/internal/userpanel/
  userpanel.go     // Module + Register(api, requireAuth) under group "/user"
  dashboard.go     // GET /user/dashboard, /user/matches/{id}, /markets, /fancies
  bets.go          // POST /user/bets (+ /bets/fancy), GET /user/bet-history, /exposure
  wallet.go        // /user/banks CRUD, /user/payment-accounts, /user/wallet-settings, /user/me
  register.go      // /user/register, /user/otp/*, /user/captcha   (scope-gated)
```
Registered in `internal/app/app.go`: `userpanel.New(d.MySQL, d.Mongo, d.Redis, ...).Register(api, requireAuth)`. **Player bet placement** = the existing `betting.place` logic but gated to the authenticated user (drop the SDA-only middleware on the `/api/user/bets` route; deduct-on-placement already works — see `MEMORY balance-model`). Possible new migrations: `user_banks`, `users.stakes`, `payment_accounts`, `wallet_settings`.

---

## 4. Socket / realtime functionality

**Angular (socket.io, `/api/socket.io`)** — join via `emit('room',{name})`, leave via `emit('leave_room',{name})`, auth `{token,xId,xType}`:

| Room / event | Used by | Purpose |
|---|---|---|
| `EID<eventId>` | event | per-event odds |
| `MARKET_UPDATE_DATA:<matchId>` / `UPDATE_MARKETS<matchId>` | event | market odds |
| `UPDATE_MATCH_EVENT:<matchId>` | event | match meta |
| `FANCY<matchId>` / `UPDATE_FANCY<matchId>` | event | fancy odds |
| `BETS_UPDATE_DATA:<userId>_<matchId>` | event | bet/exposure refresh after placement |
| `USER_UPDATE_DATA:<userId>` | header/sidebar/footer | live balance, force-logout |
| `BANK_UPDATE:<dealerId>` / `PAYMENT_UPDATE:<userId>` | deposit/withdraw | bank list / payment status |
| `DASHBOARD_UPDATE_USER` | home/in-play | dashboard refresh |
| `HIER_EVENT` (`on`) | app | `FORCE_LOGOUT`, `BET_LOCK` from upline |
| `message` (`on`) | event/home/in-play | generic odds payload |

**Our Go backend (native WS `/ws`, Redis `room:*` pub/sub)** already emits: `MARKET_ODDS:<marketId>`, `MATCH_ODDS:<matchId>`, `EXPOSURE:<userId>`, `MARKET_UPDATE_DATA:<marketId>`, `CATALOG_BLOCKS:<uid>`, `DASHBOARD_UPDATE_ADMIN`.

**Plan:**
- React panel reuses the admin's **native-WS** client (`frontend/src/lib/socket.ts`, `hooks/useRoom`) — **not** socket.io-client.
- Map Angular rooms → Go rooms: odds = `MATCH_ODDS:<matchId>` + `MARKET_ODDS:<marketId>`; exposure = `EXPOSURE:<userId>`.
- **NEW Go rooms to add** for parity: `USER_UPDATE_DATA:<userId>` (balance/lock/force-logout) and a fancy odds room `FANCY:<matchId>` (when fancy is built). Add `BANK_UPDATE`/`PAYMENT_UPDATE` only if gateway deposits are in scope.
- Suspend/staleness already handled server-side (SUSPENDED after 10s) — reuse for the Event page bet gate.

---

## 5. Angular → React library replacements

Target stack = **mirror the admin panel**: React 18 + Vite 5 + TypeScript + TanStack Query 5 + Zustand + axios + react-router 6.

| Angular dep | Purpose | React replacement | Note |
|---|---|---|---|
| Angular 17 (framework) | — | React 18 + Vite | match admin |
| `@ngx-formly/core`+`/bootstrap` | dynamic forms | **react-hook-form** (+ zod) | port formly configs to RHF schemas |
| `bootstrap` 5.3 (SCSS) | UI/CSS | **react-bootstrap + keep SCSS** *(decision)* | preserves bettor look; admin uses MUI — see Risk R1 |
| `ngx-socket-io` (socket.io) | realtime | **native WS** (reuse admin `socket.ts`) | **protocol change** — backend is native WS |
| `ngx-toastr` | toasts | **react-toastify** (or notistack) | |
| `ngx-pagination` | pagination | TanStack Query + small `Pagination` component | |
| `ngx-owl-carousel-o` | carousels | **swiper** or embla | banners only |
| `ngx-pipes` | format pipes | **date-fns** + util fns | |
| `ngx-capture` | screenshot | **html2canvas** | only if used (export) |
| `ng-apexcharts`+`apexcharts` | charts | **react-apexcharts** + apexcharts | P/L charts |
| `ng-qrcode` | QR | **qrcode.react** | deposit QR |
| `bn-ng-idle` | idle logout | small `useIdleTimeout` hook | 1h timeout |
| `ua-parser-js` | device info | `ua-parser-js` (same) | works in React |
| `moment` | dates | **date-fns** / dayjs | |
| `jquery` (17 components) | DOM/modals | **remove** → React state + react-bootstrap modals | eliminate `$` |
| `subsink` | sub cleanup | n/a (hooks) | |
| `axios` | HTTP | `axios` (same) + TanStack Query | reuse admin `api.ts` pattern |

---

## 6. Page-wise migration order

**Phase 0 — Scaffold (separate project `user-panel/`)**
Vite+React+TS, MUI-or-Bootstrap decision (R1), `api.ts` (axios+interceptor, `sessionStorage` token), `socket.ts` (native WS), Zustand `auth` store, router + `RequireAuth`, `AppLayout` (Header/Sidebar/Footer). **Backend:** create `internal/userpanel` skeleton + mount `/api/user`.

**Phase 1 — Auth + shell (unblocks everything)**
1. Login (+ captcha optional) · 2. AppLayout live balance/exposure · 3. Change Password · 4. `/api/user/me`, `/api/user/stakes`.

**Phase 2 — Core bettor flow (80% of usage)**
5. Home + InPlay (`/api/user/dashboard`) · 6. **Event** — markets + bet slip + place bet as Player (`/api/user/bets`) + live odds/suspend · 7. Bet History (My Bets) · 8. Account Statement + Ledger-by-match.

**Phase 3 — Financials & reports**
9. Profit-Loss (+ settled-P/L backend gap) · 10. Results · 11. Login/Password History.

**Phase 4 — Wallet**
12. Bank Details CRUD (`/api/user/banks`) · 13. Deposit (manual UTR/screenshot via `/api/requests`) · 14. Withdraw · 15. Request history · 16. Wallet hub + Stake-value + Rules/Setting.

**Phase 5 — Fancy/session betting** (only if in scope)
17. Fancy book + `bets/fancy` + fancy liability + settlement (largest net-new backend work).

**Phase 6 — Deferred:** casino/poker launchers, payment-gateway redirects, horse/greyhound, registration-with-OTP (pending decisions).

Rationale: layout+auth first (frame + unblock), then the read-light/write-critical core flow, then read-heavy reports, then isolated wallet, then the heaviest net-new domain (fancy), then third-party.

---

## 7. Risks & unclear functionality (decisions needed)

- **R1 — UI library: Bootstrap vs MUI.** The bettor UI is Bootstrap/SCSS; the admin panel is MUI. Faithful look ⇒ react-bootstrap + port the SCSS/theme vars. Consistency/reuse ⇒ MUI. **Recommend react-bootstrap** for fidelity. *Decision needed.*
- **R2 — API contract source of truth.** Plan re-exposes a Go `/api/user/*` contract rather than copying AdonisJS verbatim (their shapes differ; our data model differs). Confirm this is acceptable vs. attempting byte-for-byte Adonis parity.
- **R3 — Realtime protocol.** Backend is **native WS**, Angular used **socket.io**. We adapt to native WS and add `USER_UPDATE_DATA`/fancy rooms. No socket.io server will be added. *Confirm.*
- **R4 — Self-registration + OTP/captcha.** Admin model says Players are **created by their parent Dealer**; the Angular panel also has self-register with email/phone OTP (needs SMS/email provider, not in Go). **Is public self-registration in scope?** If not, drop `/register`.
- **R5 — Fancy / session betting.** Big domain (Indian + line fancy, priorities, per-fancy limits, separate settlement). Go backend has fancy **limits** only, no fancy bet/book/settlement. **In scope for v1?** Large effort if yes.
- **R6 — Deposit/withdraw model.** Angular uses a payment-gateway + bank-account catalog (`getBanks`, `depositNew`, fast-withdraw fee). Go uses manual `/api/requests`. Plan = manual deposit/withdraw via requests; **gateway redirects deferred.** Confirm.
- **R7 — Casino/poker.** No Go backend; third-party (Dream/Gamehub/King/Ezugi). **Deferred / out of MVP.** Confirm.
- **R8 — Multi-tenant/domain branding.** `me?origin=`, domain config, banners, social links, maintenance flag — not modeled in Go. Single-brand for v1? 
- **R9 — Known backend gaps to fill:** Player bet-place gate (currently SDA-only), `profit-loss` settled-P/L aggregation, `user_banks`/`users.stakes`/`payment_accounts`/`wallet_settings` tables, horse/greyhound dashboard.
- **R10 — Session/security parity:** 1-hour idle logout, multi-tab `tabGUID` logout, captcha, `HIER_EVENT` force-logout/bet-lock. Re-implement as hooks; force-logout needs the new `USER_UPDATE_DATA` room.

---

### Recommended next step
Resolve **R1, R4, R5, R6, R7** (they size the project), then proceed to **Phase 0** scaffolding of `user-panel/` + the `internal/userpanel` skeleton. No implementation will start until you approve scope.
