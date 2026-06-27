# My Statement (Account Statement)

> **Menu path:** Sidebar → Manage Ledgers → My Stmt
> **Route:** `/company/report`
> **Query params:** `id=3`, `accTypeId=4` (Credit Limit account type pre-selected)
> **Component:** `src/app/report/report.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![my-statement](screenshots/my-statement.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## ⚠️ Single shared component

`report/report.component` ek hi shared component hai jo URL ke `id` query param ke hisaab se alag-alag report dikhata hai (`selectedBetType = id`). **My Stmt** ke liye **`id=3`** (Account Statement) use hota hai, aur is menu se `accTypeId=4` (Credit Limit) bhi pass hota hai (component me `accountType` me set ho jaata hai). Doosre id values: **1=Bet History, 2=Profit & Loss, 4=Login History, 5=Deleted Bet History, 6=Password History.**

## Page kya karta hai (Purpose)

Yeh page selected user (default "self" — yaani logged-in company user) ki **account statement** (ledger/credit-limit transactions) date range ke hisaab se dikhata hai — har entry par date, narration, credit, debit aur balance.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (client-side table filter) + Filter icon button (filter panel collapse/expand).
- **Report type dropdown (heading):** disabled mat-select jo "Account Statements List" dikhata hai.
- **Filter panel fields:**
  - **Select User** — searchable dropdown (`getChild` API, default "self").
  - **Type** — report type badalne ka dropdown.
  - **Transaction Type** — All / Debit (DR) / Credit (CR). _(sirf id=3 par)_
  - **Account Type** — All / Ledger (1) / Commission (2) / Settlement (3) / Credit Limit (4). _(sirf id=3; My Stmt se default Credit Limit = `accTypeId=4`)_
  - **From Date** (default aaj se 10 din pehle), **To Date** (default aaj).
- **Buttons:** **Load** — filters ke saath data fetch.
- **Table columns (id=3):** #, Date, User (`mstrUserId`), Description (Narration — deposit=green, withdraw=red; "loan" → "Open Account"), Cr (Credit, green), Dbt (Debit, red), Balance. Footer me total Credit aur total Debit.
- **Loading:** spinner; **Pagination:** mat-paginator (10/25/50/100); **No data:** "There is no data available."
- **Modals / dialogs:** koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi alag sub-page nahi (Account Statement variant me row par koi navigation active nahi hai).

## Actions (User kya kar sakta hai)

- User, Type, Transaction Type, Account Type, From/To date set karke **Load** se data fetch karna.
- Search box se table filter karna.
- Pagination se page/page-size badalna.

## Data source (technical)

- **API:** `GET /accountStatement` (params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type`, `type` (=accountType), `limit`). Response: `data`, `meta`, `openingBalance`.
- **Select User:** `GET /getChild` (search-based child list).
- **Socket:** koi nahi.
