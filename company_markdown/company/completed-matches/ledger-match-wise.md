# Ledger (Match-wise)

> **Menu path:** Sidebar → Completed Matches → (row) → Ledger button
> **Route:** `/company/ledger-match-wise`
> **Query params:** `name`, `matchId`, `userid`, `parentId`
> **Component:** `src/app/ledger-match-wise/ledger-match-wise.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![ledger-match-wise](screenshots/ledger-match-wise.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

> ✅ **Yeh route Company panel me registered hai** — `company-routing.module.ts` me `ledger-match-wise` path proper configured hai (`LedgerMatchWiseComponent`), yani yeh ek working page hai. (Note: completed-matches list page me jo "Ledger" button is route par jaata tha woh HTML me **comment-out** hai, isliye list se direct button click karke abhi nahi khulta jab tak uncomment na ho — par route khud kaam karta hai aur dusre flows / direct link se khulega. Saath me `ledger-match-summary` aur `ledger-tables` routes bhi registered hain.)

## Page kya karta hai (Purpose)

Yeh page ek user ka match-wise (ya overall, agar matchId blank ho) **chip/ledger history** dikhata hai — credit/debit entries ke saath narration.

## Screen pe kya dikhta hai (UI Layout)

- **Title:** username (`name` param se).
- **Table columns (`columns`):** `Date`, `narration`, `Credit`, `Debit`.
- **Paginator:** MatPaginator (client-side `MatTableDataSource`).
- **Modals / dialogs:** koi nahi.

## Sub-pages

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- User ki ledger entries (credit/debit) dekhna aur paginate karna (read-only).

## Data source (technical)

- **API:** `POST /chipHistoryID` (body `{ userId: params.userid, parentId: params.parentId, matchId }` — agar `matchId` blank ho to `null` bhejta hai) → `res.data`.
- **Socket:** koi nahi.
