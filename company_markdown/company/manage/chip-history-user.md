# Client Ledger (Chip History User)

> **Menu path:** User Dashboard → Ledger / Cash Ledger
> **Route:** `/company/chip-history-user`
> **Query params:** `name` (username), `userid`, `parentId`, `typeId`, `matchId` _(optional)_, `filterType` _(optional, default `ALL`; values `Match` / `Single`)_
> **Component:** `src/app/chip-history-user/chip-history-user.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![chip-history-user](screenshots/chip-history-user.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Ek specific user ka **Client Ledger** (cash ledger) dikhata hai — date-wise narration ke saath Credit, Debit aur running Balance. "Upper | Settlement" wali entries ko smartly "Receive Cash" / "Pay Cash" label ke saath highlight karta hai. Data paginated hai aur match-wise filter ho sakta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Client Ledger" heading + breadcrumb (Dashboard → Client Ledger).
- **List header:** "List" title ke saath.
- **Filters / inputs:**
  - **Type dropdown** — sirf tab dikhta hai jab `matchId` query param set ho. Options: **Match**, **Single** (`selectedType`). Change pe URL ka `filterType` update hota hai aur data refresh.
- **Table columns:**
  - **Date** — `EDate` (medium format).
  - **Narration** — special handling:
    - Agar "Upper | Settlement" se start ho aur `Credit > 0` → "**Receive Cash |**" prefix ke saath formatted narration.
    - Agar "Upper | Settlement" se start ho aur `Debit > 0` → "**Pay Cash |**" prefix.
    - Warna plain narration.
  - **Credit** — `Credit`.
  - **Debit** — `Debit`.
  - **Balance** — `Balance` (running balance).
  - _(Note: source me "Selection" / "action match-wise" columns commented out hain — active nahi.)_
- **Buttons:** Koi action button active nahi (match-wise button commented out hai).
- **Pagination:** Material paginator (page size options 10/25/50/100, default 50).
- **Empty state:** "There is no data available." jab koi row na ho.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi. _(`matchDetails()` method sirf same page ka `matchId`/`filterType` query param update karta hai, koi alag page nahi kholta. Match-wise navigation button currently commented out hai.)_

## Actions (User kya kar sakta hai)

- **Type filter** badalna (Match/Single) jab match context ho — `onTypeChange()` URL update + `fetchData()`.
- **Pagination** se aage-peeche jaana — `fetchData(page, limit)`.

## Data source (technical)

- **API:**
  - `POST /chipHistoryID` — ledger rows fetch. Query params: `page`, `limit`. Body: `userId`, `parentId`, `matchId` (ya `null`), `filterType`, `typeId` (number). Response: `data[]`, `meta.total`, `meta.perPage`.
- **Socket:** Koi nahi.
