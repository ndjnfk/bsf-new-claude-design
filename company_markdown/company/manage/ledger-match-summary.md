# Ledger Match Wise (Match Summary)

> **Menu path:** User Dashboard → Ledger Match Wise
> **Route:** `/company/ledger-match-summary`
> **Query params:** `name` (username), `userid`, `parentId`
> **Component:** `src/app/ledger-match-summary/ledger-match-summary.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![ledger-match-summary](screenshots/ledger-match-summary.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Ek user ka **match-wise ledger summary** dikhata hai — har match (narration) ke against Credit aur Debit ke totals, date ke saath. Yeh basically `/chipHistoryID` ka same data hai par yahan ek fixed `matchId: '1003'` ke saath match-summary view me dikhaya jaata hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Ledger Match Wise" heading + breadcrumb (Dashboard → Ledger Match Wise).
- **Section header:** "Match Summary".
- **Filters / inputs:** Koi active filter nahi. _(Type dropdown — ALL/Match/Single — source me commented out hai.)_
- **Table columns:**
  - **Date** — `EDate` (mediumDate format).
  - **Match Name** — `narration`.
  - **Credit** — `Credit` (number, 2 decimals).
  - **Debit** — `Debit` (number, 2 decimals).
- **Pagination:** Material paginator (page size 10/25/50/100, default 50).
- **Empty state:** "There is no data available."

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi. _(Row click se `ledger-match-wise` page kholne wala `openMatch()` method aur clickable row source me commented out hai — abhi rows clickable nahi hain.)_

## Actions (User kya kar sakta hai)

- **Pagination** se navigate karna — `fetchData(page, limit)`.
- _(`onTypeChange()` method maujood hai par dropdown commented hone se UI se trigger nahi hota.)_

## Data source (technical)

- **API:**
  - `POST /chipHistoryID` — match summary rows. Query params: `page`, `limit`. Body: `userId`, `parentId`, `filterType` (`selectedType`, default `ALL`), `matchId: '1003'` (hardcoded). Response: `data[]`, `meta.total`, `meta.perPage`.
- **Socket:** Koi nahi.

> _Tech note:_ `getUrlType()` helper (usertype → route prefix mapping) component me maujood hai, lekin currently sirf commented-out `openMatch()` navigation ke liye tha — active flow me use nahi hota.
