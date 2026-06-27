# Session Bet Slip

> **Menu path:** Agent Match Dashboard → Session Bet Slip
> **Route:** `/company/sessionbetslips`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/sessionbetslips/sessionbetslips.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. -->
![session-bet-slip](screenshots/session-bet-slip.png)

> _Screenshot pending — placeholder._

> ℹ️ **Detail Live Matches version jaisa hi hai — dekhein [../live-matches/session-bet-slip.md](../live-matches/session-bet-slip.md).**

## Page kya karta hai (Purpose)

Match ke **fancy / session bets** dikhata hai, har bet par yes/no position, my-share aur settled plus/minus calculate karta hai. Settled match par bhi (`afterResult=yes`, `type=fancy`) data fetch hota hai.

## Screen pe kya dikhta hai (UI Layout)

- **Fancy table columns:** `serialNo`, `betId`, `date`, `user`, `sessionTitle`, `runs`, `amount`, `mode`, `no`, `yes`, `myShare`, `noPosition`, `yesPosition`, `status`, `plusMinus`.
- **Filters:** User dropdown (`All User`), Fancy dropdown (`All Fancy`).
- **Paginator** + loader.

## Sub-pages
Koi sub-page nahi.

## Data source (technical)

- **API:** `GET /bets?matchId=...&type=fancy&afterResult=yes&page=...&limit=...`.
- **Socket:** koi nahi.
