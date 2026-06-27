# Agent Match Dashboard (Match name click)

> **Menu path:** Sidebar → Live Matches → kisi match ke **Title (naam) link** par click
> **Route:** `/company/live-game-detials`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`, `matchStartDate`, `pageType` (yahan `'liveMatches'`)
> **Component:** `src/app/live-game-detials/live-game-detials.component.ts` (+ `.html`)
> **Parent page:** [Live Matches](live-matches.md)
> **Role:** Company (usetype `11`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![agent-match-dashboard](screenshots/agent-match-dashboard.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh ek chhota navigation / hub page hai ("Agent Match Dashboard"). Live Matches se kisi match ka naam click karne par yeh khulta hai. Yahan koi data table ya odds nahi dikhta — sirf us match se related report / action pages ke buttons (links) hote hain. User yahan se aage Bet Slips, Session Bet Slip, Live Report, Collection Report etc. par jaata hai. Har button apne saath same `matchId / marketId / sportId / matchName` query params forward karta hai. Koi API call ya socket nahi hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches". Breadcrumb: Dashboard → Matches → `{{ matchName }}`.
- **Header info bar:** Ek ibox panel jiska bada heading **"Agent Match Dashboard"**.
- **Tabs / sections:** Koi tab nahi. Sirf ek center-aligned button group (`btn btn-primary btn-lg`).
- **Inputs / toggles / tables / modals:** Koi nahi.

### Buttons (har ek router link hai)

Live Matches se entry hamesha `pageType = 'liveMatches'` ke saath hoti hai, is wajah se button visibility:

| Button | Route | Query params | `liveMatches` me dikhta? |
|---|---|---|---|
| **Bet Slips** | `betslips-tables` | `matchId, marketId, sportId, matchName` | ✅ Haan |
| **Session Bet Slip** | `sessionbetslips` | `matchId, matchName` | ✅ Haan |
| **Live Report** | `my-markets` | `matchId, marketId, sportId, matchStartDate` | ✅ Haan |
| **Collection Report** | `collection-report` | `matchId, matchName` | ✅ Haan |
| Client Report | `client-report` | `matchId` | ❌ Hidden (`pageType != 'liveMatches'` par hi dikhta) |
| Company Report | `company-report` | `matchId` | ❌ Hidden (`useType !== 0` AUR `pageType != 'liveMatches'`) |
| Session Earning Report | `session-earning-report` | `matchId` | ❌ Hidden (`pageType != 'liveMatches'` par hi dikhta) |

> **Note:** Kyunki Live Matches se entry hamesha `pageType = 'liveMatches'` ke saath hoti hai, company panel ke is case me **sirf Bet Slips, Session Bet Slip, Live Report aur Collection Report** dikhte hain. Client Report, Company Report aur Session Earning Report **hidden** rehte hain.

## Sub-pages (is page ke andar khulne wale pages)

`liveMatches` mode me visible buttons ke sub-pages:

- [Bet Slips](bet-slips.md) — "Bet Slips" button se.
- [Session Bet Slip](session-bet-slip.md) — "Session Bet Slip" button se.
- [Live Report (My Markets)](live-report.md) — "Live Report" button se.
- [Collection Report](collection-report.md) — "Collection Report" button se.

## Actions (User kya kar sakta hai)

- Match ke liye Bet Slips dekhna.
- Session Bet Slip dekhna.
- Live Report (My Markets) page kholna.
- Collection Report dekhna.
- (Client / Company / Session Earning Report sirf non-liveMatches mode me dikhte hain — Live Matches se aane par nahi.)

## Data source (technical)

- **API endpoints:** Koi nahi. Yeh page sirf `ActivatedRoute.queryParams` read karke buttons render karta hai.
- **Base URL:** Buttons `dataService.url` (component variable `url`, company me `/company/`) ko prefix banakar route banate hain.
- **User type:** `authService.user.usetype` se `useType` (`11`) set hota hai (sirf button visibility ke liye).
- **Socket:** Koi nahi.
