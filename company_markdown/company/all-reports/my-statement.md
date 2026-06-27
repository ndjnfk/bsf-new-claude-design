# My Statement / Account Statement (Report id=3)

> **Menu path:** Sidebar → All Reports → My Stmt (Account Statements)
> **Route:** `/company/report?id=3`
> **Query params:** `id=3` (required), `userTypeId` _(optional)_, `accTypeId` _(optional, Account Type pre-select karta hai)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** Yeh wahi shared `report` component hai with `id=3` (Account Statement / My Stmt). Component ke andar `selectedBetType = '3'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified current source se.)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![my-statement](screenshots/my-statement.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Selected user ka account ledger / statement dikhata hai — date-wise credit/debit entries with narration aur running balance. Transaction Type aur Account Type filter se entries narrow ho jaati hain. Yeh `report` component ka `id=3` variant hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button (filter panel collapse/expand).
- **Report type label:** disabled dropdown "Account Statements List".
- **Filters / inputs (id=3 ke extra filters):**
  - **Select User** — searchable dropdown (`getChild` API; default "self").
  - **Type** — report type dropdown (yahan Account Statements selected).
  - **Transaction Type** — All / Debit (DR) / Credit (CR). _(Sirf id=3 par dikhta hai.)_
  - **Account Type** — All / Ledger (1) / Commission (2) / Settlement (3) / Credit Limit (4). _(Sirf id=3 par; `accTypeId` query param se pre-select ho sakta hai.)_
  - **From Date** (default aaj se 10 din pehle), **To Date** (default aaj), **Load** button.
- **Table columns:** #, Date (Sdate), User (mstrUserId), Description (Narration — "deposit"=green, "withdraw"=red, baaki dark; "loan" text ko "Open Account" me replace karke dikhata hai), Cr (Credit, green), Dbt (Debit, red), Balance.
- **Footer:** "Total" row me Total Credit (green) aur Total Debit (red).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- User, From/To date, Transaction Type aur Account Type set karke "Load" karna.
- Search box se entries filter karna (client-side).
- Pagination se page / page-size badalna.
- Type dropdown se dusre report par switch karna.

## Data source (technical)

- **API:** `GET /accountStatement` — query params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type` (all/DR/CR), `type` (= accountType all/1/2/3/4), `limit`. Response me `openingBalance` bhi aata hai.
- `GET /getChild` — Select User searchable list (debounced search).
- **Socket:** Koi nahi.
