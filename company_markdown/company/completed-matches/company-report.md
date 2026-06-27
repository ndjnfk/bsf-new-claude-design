# Company Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Company Report
> **Route:** `/company/company-report`
> **Query params:** `matchId` (+ component `matchName` bhi padhta hai)
> **Component:** `src/app/company-report/company-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![company-report](screenshots/company-report.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

> ✅ **Yeh route Company panel me registered hai** — `company-routing.module.ts` me `company-report` path proper configured hai (`CompanyReportComponent`). Agent Match Dashboard ka button (`*ngIf="useType !== 0 && pageType != 'liveMatches'"`) click karne par yeh page normally khulta hai. (Note: super-duper-admin panel se ulta — wahan yeh route registered nahi.)

## Page kya karta hai (Purpose)

Yeh page ek match ke liye **company-level** profit/loss, commission aur share breakup dikhata hai (match + session combined, system PL, my share, company share).

## Screen pe kya dikhta hai (UI Layout)

- **Top header row (grouped):** `blank`, `PlusMinus`, `COMMISSION`, `OTHERS`.
- **Company table columns:** `cName`, `matchPlusMinus`, `sessionPlusMinus`, `total`, `sesStake`, `matchCommission`, `sessionCommission`, `totalCommission`, `systemPlusMinus`, `share`, `myShare`, `companyShare`.
- **Modals / dialogs:** koi nahi.

## Sub-pages

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Match ka company-level financial summary dekhna (read-only).

## Data source (technical)

- **API:** `GET /companyReport?userId={mstrid}&useType={useType}&matchId={matchId}` → response `res.data`. (`userId` aur `useType` logged-in user ke `authService.user.mstrid` / `usetype` se aate hain.)
- **Socket:** koi nahi.
