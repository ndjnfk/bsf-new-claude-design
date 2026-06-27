# Bet History (Show Bet)

> **Menu path:** Sidebar → Completed Matches → (match row expand) → Show Bet button
> **Route:** `/company/bet-history`
> **Query params:** `matchId`, `marketId`, `userId`, `username`, `fancyId`
> **Component:** `src/app/bet-history/bet-history.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![bet-history](screenshots/bet-history.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page ek user (aur uske niche agents) ka kisi market/fancy par bet history dikhata hai, saath me **Plus Account** aur **Minus Account** ka chip distribution. Plus/Minus tables me agent par click karke uske niche drill-down kiya ja sakta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** `data[0].Description` (market/match description) — breadcrumb: Dashboard → {Description}.
- **Plus Account table** (green toolbar): columns `User`, `Account` (mstrname), `Chip` (PUsum) + footer Total. Agar viewing user khud na ho to `undo`/reset button.
- **Minus Account table:** columns `User`, `Account` (mstrname), `Chip` (Musum) + footer Total.
- **Bet list table** (`column3`): `#`, `UserName`, `selectionName`, `Odds`, `Stack`, `PL`, `Date`, `ip`, `STATUS`.
- **Drill-down:** Plus/Minus table me agent name par click → us agent ka plus/minus (`initPlusMinus`).
- **Modals / dialogs:** koi nahi.

## Sub-pages

Koi sub-page nahi (inline drill-down hota hai).

## Actions (User kya kar sakta hai)

- Market/fancy ke saare bets dekhna (odds, stack, PL, status, IP).
- Plus/Minus account me kisi agent par click karke uske niche ka distribution dekhna.
- Reset (`undo`) se wapas original user par aana.

## Data source (technical)

- **API:**
  - `POST /showBet` (body `{ matchId, MarketId, fancyId, userId }`) → `value.data` (bet list).
  - `POST /adjustAc` (body `{ userId, matchId, MarketId, fancyId }`) → `data.plusData` / `data.minusData`.
- **Socket:** koi nahi.
