# Session Bet Slip

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Session Bet Slip**
> **Route:** `/company/sessionbetslips`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/sessionbetslips/sessionbetslips.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)
> **Role:** Company (usetype `11`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![session-bet-slip](screenshots/session-bet-slip.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page ek match ke saare **Fancy / Session bets** ek single table me dikhata hai. Har session bet ki detail — session title (selectionName), runs (Odds), amount, No/Yes mode, No/Yes position, my-share aur final plus/minus — dikhti hai. User-wise aur Fancy(session)-wise filter aur pagination available hai. (Match-odds type bets ke liye alag [Bet Slips](bet-slips.md) page hai.)

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Session Bet Slips.
- **Top summary cards (4):** Total Bets, Settled Bets, Unsettled Bets, Reverted Bets (always 0). Values `counts` (`/bets` response) se.
- **Filters (2 dropdowns):**
  - **All User** — unique `UserName` (`onUserChange`).
  - **All Fancy** — unique session names `selectionName` (`onFancyChange`).
- **Bet Slips table columns:** `#` (serial), betId (`MstCode`), Date (`MstDate`), user (`UserName (mstrname)`), sessionTitle (`selectionName`), runs (`Odds`), amount (`Stack`), mode (Lay→No / else Yes), no (`-getNoValue`), yes (`getNoValue`), My Share (`myShare %`), noPosition, yesPosition (Lay/Back ke hisaab se `getMyShare`), status (Settled→Declared / else Pending), plusMinus (settled session bets ka result-based win/loss share).
- **Footer totals:** Total label, Total Amount (`Stack`), Total No, Total Yes, Total Share No/Yes, aur settled plus/minus total.
- **Pagination:** `mat-paginator`, page sizes 10/25/50/100.
- **Modals / dialogs:** Koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Session/fancy bets dekhna.
- User-wise aur Fancy(session)-wise filter karna.
- No/Yes position, my-share aur settled plus/minus dekhna.
- Pagination se aur bets load karna.

## Data source (technical)

- **API:** `GET /bets` (params: `matchId, page, search, afterResult=yes, limit, type=fancy`) — fancy bets + `counts` + pagination `meta`.
- Plus/minus aur position calculation client-side: `getNoValue`, `getMyShare`, `getTotalPlusMinus` (result `tblresult_result` vs bet `Odds`, Lay/Back ke combination par win/loss decide hota hai). My-share company (`mstrid`) ke aadhaar par.
- **Socket:** Koi nahi.
