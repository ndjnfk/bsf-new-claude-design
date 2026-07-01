# BSF2020 User Panel — Angular → React Migration Report

Final audit of the Angular 17 bettor "User Panel" migrated to a standalone React +
Vite + TypeScript app at `D:\new-bsf-tanya\user-panel`. The Angular source
(`D:\bsf-claude-fine_code\bsf GUI\bsf2020`) was used **read-only** and is unchanged.

## 1. Results at a glance

| Command | Result |
|---|---|
| `npm run lint` (`eslint . --max-warnings 0`) | ✅ **0 errors / 0 warnings** |
| `npm run test` (`vitest run`) | ✅ **95 passed / 95** across **27 files** |
| `npm run build` (`tsc && vite build`) | ✅ **success**, no warnings; per-page lazy chunks |

**Stack:** React 18 · Vite 5 · TypeScript 5 (strict) · React Router 6 · Zustand ·
React Hook Form + Zod · react-bootstrap + Bootstrap 5 (SCSS) · axios · socket.io-client ·
dayjs · qrcode.react · react-toastify · Vitest + Testing Library.

## 2. Quality gates (verified)

| Check | Status | Evidence |
|---|---|---|
| No jQuery dependency | ✅ | `$`/`jquery` appear only in explanatory comments; not in `package.json` |
| No unnecessary `any` | ✅ | `@typescript-eslint/no-explicit-any` enforced; grep finds none in `src` |
| No console errors/logs | ✅ | no `console.*` in `src`; tests show only RR v7 future-flag info warnings |
| No memory leaks | ✅ | every `setInterval` cleared on unmount (captcha 240s, event countdown); socket rooms left + `off()` on unmount |
| Direct route refresh | ✅ (dev/preview) | Vite SPA history fallback; see Known Limitations for static hosting |
| Responsive UI | ✅ | migrated `styles.scss` breakpoints + Bootstrap grid; `d-lg-none` bottom-tab bar |

## 3. Migrated features

- **Auth & init**: login (+ captcha, geo enrichment, exact payload), register (+ async
  username check), forgot-password → OTP → update-password, change-password,
  APP_INITIALIZER-equivalent session restore, domain branding (favicon/title), logout.
- **Shared layout**: Header, Sidebar, Footer, global loader, toasts, shared modals
  (open-bets, change-password, casino-transfer) — all React-state-driven.
- **Sports**: Home, In-Play (sport tabs, match cards, horse/greyhound), Userhome,
  Games List, Tournament, Results, Rules (+ welcome modal).
- **Live betting (Event)**: markets (Match Odds/Bookmaker/Toss/Tied), runners,
  fancy (session + line), bet slip (stake, quick stakes, 8s countdown, Run Changed),
  exact `bets/market` · `bets/fancy` · `bets/line` payloads, all profit/limit/position
  calculations verbatim, per-match socket rooms + live updates + cleanup.
- **Account**: account-statement, ledger, ledger/:matchid, bet-history, profit-loss
  (collapsible drill-down), login-history, password-history, logs, stake-value, setting.
- **Wallet**: wallet-home, deposit (QR, UTR/screenshot, FormData), withdraw
  (gateway-conditional dynamic form), request history (filters + view/screenshot
  modals), banks (CRUD + confirm modal).
- **Casino/Poker**: poker (+ limit gate), poker/detail/:id, pokerUrl, gamesPoker,
  kingCasino, gamesCasino, dreamCasino (+ game/:game_code), gamehubCasino
  (+ game/:gameId) — iframe launches, mobile/desktop URL, casino balance gate,
  category filters, banner carousel, React-controlled warning modal.

## 4. Angular → React mapping

| Angular | React |
|---|---|
| `ApiService` (HttpClient + interceptor) | `src/api/client.ts` (axios + interceptors), `src/api/http.ts` helpers |
| `environment.ts` | Vite env (`src/api/env.ts`, `.env`) |
| `SocketService` (ngx-socket-io) | `src/services/socket.ts` (singleton + `updateData/updateFancyData/updateLineFancyData` verbatim) + `src/hooks/useSocket.ts` |
| `BehaviorSubject` user/sports | Zustand stores (`store/auth.ts`, `store/sports.ts`, `store/layoutUi.ts`, `store/loader.ts`) |
| `AuthGuard` | `components/routing/ProtectedRoute.tsx` (+ `GuestRoute`) |
| `APP_INITIALIZER` → `init()` | `store/auth.ts → init()` run in `App.tsx` with loading gate |
| `@ngx-formly` dynamic forms | React Hook Form (+ Zod) with conditional rendering (`Withdraw`, `BankDetails`) |
| `*.component` (loadComponent) | `src/pages/*.tsx` via `React.lazy` |
| `RouterModule` (scrollPositionRestoration) | React Router 6 + `ScrollToTop` |
| `ngx-pagination` | `components/common/Pagination.tsx` |
| `ngx-owl-carousel-o` | react-bootstrap `Carousel` |
| `ng-qrcode` | `qrcode.react` |
| `ngx-toastr` | `react-toastify` |
| `SafeUrlPipe` (DomSanitizer) | `components/common/GameFrame.tsx` (`<iframe src>` — no script exec, no bypass needed) |
| `moment` | `dayjs` (`utils/format.ts`) |
| `UAParser` | `utils/device.ts` (`getDeviceInfo`/`isMobile`/`isDesktopDevice`) |
| jQuery modals / `body` classes | react-bootstrap `<Modal show>` + `useBodyClass` (state-driven) |

