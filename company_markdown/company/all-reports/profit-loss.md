# Profit & Loss (Report id=2)

> **Menu path:** Sidebar → All Reports → Profit & Loss
> **Route:** `/company/report?id=2`
> **Query params:** `id=2` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** Yeh wahi shared `report` component hai with `id=2` (Profit & Loss). Component ke andar `selectedBetType = '2'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified current source se.)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![profit-loss](screenshots/profit-loss.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Selected user ka match-wise Profit & Loss aur Commission summary dikhata hai. Sport ke hisaab se tabs hote hain, aur har match row ko expand karke uska market-wise breakup dekha ja sakta hai. Yeh `report` component ka `id=2` variant hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Profit & Loss List".
- **Filters / inputs:** Select User, Type dropdown, From Date, To Date, Load button. (Transaction Type / Account Type / Match Status yahan nahi dikhte.)
- **Sport tabs:** table ke upar nav bar — "All" + har sport ka tab. Tab change par `currentSportId` set hokar data reload hota hai.
- **Table columns:** DATE/TIME (settle_date), Match Id, Match Title (EventName), PL (PnL, color coded), Comm (color coded), Action (expand +/- button).
- **Expand (inner table):** row expand karne par market-wise table — Market Name, PL, Comm, CreatedOn (MstDate), Action ("Show Bet" button jo `/company/bet-history` page par redirect karta hai matchId/marketId/userId/username/fancyId query params ke saath).
- **Footer:** Total PL aur Total Comm (color coded).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

## Sub-pages (is page ke andar khulne wale pages)

- [Bet History](bet-history.md) — inner table ke "Show Bet" button se khulta hai (us match/market ki specific bets dekhne ke liye; route `/company/bet-history`).

## Actions (User kya kar sakta hai)

- User / date range set karke "Load" karna.
- Sport tab badalna.
- Match row expand (+) karke market-wise PL/Comm dekhna.
- "Show Bet" se us market ki bet history dekhna.
- Search aur pagination use karna.

## Data source (technical)

- **API:** `POST /profitLoss` — body: `userId`, `fromDate`, `toDate`, `page`, `sportId` (= currentSportId), `limit`.
- `POST /profitLossByMatch` — row expand par market-wise data (body: `sportId`, `userId`, `matchId`, `fromDate`, `toDate`).
- `GET /getChild` — Select User list. Sports list `dataService.getSports()` se (tabs ke liye).
- **Socket:** Koi nahi.
