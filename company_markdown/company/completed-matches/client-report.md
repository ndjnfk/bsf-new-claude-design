# Client Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Client Report
> **Route:** `/company/client-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/client-report/client-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![client-report](screenshots/client-report.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page ek match ke liye **agent hierarchy (client, dealer, master, super master, sub admin, admin) wise** profit/loss, commission aur share ka report dikhata hai. Logged-in user (company, mstrid) ke niche ke har level ki alag table banti hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Match name based heading.
- **Tables (usetype ke hisaab se filter hokar banti hain):**
  - User/Client list (`usetype == 3`)
  - Dealer list (`usetype == 2`)
  - Master list (`usetype == 1`)
  - Super Master list (`usetype == 8`)
  - Sub Admin list (`usetype == 9`)
  - Admin list (`usetype == 10`)
- **Table columns (sab tables same):** `UserNm`, `MatchPlusMinus`, `SessionPlusMinus`, `TotalPlusMinus`, `MatchCommission`, `SessionCommission`, `TotalCommission`, `Net`, `AgentShare`, `FinalShare`.
- **Modals / dialogs:** koi nahi.

## Sub-pages

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Match ke har agent level ka PL / commission / share dekhna (read-only report).

## Data source (technical)

- **API:** `GET /agentReport?userId={mstrid}&matchId={matchId}` → response `res.agentData` (array). Component usko `usetype` ke hisaab se filter karke alag-alag list banata hai.
- **Socket:** koi nahi.
