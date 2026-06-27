# Live Report (My Markets)

> **Menu path:** Agent Match Dashboard → Live Report
> **Route:** `/company/my-markets`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchStartDate`
> **Component:** `src/app/my-markets/my-markets.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. -->
![live-report](screenshots/live-report.png)

> _Screenshot pending — placeholder._

> ℹ️ **Detail Live Matches version jaisa hi hai — dekhein [../live-matches/my-markets.md](../live-matches/my-markets.md).**

## Page kya karta hai (Purpose)

Match ka market-wise live report (`my-markets`) dikhata hai — runners, positions aur exposure ke saath. Completed match se khulne par same component hi use hota hai (live odds settle ke baad).

## Screen pe kya dikhta hai (UI Layout)

- Market / runner wise report tables (detail Live Matches doc me).
- Match param-based heading.

## Sub-pages
Koi sub-page nahi.

## Data source (technical)

- **API:** `my-markets` component ke endpoints (detail: ../live-matches/my-markets.md).
- **Socket:** Live data ke liye socket (detail Live Matches doc me).
