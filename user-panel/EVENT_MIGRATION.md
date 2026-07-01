# Step 11 — Event / Live Betting Migration & Angular Parity Report

Migrated the Angular Event component (`event.component.ts` 1484 lines + `.html` 1023
lines) to React. Angular source untouched. Route, payloads, socket behavior, and all
betting calculations preserved.

## Files
| Concern | File |
|---|---|
| API (endpoints + payload types) | `src/services/bettingApi.ts` |
| Business calculations (verbatim) | `src/utils/eventCalc.ts` |
| Data + socket lifecycle (cleanup-safe) | `src/hooks/useEventData.ts` |
| Market block (Match Odds/Bookmaker/Toss/Tied) | `src/components/event/MarketTable.tsx` |
| Fancy list (session + line) | `src/components/event/FancyTable.tsx` |
| Bet slip | `src/components/event/BetSlip.tsx` |
| Page wiring | `src/pages/Event.tsx` |

## Parity table — Angular → React

| Aspect | Angular | React | Status |
|---|---|---|---|
| **Route** | `event/:event_id/:market_id/:sport_id` | same (`useParams`) | ✅ exact |
| **getMatch** | `GET matches/{id}?marketId=` | `bettingApi.getMatch` | ✅ |
| **getMarket** | `GET matches/{id}/markets?marketId=&sportId=` | `getMarkets` | ✅ |
| **getFancies** | `GET matches/{id}/fancies?category=&filter=&refresh=` | `getFancies` | ✅ |
| **getFancyLiability** | `GET matches/{id}/fancyLiability` | `getFancyLiability` | ✅ |
| **Market bet** | `POST bets/market` | `placeMarketBet` | ✅ payload field-for-field |
| **Indian fancy** | `POST bets/fancy` | `placeFancyBet` | ✅ |
| **Line fancy** | `POST bets/line` | `placeLineBet` | ✅ |
| **Market profit** | `Math.round(odds*stake - stake)` | `calcProfit` | ✅ verbatim |
| **Indian YES profit** | `(volume*stake)/100` | `calcProfit` | ✅ |
| **Indian NO / Line profit** | `stake` | `calcProfit` | ✅ |
| **Bookmaker odds** | `(odds/100)+1` | `bookmakerOdds` | ✅ |
| **Limits hierarchy** | fancy-specific > company > global | `getLimits` | ✅ |
| **Position (P/L)** | back +P_L/−Stack, lay −P_L/+Stack | `getProfitLoss` | ✅ verbatim |
| **Book liability** | odds-ladder min | `viewBookLiability` | ✅ verbatim |
| **Suspend gating** | CLOSED/SUSPEND/BALL RUNNING + bookmaker runner status + 0/0 | `marketSuspended`/`getStatus`/`getFancyStatus` | ✅ |
| **Toss** | no lay side | MarketTable hides lay for Toss | ✅ |
| **8s odds countdown** | `setInterval` clears slip at 0 | `startCountdown` (ref timer) | ✅ |
| **Run Changed** | `updateFancyData` flags active fancy change | `onRunChanged` → slip banner | ✅ |
| **Quick stakes** | `user.stakes` buttons | BetSlip quick buttons | ⚠️ see note |

## Socket rooms (joined on mount, left on unmount) — exact names
`BETS_UPDATE_DATA:<mstrid>_<matchId>`, `MATCH_UPDATE_DATA:<matchId>`,
`UPDATE_MATCH_EVENT:<matchId>`, `MARKET_UPDATE_DATA:<matchId>`, `UPDATE_MARKETS`,
`UPDATE_FANCY`, `FANCY<matchId>`, plus each line-fancy `market_id` room.

Live handlers preserved: `message` → `updateData` + `updateLineFancyData`;
`FANCY<id>` → `updateFancyData` (+ Run Changed); `MARKET_UPDATE_DATA` → `Object.assign`
matching market; `UPDATE_MARKETS` → reload markets; `UPDATE_MATCH_EVENT` → update
max/min stack + clear slip; `MATCH_UPDATE_DATA` → tv/score; `UPDATE_FANCY` → patch
fancy or reload.

## Cleanup (unmount) — sockets, timers, subscriptions
`useEventData` returns a cleanup that: sets `refreshData=false` (stops processing
late messages), `off()`s every handler, `manageRoom(fancyRooms, false)`, leaves all 6
named rooms, and unsubscribes `needReload`. `Event.tsx` clears the countdown timer on
unmount and via `clearBet`.

## Race conditions & duplicate bets
- `placingRef` guard returns early if a bet is already in flight; the Place button is
  also `disabled` while `isLoading`. (Test: rapid double-click → `placeMarketBet`
  called **once**.)
- Late socket messages are dropped after unmount via the `refreshData` flag.
- Min/max stake validated before posting.

## Known differences / deferred (documented, not silent)
- **Quick-stake button behavior**: the original `stockValue()` source wasn't quoted in
  the spec; implemented as **set stake = button value** (standard panel UX). Easy to
  switch to append/add if the original differs.
- **Per-runner position display** (`getProfitLoss` wired into the runner rows) needs the
  staggered `bookmakerBets`/`tossBets`/`tiedMatchBets`/`fancyBets` fetches; the
  calculation is ported + unit-tested but not yet rendered on each runner row.
- **Cashout** (green/red hedge) and **TV/scoreboard** iframes are not yet rendered
  (noted for a later pass).
- Endpoints use the **Adonis names** the Angular app used; against the Go backend they
  404 until `/api/user/*` exists — `bettingApi.ts` + `services/socket.ts` are the swap
  points.

## Verification
- `tsc --noEmit` ✅ · `eslint --max-warnings 0` ✅ · `vitest run` ✅ **81/81**
  (16 new: 13 calc + 3 Event — render, exact payload, duplicate-prevention) ·
  `npm run build` ✅ (Event lazy chunk emitted).
