# Coin History

> **Menu path:** User Dashboard → Coin History
> **Route:** `/company/coinHistory`
> **Query params:** `userId`, `userTypeId`
> **Component:** `src/app/coin-history/coin-history.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![coin-history](screenshots/coin-history.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Ek user ka **coin/chip transaction history (account statement)** dikhata hai — date-wise har deposit/withdraw/transaction ki Credit, Debit aur Balance. Footer me Opening Balance aur total Credit/Debit show hota hai. Yeh `accountType = '4'` (coin/changelog type) ke account statement par based hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Coin History" heading + breadcrumb (Dashboard → CLIENTS → `{mstrname}` → Coin History).
- **Card title:** "`{mstrname}` Current User Changelog Details".
- **Filters / inputs:** UI me explicit filter controls render nahi hote. Internally default range set hota hai — `fromDate` = aaj se -10 din, `toDate` = aaj; `accountType = '4'`, `transactionType = 'all'`. _(User-search/date-picker logic component me maujood hai par is template me bound nahi.)_
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
  - **Total** — total Credit (green) aur total Debit (red), `dataService.getTotal()` se calculate.
- **Row click:** Agar row me `matchId` ho to `bet-history` page par navigate karta hai (query params: `matchId`, `marketId`, `userId`, `username`, `fancyId`).

## Sub-pages (is page ke andar khulne wale pages)

- **bet-history** — row click pe (jab row me `matchId` ho) `{url}bet-history` par jaata hai with bet-related query params. _(Yeh company panel ke route prefix ke saath khulta hai; alag detailed doc us page ke liye hai.)_

## Actions (User kya kar sakta hai)

- **Row pe click** karke us match/market ki bet-history dekhna (jab `matchId` available ho).
- **Search** — `search` field (SearchPipe) table data filter karta hai (template me search input bound hai pipe ke through).

## Data source (technical)

- **API:**
  - `GET /accountStatement` — main data. Params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type` (`all`), `type` (`4`), `limit`. Response: `data[]`, `meta.total`/`current_page`/`per_page`, `openingBalance`.
  - `GET /users/{userId}` — `agentData` (mstrname etc.) ke liye.
  - `GET /getChild?search=...` — child users search (debounced) for user dropdown logic.
- **Socket:** Koi nahi.
