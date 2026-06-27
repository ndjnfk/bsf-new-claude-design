# Agent Match Dashboard (Settled Match Hub)

> **Menu path:** Sidebar → Completed Matches → (cricket match title click)
> **Route:** `/company/live-game-detials`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`, `matchStartDate` _(NOTE: yahan se **`pageType` pass NAHI hota** → isliye yeh "settled match" mode me khulta hai)_
> **Component:** `src/app/live-game-detials/live-game-detials.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![agent-match-dashboard](screenshots/agent-match-dashboard.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh ek **hub / launcher page** hai jisme ek particular match ke saare reports aur bet-slip pages ke liye bade buttons hote hain. Same component Live Matches section me bhi use hota hai, par **completed matches se aane par `pageType` query-param nahi bheja jaata**, isliye yahan saare report buttons (Client Report, Company Report, Session Earning Report) bhi dikhte hain — Live Matches version me ye chhip jaate hain.

## Live Matches version se farq (IMPORTANT)

`live-game-detials.component.html` me buttons conditionally dikhte hain (logged-in user ka `useType = authService.user.usetype`):

| Button | Condition | Completed Matches (no pageType) | Live Matches (pageType = 'liveMatches') |
|---|---|---|---|
| Bet Slips | hamesha | ✅ | ✅ |
| Session Bet Slip | hamesha | ✅ | ✅ |
| Live Report | hamesha | ✅ | ✅ |
| Client Report | `pageType != 'liveMatches'` | ✅ | ❌ |
| Collection Report | hamesha | ✅ | ✅ |
| Company Report | `useType !== 0 && pageType != 'liveMatches'` | ✅ (agar useType ≠ 0) | ❌ |
| Session Earning Report | `pageType != 'liveMatches'` | ✅ | ❌ |

> Yani Completed Matches se aane par **full button set** dikhta hai (Company Report sirf jab logged-in user ka `useType !== 0` ho). Company panel (role 11) me normally useType ≠ 0 hota hai, isliye Company Report button bhi dikhta hai aur uska route bhi registered hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches" — breadcrumb: Dashboard → Matches → `{{ matchName }}`.
- **Card title:** "Agent Match Dashboard".
- **Buttons (centered, btn-primary btn-lg):**
  - `Bet Slips` → `betslips-tables` (params: matchId, marketId, sportId, matchName)
  - `Session Bet Slip` → `sessionbetslips` (params: matchId, matchName)
  - `Live Report` → `my-markets` (params: matchId, marketId, sportId, matchStartDate)
  - `Client Report` → `client-report` (params: matchId)
  - `Collection Report` → `collection-report` (params: matchId, matchName)
  - `Company Report` → `company-report` (params: matchId)
  - `Session Earning Report` → `session-earning-report` (params: matchId)
- **Modals / dialogs:** koi nahi — sirf navigation buttons.

## Sub-pages (is page se khulne wale pages)

- [Bet Slips](bet-slips.md) — match bet slips (odds/bookmaker/toss markets).
- [Session Bet Slip](session-bet-slip.md) — fancy/session bets.
- [Live Report](live-report.md) — `my-markets` market-wise live report.
- [Client Report](client-report.md) — agent hierarchy wise PL/commission.
- [Collection Report](collection-report.md) — len-den (receiving/paying) summary.
- [Company Report](company-report.md) — company-level report (Company panel me route registered — working page).
- [Session Earning Report](session-earning-report.md) — session earning report.

## Actions (User kya kar sakta hai)

- Match ke kisi bhi report / bet-slip page par jaana (button click).

## Data source (technical)

- **API:** Yeh page khud koi API call nahi karta — sirf `ActivatedRoute.queryParams` se match params padhta hai aur `dataService.url` se base route (`/company/`) banata hai. Data har destination page khud fetch karta hai.
- **Socket:** koi nahi.
