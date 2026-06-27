# Collection Report

> **Menu path:** Sidebar → Manage Ledgers → Collection Report
> **Route:** `/company/collection-report-all`
> **Component:** `src/app/collection-report-all/collection-report-all.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![collection-report](screenshots/collection-report.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page users ki balance position **teen groups** me dikhata hai — Minus (Lena hai), Plus (Dena hai) aur Zero (Clear hai). Har group ek table hota hai jisme user ka naam aur amount aata hai, aur user par click karke uske dashboard par jaa sakte hain.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Collection Report" heading, breadcrumb: Dashboard → Collection Report.
- **Teen sections (ibox cards), har ek me ek table:**
  - **Minus Users (LENA HAI)** — `balanceType: 'minus'`
  - **Plus Users (DENA HAI)** — `balanceType: 'plus'`
  - **Zero Users (CLEAR HAI)** — `balanceType: 'zero'`
- **Table columns (har section):**
  - **Name** — `username (name)`, clickable link.
  - **Amount** — 2 decimal (`number:'1.2-2'`).
  - Footer me **Total** amount (`dataService.getTotal`).
- **No data:** row me "No data".
- Koi filter/search input ya button nahi (page load par hi data aa jaata hai).
- **Modals / dialogs:** koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Alag route wala koi sub-page doc nahi, lekin **Name link par click karne par** user ke **User Dashboard** par navigate hota hai:
`[url]/user-dashboard` query params ke saath — `userId`, `userTypeId` (= `usetype`), `directRouteToCollectionReport: true`, `parentId`. Yahan `url` company panel ka base hota hai (`dataService.url`, yaani `/company`). Yeh us user ke ledger me drill-down ke liye hai.

## Actions (User kya kar sakta hai)

- Teeno groups (Minus/Plus/Zero) ke users aur unke amounts dekhna.
- User name par click karke uske User Dashboard (collection report context) par jaana.
- Har section ka Total amount dekhna.

## Data source (technical)

- **API:** `GET /collectionReport` — `minusUsers` / `plusUsers` / `zeroUsers` data. Response me ya to seedhe yeh keys aate hain, ya `_users_balance` (ya `data`) array me `balanceType` field ke hisaab se filter hota hai (`getSectionData`).
- **Socket:** koi nahi.
