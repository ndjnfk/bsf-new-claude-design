# Bet Slips

> **Menu path:** Agent Match Dashboard → Bet Slips
> **Route:** `/company/betslips-tables`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`
> **Component:** `src/app/betslips-tables/betslips-tables.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. -->
![bet-slips](screenshots/bet-slips.png)

> _Screenshot pending — placeholder._

> ℹ️ **Detail Live Matches version jaisa hi hai — dekhein [../live-matches/bet-slips.md](../live-matches/bet-slips.md).**

## Page kya karta hai (Purpose)

Match ke saare markets (odds / bookmaker / toss / tied) ke bets tab-wise dikhata hai, har bet par runner-wise position aur "my share" calculate karta hai. Settled match par bhi (`afterResult=yes`) bets fetch hote hain.

## Screen pe kya dikhta hai (UI Layout)

- **Market tabs:** har market ka naam (`/matches/{matchId}/markets` se).
- **PL by market** mini table (runner / position).
- **Bet slip table columns:** `serialNo`, `date`, `marketTitle`, `rate`, `amount`, `mode`, `runnerName`, `user`, dynamic `Position{n}`, `myShare`, dynamic `Share{n}`, `status`, `plusMinus`.
- **User filter** dropdown.
- **Paginator.**

## Sub-pages
Koi sub-page nahi.

## Data source (technical)

- **API:** `GET /matches/{matchId}/markets`, `GET /bets?...&afterResult=yes`, `POST /plByMarket`.
- **Socket:** koi nahi.
