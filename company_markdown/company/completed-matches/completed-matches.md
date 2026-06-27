# Completed Matches

> **Menu path:** Sidebar → Completed Matches
> **Route:** `/company/completedMatchesList`
> **Query params:** koi nahi
> **Component:** `src/app/completed-matches-list/completed-matches-list.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![completed-matches](screenshots/completed-matches.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page settle ho chuke (completed) matches ka profit/loss report date-range aur sport ke hisaab se dikhata hai. Har match row ko expand karke uska market-wise PL/Comm dekha ja sakta hai, aur waha se bet history bhi kholi ja sakti hai. Cricket (sport_id == 4) match ke title par click karke uska **Agent Match Dashboard** (settled match hub) khulta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches" — breadcrumb: Dashboard → Matches.
- **Filters / inputs:**
  - `From Date` — date picker (default: aaj se 10 din pehle / `dayjs().add(-10,'days')`).
  - `To Date` — date picker (default: aaj).
- **Buttons:**
  - `Load` — selected date range ka data reload karta hai (`getTypeData(1)`).
  - Sport tabs (`All` + har sport ka naam) — sport-wise filter; tab click par data reload. Default sport `currentSportId = 4` (cricket).
  - Expand button (`add` / `remove` icon) — row expand karke market-wise detail laata hai (`innercollapse`).
- **Table columns (outer):** `DATE/TIME` (settle_date), `Match Id` (matchId), `Match Title` (EventName — sirf cricket `sport_id == 4` me clickable link → `live-game-detials`), `Won By` (declaredResult.selectionName), `PL` (PnL, green/red), `Comm` (green/red). Footer row: `Total` + TotalPL + TotalComm.
- **Inner (expanded) table columns:** `Market Name`, `PL`, `Comm`, `CreatedOn` (MstDate), `Action` (`Show Bet` button → `bet-history`).
- **Loader:** `mat-spinner` jab data load ho raha ho.
- **Modals / dialogs:** Koi dialog nahi — sirf inline expandable rows.

> ℹ️ Note: List me ek "Ledger" button code me maujood hai par **comment-out** kiya gaya hai (`ledger-match-wise` link). Company panel me `ledger-match-wise` route to **registered** hai (dekhein ledger-match-wise.md), par list page ka yeh particular button abhi commented hai — yani is page se Ledger button click karke nahi khulta jab tak uncomment na ho.

## Sub-pages (is page ke andar khulne wale pages)

- [Agent Match Dashboard](agent-match-dashboard.md) — cricket match title par click karne par khulta hai (settled match hub, saare report buttons).
- [Bet History](bet-history.md) — expanded inner table ke `Show Bet` button se khulta hai.
- [Ledger (match-wise)](ledger-match-wise.md) — Company panel me route registered hai (working page); is list ka direct button filhaal comment-out.

## Actions (User kya kar sakta hai)

- From/To date select karke `Load` se report nikalna.
- Sport tabs se sport-wise (ya All) filter karna.
- Kisi match ko expand karke market-wise PL/Comm detail dekhna.
- Cricket match title par click karke Agent Match Dashboard kholna.
- Expanded row se `Show Bet` par click karke user ki bet history dekhna.
- Footer me total PL aur total Comm dekhna.

## Data source (technical)

- **API:**
  - `POST /profitLoss` (body `{ userId, fromDate, toDate, page, sportId, limit }`) — completed matches PL list (paginated; `meta` me total/current_page/per_page).
  - `POST /profitLossByMatch` (body `{ sportId, userId, matchId, fromDate, toDate }`) — expand par market-wise detail.
  - Sports list `dataService.getSports()` se aati hai.
- **Socket:** koi nahi.
