# Collection Report

> **Menu path:** Agent Match Dashboard → Collection Report
> **Route:** `/company/collection-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/collection-report/collection-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. -->
![collection-report](screenshots/collection-report.png)

> _Screenshot pending — placeholder._

> ℹ️ **Detail Live Matches version jaisa hi hai — dekhein [../live-matches/collection-report.md](../live-matches/collection-report.md).**

## Page kya karta hai (Purpose)

Match ke baad kis client se **paisa lena (Plus / Receiving)** hai aur kisko **dena (Minus / Paying)** hai uska collection summary dikhata hai. `Own`, `Cash`, `Own Commission` jaise internal entries filter karke hata diye jaate hain.

## Screen pe kya dikhta hai (UI Layout)

- **Receiving (Plus) table columns:** `clientName`, `currentBalance`.
- **Paying (Minus) table columns:** `clientName`, `currentBalance`.
- **Modals / dialogs:** koi nahi.

## Sub-pages
Koi sub-page nahi.

## Data source (technical)

- **API:** `POST /chipSummary` (body `{ mstrid, matchId }`) → `res.data` (`plusData` / `minusData`).
- **Socket:** koi nahi.
