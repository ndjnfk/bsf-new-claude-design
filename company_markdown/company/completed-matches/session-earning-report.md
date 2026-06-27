# Session Earning Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Session Earning Report
> **Route:** `/company/session-earning-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/session-earning-report/session-earning-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![session-earning-report](screenshots/session-earning-report.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page ek match ke **session (fancy) earnings** ka agent-wise report dikhata hai — session PL, session commission, net total, share amount aur final.

> ℹ️ Note: Component me purana code commented hai jo `GET /sessionEarningReport` use karta tha aur usetype 11/10/9/8/1/2/3 wise alag tables banata tha. **Active code** ab `GET /agentReport` se data laata hai (Client Report wala hi endpoint), filhaal raw `data` array me.

## Screen pe kya dikhta hai (UI Layout)

- **Table columns (`column1`):** `UserNm`, `Session`, `CommSession`, `netTotal`, `shrAmt`, `final`.
- **Modals / dialogs:** koi nahi.

## Sub-pages

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Match ke session/fancy earning ka agent-wise breakup dekhna (read-only).

## Data source (technical)

- **API:** `GET /agentReport?userId={mstrid}&matchId={matchId}` → response `res.agentData` (`this.data`).
  - _(Legacy/commented: `GET /sessionEarningReport` → `res.sessionEarningData`.)_
- **Socket:** koi nahi.
