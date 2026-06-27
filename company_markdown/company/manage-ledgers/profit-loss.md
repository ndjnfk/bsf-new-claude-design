# Profit & Loss

> **Menu path:** Sidebar → Manage Ledgers → Profit & Loss
> **Route:** `/company/report`
> **Query params:** `id=2`
> **Component:** `src/app/report/report.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![profit-loss](screenshots/profit-loss.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## ⚠️ Single shared component

`report/report.component` ek hi shared component hai jo URL ke `id` query param ke hisaab se alag-alag report dikhata hai (`selectedBetType = id`). **Profit & Loss** ke liye **`id=2`** use hota hai. Doosre id values: **1=Bet History, 3=Account Statement (My Stmt), 4=Login History, 5=Deleted Bet History, 6=Password History.**

## Page kya karta hai (Purpose)

Yeh page selected user (default "self" — logged-in company user) ka **match-wise Profit & Loss** date range ke hisaab se dikhata hai. Upar sport-wise tabs hote hain, aur har match row ko expand karke uska **market-wise breakup** dekha jaa sakta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (client-side filter) + Filter icon button (filter panel collapse/expand).
- **Report type dropdown (heading):** disabled mat-select jo "Profit & Loss List" dikhata hai.
- **Filter panel fields:** Select User (`getChild`, default "self"), Type dropdown, From Date (default aaj se 10 din pehle), To Date (default aaj).
- **Buttons:** **Load** — filters ke saath data fetch.
- **Sport tabs:** "All" + har sport (`dataService.getSports()`). Tab change par `currentSportId` set ho kar P&L reload hota hai.
- **Table columns (id=2):** DATE/TIME (`settle_date`), Match Id, Match Title (`EventName`), PL (`PnL`, color coded), Comm (color coded), aur **Action** (expand +/-). Footer me total PL aur total Comm.
- **Row expand (inner table):** Market Name, PL, Comm, CreatedOn, aur **Show Bet** button — bet-history page par redirect (query: matchId, marketId, userId, username, fancyId).
- **Loading:** spinner; **Pagination:** mat-paginator (10/25/50/100); **No data:** "There is no data available."
- **Modals / dialogs:** koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

- **Bet History** — inner table ke "Show Bet" button se khulta hai (`[url]bet-history`, query params ke saath; yahan `url` = `/company`). Yeh us match/market ki bet list dikhata hai.

## Actions (User kya kar sakta hai)

- User aur From/To date set karke **Load** se data fetch karna.
- Sport tab badalna (All / specific sport).
- Match row expand (+) karke market-wise PL/Comm breakup dekhna.
- **Show Bet** se us market ki bet history par jaana.
- Search box se filter, pagination se page/page-size badalna.

## Data source (technical)

- **API:**
  - `POST /profitLoss` (body: `userId`, `fromDate`, `toDate`, `page`, `sportId`, `limit`) — match-wise P&L list.
  - `POST /profitLossByMatch` (body: `sportId`, `userId`, `matchId`, `fromDate`, `toDate`) — row expand par market-wise inner data.
  - `GET /getChild` — Select User searchable child list.
- **Sports list:** `dataService.getSports()` (tabs ke liye).
- **Socket:** koi nahi.
