# Concurrent Users

> **Menu path:** Sidebar → Concurrent Users
> **Route:** `/company/concurrent-users`
> **Component:** `src/app/concurrent-users/concurrent-users.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![concurrent-users](screenshots/concurrent-users.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Is page pe sport-wise active ya completed (result) matches dikhte hain, aur kisi match pe kitne users ne kitne bets lagaye uska live count modal me dekha jaata hai. Active matches live socket se update hote rehte hain.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Concurrent Users" heading, breadcrumb Dashboard → Concurrent Users.
- **Top filters:**
  - `Select Sport` — dropdown (sports list; default Cricket = id 4. Kuch sports id filter out: 1233,1234,1235,1236,4339,7,77,11,6).
  - `Type` — dropdown: Active (`true`) / Result (`false`).
  - "Search" button.
  - `From Date` / `To Date` (date pickers) + "Load" button — sirf Result mode (`completedMatchesLoaded`) me dikhte hain (default range: aaj se -10 din se aaj).
- **List card ("List"):** Active aur Result dono mode ka same column set, sirf field names alag:
  - `Sports` (SportID/sport_id → CRICKET/Soccer/Tennis)
  - `Match Id`
  - `Market Id` (active: marketId / result: MarketId)
  - `Match Name` (active: matchName / result: EventName)
  - `DATE` (active: date / result: settle_date, `medium`)
  - `Action` — "Get Users" button (per-user bet count modal)
- **Modal (userModal):** header "Total Users - X / Total Bets - Y"; table S.No, User ID (username), Total Bets; "Close" button.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi (sirf in-page Get Users modal).

## Actions (User kya kar sakta hai)

- Sport aur Type (Active/Result) select karke "Search" karna.
- Result mode me From/To date range de kar "Load" karna.
- Kisi match pe "Get Users" se per-user bet count modal dekhna (`getCountUser()` — normal + fancy bets merge).
- Live active matches automatically socket update se refresh hote hain.

## Data source (technical)

- **API:**
  - `POST /dashboard` (body: `sport_id`) — active matches list. Rooms add/remove + join/leave per `marketId`.
  - `GET /bets/countPerUser/` (param: `matchId`) — match ke per-user bet counts (`normalBets`, `fancyBets`).
  - `POST /profitLoss` (body: `userId`, `fromDate`, `toDate`, `page`, `sportId`, `limit`) — completed/result matches data.
  - Sports list: `DataService.getSports()`.
- **Socket:** `connect`; emit `room` { name: 'DASHBOARD_UPDATE_ADMIN' }; `DASHBOARD_UPDATE_ADMIN` (matches refresh); `message` (live market data update via `updateData`); per-`marketId` join/leave room. `ngOnDestroy` me rooms cleanup.
