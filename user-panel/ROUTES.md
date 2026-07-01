# Step 7 — Routing Migration Report

All routes from the Angular `app-routing.module.ts` are migrated to React Router with
URL spellings and dynamic params preserved exactly. Pages are lazy-loaded; protected
routes use `ProtectedRoute`; unknown URLs render `NotFound`; the default route
redirects to `/login-m`; scroll restoration matches `scrollPositionRestoration: 'top'`.

## Route inventory (Angular → React)

| Angular path | Param(s) | Access | React page (lazy) |
|---|---|---|---|
| `''` → `/login-m` | — | redirect | `<Navigate to="/login-m">` |
| `login-m` | — | public | LoginMain |
| `login` | — | public | Login |
| `register` | — | public | Register |
| `home` | — | protected | Home |
| `in-play` | — | protected | InPlay |
| `profit-loss` | — | protected | ProfitLoss |
| `event/:event_id/:market_id/:sport_id` | event_id, market_id, sport_id | protected | Event |
| `change-password` | — | protected | ChangePassword |
| `account-statement` | — | protected | AccountStatement |
| `ledger` | — | protected | AccountStatement *(alias)* |
| `ledger/:matchid` | matchid | protected | LedgerMatch |
| `bet-history` | — | protected | BetHistory |
| `stake-value` | — | protected | StakeValue |
| `deposit` | — | protected | Deposit |
| `withdraw` | — | protected | Withdraw |
| `wallet-home` | — | protected | WalletHome |
| `request` | — | protected | Request |
| `banks` | — | protected | BankDetails |
| `poker` | — | protected | Poker |
| `poker/detail/:id` | id | protected | PokerDetail |
| `pokerUrl` | — | protected | PokerUrl |
| `gamesPoker` | — | protected | GamesPoker |
| `kingCasino` | — | protected | KingCasino |
| `gamesCasino` | — | protected | GamesCasino |
| `dreamCasino` | — | protected | DreamCasino |
| `dreamCasino/game/:game_code` | game_code | protected | DreamCasinoGame |
| `gamehubCasino` | — | protected | GamehubCasino |
| `gamehubCasino/game/:gameId` | gameId | protected | GamehubCasinoGame |
| `password-history` | — | protected | PasswordHistory |
| `login-history` | — | protected | LoginHistory |
| `rules` | — | protected | Rules |
| `userhome` | — | protected | Userhome |
| `setting` | — | protected | Setting |
| `results` | — | protected | Results |
| `tournament` | — | protected | Tournament |
| `gamesList` | — | protected | GamesList |
| `logs` | — | protected | Logs |
| `*` (new) | — | any | NotFound |

Exact spellings preserved, including camelCase (`pokerUrl`, `gamesPoker`, `kingCasino`,
`gamesCasino`, `dreamCasino`, `gamehubCasino`, `gamesList`) and hyphenated
(`in-play`, `account-statement`, `bet-history`, `stake-value`, `wallet-home`,
`password-history`, `login-history`, `profit-loss`, `change-password`).

## ⚠️ Duplicate / alias routes found (reported, behavior preserved)

1. **`profit-loss` is declared TWICE** in the Angular file (lines 29–33 and 69–73),
   both pointing to `ProfitLossComponent`. In Angular the first match wins, so the
   second declaration is **dead/unreachable**. → Defined **once** in React (no
   behavior change; the dead duplicate was simply not reproduced).
2. **`ledger` is an alias of `account-statement`** — both load
   `AccountStatementComponent`. This is intentional in Angular (two URLs, one
   screen). → **Both routes kept**, mapped to the same `AccountStatement` page.
   Note `ledger/:matchid` is a *different* component (`LedgerByMatchComponent` →
   `LedgerMatch`), so the three ledger-related URLs are: `ledger` (statement),
   `ledger/:matchid` (match ledger), distinct from `account-statement`.

No behavior was changed for these — only documented and de-duplicated where the
duplicate was already unreachable.

## Verification against MIGRATION_PLAN.md (§1 route inventory)

- All routes in the plan's table are present. ✅
- **Correction:** the plan's row #1 showed `/` → `/login`. The actual Angular config
  redirects `''` → **`/login-m`** (`pathMatch: 'full'`), and Step 7 explicitly
  requires the default to be `/login-m`. Implemented as `/login-m`.
- The plan deferred casino/poker/logs for *real* implementation (R5/R7). They are
  included here as **routable placeholders** so the URL surface is complete; their
  real UIs remain pending those scope decisions.
- `maintainance` is **commented out** in Angular (not a live route); not added. The
  maintenance state is handled in the auth init flow (Step 5).

## Implementation notes

- **Lazy loading:** every page via `React.lazy(() => import('../pages/X'))`, wrapped
  in a single `<Suspense fallback={<Loader/>}>` — mirrors Angular `loadComponent`.
- **Scroll restoration:** `<ScrollToTop/>` resets scroll to top on each pathname
  change (= `scrollPositionRestoration: 'top'`).
- **Guards:** public pages under `GuestRoute`; everything else under `ProtectedRoute`
  (→ `/login-m` when unauthenticated) inside the shared `AppLayout`.
- **Placeholders:** `PagePlaceholder` renders the title + a "migrated later" note;
  param pages echo their params so routing is verifiable end-to-end.
