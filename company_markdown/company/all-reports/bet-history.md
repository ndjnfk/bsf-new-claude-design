# Bet History (Report id=1)

> **Menu path:** Sidebar → All Reports → Bet History
> **Route:** `/company/report?id=1`
> **Query params:** `id=1` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_. Profit & Loss ke "Show Bet" se aaye to extra: `matchId`, `marketId`, `userId`, `username`, `fancyId`.
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** Yeh ek hi shared `report` component hai jo `id` query param ke hisaab se 6 alag reports dikhata hai. Is page par `id=1` hai (Bet History). Component ke andar `selectedBetType = '1'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified current source se.)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![bet-history](screenshots/bet-history.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Selected user aur date range ke andar lagayi gayi sabhi (active) bets ka list dikhata hai — kis market/selection par, kitne odds aur stack par bet lagi, uska P/L kya raha. Yeh `report` component ka `id=1` variant hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (table data ko client-side filter karta hai) + Filter icon button (filter panel collapse/expand).
- **Report type label (heading):** disabled dropdown jo "Bet History List" dikhata hai.
- **Filters / inputs:**
  - **Select User** — searchable dropdown (`getChild` API; default "self").
  - **Type** — report type badalne ka dropdown (yahan Bet History selected).
  - **From Date** — date picker (default aaj se 10 din pehle).
  - **To Date** — date picker (default aaj).
  - **Match Status** — `id=1` (aur `id=5`) par hi dikhta hai: Matched (M) / Unmatched (U) / Past (P). Default Matched.
- **Buttons:** "Load" — selected filters ke saath data fetch.
- **Table columns:** #, UserName, BetFor (Description badge + selection/market name + Bet ID + "Matched"), Odds, Stack, PL (positive=green / negative=red), Date, Address (ip), Status. Back/Lay rows alag color (`lay0`/`back0`).
- **Footer:** "Total" row me sabhi visible rows ka total P_L (color coded).
- **Loading:** table par spinner jab data load ho raha ho.
- **Pagination:** mat-paginator (page size 10/25/50/100).
- **No data:** "There is no data available." message.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi. (Sirf `id` change karne par yahi component dusra report variant dikhata hai.)

## Actions (User kya kar sakta hai)

- User select karna, From/To date set karna, Match Status (M/U/P) chunna.
- "Load" se data fetch karna.
- Search box se results filter karna.
- Pagination se page / page-size badalna.
- Type dropdown se dusre report par switch karna.

## Data source (technical)

- **API:** `POST /betHistory` — body: `user_id`, `from_date`, `to_date`, `type: 1` (id=1 ke liye), `page_no`, `sport_id: '0'`, `bet_type` (= matchStatus M/U/P), `limit`.
- `GET /getChild` — Select User dropdown ki searchable child list.
- **Socket:** Koi nahi.
