# Live Report (My Markets)

> **Menu path:** Sidebar → Live Matches → row ka **"LiveReport"** button **YA** match Title → Agent Match Dashboard → **Live Report**
> **Route:** `/company/my-markets`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchStartDate`
> **Component:** `src/app/my-markets/my-markets.component.ts` (+ `.html`) — sub-panels: `src/app/my-markets/fancies/fancies.component.*` aur `src/app/my-markets/line/line.component.*`
> **Parent page:** [Live Matches](live-matches.md) (aur [Agent Match Dashboard](agent-match-dashboard.md) se bhi khulta hai)
> **Role:** Company (usetype `11`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![live-report](screenshots/live-report.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh match ka main **live management / monitoring dashboard** hai. Ek single match ke saare markets (Match Odds, Bookmaker, Toss, Goals, manual markets) real-time odds ke saath dikhte hain, plus cricket me Fancy aur Line sessions. Yahan se live odds dekhna, markets/users block karna, saari category ke bets browse karna possible hai. Data socket par live update hota rehta hai aur har 5 second me bets refresh hote hain.

> Note: Yeh wahi page hai jo Live Matches list ke "LiveReport" button se bhi khulta hai aur Agent Match Dashboard ke "Live Report" button se bhi.
>
> **Role note (Company, usetype 11):** Kaafi management controls `usetype == 0` (super-duper-admin) ke liye gated hain — match name card aur uske action icons (match active toggle, in-play, manual market controls, Add Market, Declare Result wagairah me se kayi) company role ke liye nahi dikhte. Company role ke liye mainly **Block user** (`person_off`, usetype `0/11`) aur **Company-level Fancy settings** (`usetype 11`) wale controls relevant hote hain, plus saare odds/positions/bets ka read-only monitoring.

## Screen pe kya dikhta hai (UI Layout)

### Title / breadcrumb
- Heading **"LIVE MATCH REPORT"**. Breadcrumb: Dashboard → Matches → Live Report.

### Header info / match info bar
- **Score board iframe** (upar): `scoreUrl` (`matchId` ke aadhaar par), height ~145.
- **Live TV** toggle: TV icon par click se live TV iframe khulta/band hota hai (`getLiveTv()` / `closeTv()`), source `matchData.tvUrl`.
- **Match name card** (sirf `usetype == 0` ko — company role me nahi dikhta): match naam + date aur match-level action icons (match active toggle, in-play, Fancy/Toss/Bookmaker on-off, Goals market, Match Settings, Add Market). Company ke liye `person_off` **Block user** icon visible rehta hai (usetype `0/11`).

### Markets cards (har market ka ek panel)
- **Toolbar:** market_name + (Min/Max stack agar set ho).
- **Manual market controls** (sirf usetype 0, is_manual==1 — company role me nahi): Ball Running, Suspend, diff value, In-play alarm, multiplier buttons.
- **Right side buttons:** market active toggle, **Declare Result** trophy icon, Market Settings — yeh mostly usetype 0 ke liye; company ke liye **Block user** aur **Book** icon (user position modal, `getUserPositionModal`) relevant.
- **Odds table columns:** RUNNER, LAGAI (back0), KHAI (lay0; Toss me 0), POSITION (`odds.pl`). Suspend/Lock overlay jab runner/market ACTIVE na ho.

### Fancy panel (`app-fancies`) — sirf SportID 4, 6, ya 11
- "Fancy" toolbar + tabs All / Session(Line) / Result Waiting (usetype 0), diff value, **Company settings (usetype 11 — company role ke liye visible)**, Add Fancy (+, usetype 0).
- **Columns:** SESSION (HeadName + liability + controls), No (lay), Yes (back), Pos NO, Pos Yes, Action (POSITION button).

### Line panel (`app-line`)
- Cricket line/session markets ka panel (`app-line`), fancy-jaisa No/Yes structure.

### Tables
- **Declared Sessions** — SESSION / Result / Status (PnL) + Total footer + paginator.
- **Declared Toss** (jab toss declared ho) — MARKET / Result / POSITION + total.
- **Current User Position** — Account (drill-down) / TeamA / TeamB / The Draw (3 runners ho to).

### Bets section
- **Bet type tabs** (usetype != 55): All (disabled), Bookmaker Bets, Fancy Bets (sportId 4), Toss Bets, Tied Bets, Match Bets, Goal Bets, + (usetype 0 ke liye) Delete BM Bets / Delete Fncy Bets.
- **Search** input (debounced).
- **Bets table columns:** Action (Delete / Revoke — mostly usetype 0), Username (→ parents), BetFor, Odds, Stack, PL, Date, Address (ip). Paginator.

### Modals / dialogs
- Current User Position, Parents, Block User, Settings (match + market formly), Add Bet (manual), Declare Result, Add Market. Fancy panel ke apne modals bhi (Add Bet, Fancy Bets, Score Position, Result, Add Fancy, Block User, Settings, Parents). Company role ke liye mainly Block User, Current User Position, Parents aur (Fancy) Company Settings relevant.

## Sub-pages (is page ke andar khulne wale pages)

Koi alag route-level sub-page nahi. Andar `app-fancies` aur `app-line` child components embedded hain, aur kaafi modal/dialog hain (upar list kiye).

## Actions (User kya kar sakta hai)

- Live score board aur live TV dekhna.
- Per-market odds, position aur saari category ke bets monitor karna.
- Users ko match/market/fancy level par block/unblock karna (Block User).
- Fancy panel par Company-level settings dekhna/update karna (usetype 11).
- Account-wise user position aur parents dekhna; Declared Sessions/Toss/Fancy positions dekhna.
- (Match/market/result declare, manual market, add market jaise admin-only controls usetype 0 ke liye hi hain — company role me hidden.)

## Data source (technical)

### my-markets endpoints
- `GET /matches/{matchId}` (+ marketId) — match detail; `GET /matches/{matchId}/markets` — markets + runners.
- `GET /getBetLock`, `GET /declaredResults/toss`.
- Bets (tab-wise): `GET /bookmakerBets`, `/fancyBets`, `/tossBets`, `/tiedMatchBets`, `/matchOddsBets`, `/goalsBets`, `/bookmakerDeletedBets`, `/fancyDeletedBets`.
- `POST /plByMarket` (positions), `POST /profitLossByMatch` (declared sessions), `POST /removeBet`, `POST /revokeBet`, `POST /getParents`.
- Block: `GET/POST /blockedMatchUsers`, `GET/POST /blockedMarketUsers`; `POST /blockedMatches`.
- (Admin-only, usetype 0) `POST /toggleManualActivation`, `PUT /matches/{MstCode}`, `PUT /markets/{marketId}` (settings), `POST /manualMarketBet`, `POST /addBookmaker`, `POST /removeBookmaker`, `POST /activateFancy`, `POST /deActivateFancy`, `POST /results`, `POST /manualMarket`, `POST /addGoalMarkets`, `POST /setBetLock`, `GET /allUsers`.

### Fancy panel (fancies.component)
- `GET /matches/{matchId}/fancies`, `POST /fancyLiability`, `GET /fancyBets`, `GET /allUsers`, block `GET/POST`, `POST /toggleManualActivation`, `PUT` settings, fancy result `POST`, `POST /addManualFancy`, manual fancy bet `POST`. (Company role ke liye mainly read + block + company settings.)

### Socket events
- **emit:** `UPDATE_MARKETS`, `room` (`MARKET_UPDATE_DATA:{matchId}`, `BETS_UPDATE_DATA:{mstrid}_{matchId}`), `MANUAL_DATA`.
- **on:** `UPDATE_MARKETS{matchId}`, `BETS_UPDATE_DATA:{mstrid}_{matchId}`, `MARKET_UPDATE_DATA:{matchId}`, `message` (live odds stream).
- **Line/Fancy:** emit `UPDATE_FANCY`, `room` (`FANCY{matchId}`), `MANUAL_FANCY_DATA`; on `UPDATE_FANCY{matchId}`, `message`, `LINE_BOOK_UPDATE:{mstrid}:{matchId}`.
- **Polling:** har 5 sec me `getBets()`.
