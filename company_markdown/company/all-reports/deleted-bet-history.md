# Deleted Bet History (Report id=5)

> **Menu path:** Sidebar → All Reports → Deleted Bet History
> **Route:** `/company/report?id=5`
> **Query params:** `id=5` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** Yeh wahi shared `report` component hai with `id=5` (Deleted Bet History). Component ke andar `selectedBetType = '5'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified current source se.)
>
> **Access:** Type dropdown me "Delete Bet History" option sirf tab dikhta hai jab `userTypeId === 0` ya `userTypeId === 11` ho. Company role **11** hai, isliye yeh report company panel me available hai.

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![deleted-bet-history](screenshots/deleted-bet-history.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Selected user ki delete/void ki gayi bets ka list dikhata hai. Layout bilkul Bet History (id=1) jaisa hai, sirf backend ko `type=0` bheja jaata hai (id=1 me `type=1` jaata hai) — isliye yeh deleted bets fetch karta hai. Yeh `report` component ka `id=5` variant hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Delete Bet History List".
- **Filters / inputs:**
  - **Select User**, **Type** dropdown, **From Date**, **To Date**, **Load** button.
  - **Match Status** — `id=5` (aur `id=1`) par dikhta hai: Matched (M) / Unmatched (U) / Past (P).
- **Table columns:** #, UserName, BetFor (Description badge + selection/market + Bet ID + "Matched"), Odds, Stack, PL (color coded), Date, Address (ip), Status. (Bet History jaisa hi.)
- **Footer:** "Total" row me total P_L (color coded).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- User, date range aur Match Status set karke "Load" karna.
- Search box se results filter karna.
- Pagination se page / page-size badalna.

## Data source (technical)

- **API:** `POST /betHistory` — wahi endpoint jo Bet History use karta hai, par `type: 0` (deleted) bheja jaata hai. Body: `user_id`, `from_date`, `to_date`, `type: 0`, `page_no`, `sport_id: '0'`, `bet_type` (= matchStatus), `limit`.
- `GET /getChild` — Select User list.
- **Socket:** Koi nahi.