## 5. Route parity (all Angular routes present)

`/login-m`, `/login`, `/register`, `/home`, `/in-play`, `/profit-loss`,
`/event/:event_id/:market_id/:sport_id`, `/change-password`, `/account-statement`,
`/ledger`, `/ledger/:matchid`, `/bet-history`, `/stake-value`, `/deposit`, `/withdraw`,
`/wallet-home`, `/request`, `/banks`, `/poker`, `/poker/detail/:id`, `/pokerUrl`,
`/gamesPoker`, `/kingCasino`, `/gamesCasino`, `/dreamCasino`,
`/dreamCasino/game/:game_code`, `/gamehubCasino`, `/gamehubCasino/game/:gameId`,
`/password-history`, `/login-history`, `/rules`, `/userhome`, `/setting`, `/results`,
`/tournament`, `/gamesList`, `/logs` + `*` → NotFound, `/` → `/login-m`.
Duplicates reported in `ROUTES.md` (`profit-loss` declared twice; `ledger` aliases
`account-statement`). `/logs` is included (Angular kept it commented in nav only).

## 6. API endpoint & payload parity

Every endpoint and payload was preserved to the **Adonis contract** the Angular app
consumed (login, me, sports, dashboard, matches/markets/fancies, bets/*, accountStatement,
ledger, betHistory, profitLoss, getRequest, userBanks, deposit/withdraw, dream/gamehub/poker).
Exact payloads are asserted in tests for login, register, change-password, bet
placement (market), bet history, withdraw, and bank create. The service layer
(`src/api`, `src/services/*Api.ts`, `src/services/socket.ts`) is the **single swap
point** to repoint at the Go backend's `/api/user/*` + native `/ws` (see
`../MIGRATION_PLAN.md`).

## 7. Test coverage highlights (95 tests)

API client/interceptor, token, auth store (init/session/logout), Protected/Guest
routes, routing (default redirect, NotFound, params, lazy), socket service (connect
dedup, rooms, needReload, the three merge methods), event calculations (profit/limits/
position/book) + Event page (payload + duplicate-prevention), Home/Results/GamesList,
account pages (statement, bet-history LAGAI/params, change-password), wallet
(bank CRUD + delete modal, withdraw conditional + payload, fee calc), casino (limit
gate, Poker enabled/disabled, DreamCasino group/filter/modal), domain/format/observable.

## 8. Known limitations

1. **Backend contract**: the panel targets the **Adonis endpoint names** the Angular
   app used. Against the project's **Go backend** these 404 until the `/api/user/*`
   module + native-WS rooms are built. The service layer is the isolated swap point.
2. **Realtime transport**: uses `socket.io-client` to preserve the Angular contract;
   the Go backend speaks native WebSocket (`/ws`). `services/socket.ts` is the bridge
   point. Until wired, live odds won't flow (UI degrades gracefully).
3. **Component-scoped CSS / `assets/img/login`**: only the global `styles.scss` and
   `assets/{image,font,css}` were migrated (Step 3). Per-component `*.component.css`
   and the `assets/img/login` icon set were not, so fine spacing/animation and a few
   icons differ; structure + class hooks are in place (see `STYLE_MIGRATION.md`).
4. **Deferred sub-features** (documented in step reports): per-runner position display
   on the Event page (`getProfitLoss` ported + tested, not yet rendered), cashout,
   TV/scoreboard iframes; payment-gateway redirect (`depositNew`) beyond manual deposit;
   self-registration OTP/captcha provider; deposit `BANK_UPDATE`/`PAYMENT_UPDATE` sockets.
5. **Static hosting refresh**: BrowserRouter needs an SPA history fallback (serve
   `index.html` for unknown paths). Works in `vite dev`/`vite preview`; configure the
   host (or the Go backend) to fall back to `index.html`.

## 9. Manual testing checklist

Run `npm run dev` (proxies `/api` + `/ws` → `:8080`) against a backend exposing the
contract, then verify:

- [ ] App loads, shows loader, then `/login-m` (unauthenticated).
- [ ] Login with valid creds → redirect to `/rules` (welcome modal) or
      `/change-password` when forced; captcha refreshes; invalid captcha re-fetches.
- [ ] Refresh a deep URL (e.g. `/bet-history`) → stays on that page (session restored).
- [ ] Protected route while logged out → redirects to `/login-m`; logged-in user on
      `/login-m` → redirects to `/home`.
- [ ] Home/In-Play: sport tabs change `?sport_id=`; match cards link to the event.
- [ ] Event: open back/lay & yes/no slips; stake + quick stakes; profit updates; 8s
      countdown clears; place a bet (network payload matches); double-click places once;
      navigate away → socket rooms left (no leaks in console/network).
- [ ] Account pages: filters + pagination + date formats; profit-loss drill-down;
      change-password logs out on success.
- [ ] Wallet: deposit QR + UTR/screenshot validation; withdraw conditional fields per
      gateway; request history quick filters + view/screenshot modals; bank add/edit/
      delete (confirm modal).
- [ ] Casino/Poker: limit gate message vs iframe; dream/gamehub category filters +
      carousel; warning modal; game launches in iframe / new window.
- [ ] Mobile width: bottom tab bar, hamburger side menu, drawers, responsive tables.
- [ ] Console clean (no errors); no duplicate network calls on a single action.
