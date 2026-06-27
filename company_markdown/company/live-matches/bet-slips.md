# Bet Slips

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Bet Slips**
> **Route:** `/company/betslips-tables`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`
> **Component:** `src/app/betslips-tables/betslips-tables.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)
> **Role:** Company (usetype `11`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![bet-slips](screenshots/bet-slips.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page ek match ke **match-odds type markets** (Match Odds, Bookmaker, Toss, Tied, Goals etc.) ke saare bets ek market-wise tab layout me dikhata hai. Har market tab par us market ki **Market Position** (runner-wise P/L) aur **Bet Slips table** (har bet ki detail, runner-wise position, my-share aur final plus/minus) milti hai. User-wise filter aur pagination bhi hai. (Yeh fancy/session bets ke liye nahi — uske liye Session Bet Slip page hai.)

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Bet Slips.
- **Top summary cards (4):** Total Bets, Settled Bets, Unsettled Bets, Reverted Bets (always 0). Values `counts` (`/bets` response) se. (Selected tab ke andar bhi yahi 4 cards us market ke `settled_bets_count`/`unsettled_bets_count` ke saath repeat hote hain.)
- **Market tabs (nav-tabs):** `tabs` = sabhi markets ke `market_name`. Tab click → us market ka data load (`selectTab`).
- **User filter:** "All User" dropdown — selected market ke bets me se unique `UserName` (`onUserChange`).
- **Market Position table:** columns — RUNNER (`selectionName`), POSITION (`winValue + lossValue`). Data `POST /plByMarket` se.
- **Bet Slips table columns:** `#` (serial), Date (`MstDate`), Market Title (`marketName`), Rate (`Odds`), Amount (`Stack`), Mode (Lay→KHAI / else LAGAI), Runner Name (`selectionName`), user (`UserName (mstrname)`), **per-runner Position columns** (`Position{n}` — runner-wise value via `getRunnerValue`), My Share (`myShare %`), **per-runner Share columns** (`Share{n}` — via `getMyShare`), status (Settled→Declared badge / else Pending), plusMinus (settled bets ka final share). Footer me Amount total, runner totals, share totals, aur settled plus/minus total.
- **Pagination:** `mat-paginator`, page sizes 10/25/50/100.
- **Modals / dialogs:** Koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Market tabs switch karke har market ke bets dekhna.
- User-wise bets filter karna.
- Market position, runner-wise position aur my-share dekhna.
- Settled/unsettled status aur plus-minus dekhna.
- Pagination se aur bets load karna.

## Data source (technical)

- **API:** `GET /matches/{matchId}/markets` (markets + tabs + runner_json), `POST /plByMarket` (`matchId`, `MarketId[]`) — market position, `GET /bets` (params: `matchId, marketId, page, search, afterResult=yes, limit`) — bets + `counts` + pagination `meta`.
- My-share calculation client-side hota hai (`getMyShare`) login user (company, `mstrid`) aur bet ke share hierarchy (Company/Admin/SAdmin/SMaster/Master/Dealer) ke aadhaar par.
- **Socket:** Koi nahi.
