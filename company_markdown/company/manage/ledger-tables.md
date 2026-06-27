# Ledger Tables

> **Menu path:** User Dashboard → Ledger (Account Statement)
> **Route:** `/company/ledger-tables`
> **Query params:** `userId`, `userTypeId`
> **Component:** `src/app/ledger-tables/ledger-tables.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![ledger-tables](screenshots/ledger-tables.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Ek user ka **ledger / account statement** table dikhata hai — date-wise transactions ki Credit, Debit aur Balance, Opening Balance aur totals ke saath. Structure Coin History jaisa hi hai, par yahan `accountType = '1'` (main/cash ledger type) ka account statement load hota hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Agent" heading + breadcrumb (Dashboard → SC → `{mstrname}` → Recieve Cash).
- **Top filter bar:**
  - Do **date inputs** (`type="date"`) aur ek **Search** button. _(Note: yeh date inputs aur Search button currently kisi model/handler se bound nahi hain — static UI; actual range internally fixed hai.)_
- **Internal defaults:** `fromDate` = aaj se -10 din, `toDate` = aaj, `accountType = '1'`, `transactionType = 'all'`.
- **List card:** "List" title.
- **Table columns:**
  - **#** — row index.
  - **Date** — `Sdate` (medium).
  - **User** — `mstrUserId`.
  - **Narration** — colour-coded: "deposit" → green, "withdraw" → red, warna dark.
  - **Credit** — green text.
  - **Debit** — red text.
  - **Balance** — `balance`.
- **Footer rows:**
  - **Opening Balance** — `openingBalance`.
  - **Total** — total Credit / total Debit (`dataService.getTotal()`).
- **Row click:** Agar row me `matchId` ho to `bet-history` par navigate (query params: `matchId`, `marketId`, `userId`, `username`, `fancyId`).

## Sub-pages (is page ke andar khulne wale pages)

- **bet-history** — row click pe (jab row me `matchId` ho) `{url}bet-history` par jaata hai bet-related query params ke saath.

## Actions (User kya kar sakta hai)

- **Row pe click** karke bet-history dekhna (jab `matchId` ho).
- **Search** — `search` field (SearchPipe) se table filter.
- _(Date filter inputs visually maujood hain par abhi non-functional / unbound hain — source quirk.)_

## Data source (technical)

- **API:**
  - `GET /accountStatement` — main data. Params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type` (`all`), `type` (`1`), `limit`. Response: `data[]`, `meta.total`/`current_page`/`per_page`, `openingBalance`.
  - `GET /users/{userId}` — `agentData` (mstrname etc.).
  - `GET /getChild?search=...` — child users search (debounced).
- **Socket:** Koi nahi.
