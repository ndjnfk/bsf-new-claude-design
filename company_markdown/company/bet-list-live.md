# Bet List Live

> **Menu path:** Sidebar → Bet List Live
> **Route:** `/company/current-bets`
> **Query params:** `sportId`, `matchId`, `marketId` _(optional — deep-link se aa sakte hain)_
> **Component:** `src/app/current-bets/current-bets.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![bet-list-live](screenshots/bet-list-live.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page sabhi **live (current) bets** ko real-time me dikhata hai. Socket event aane par list khud-ba-khud refresh ho jaati hai. Company role (usetype `11`) ke users jinke paas `allow_bet_delete` hai, woh bets delete bhi kar sakte hain, aur poora data Excel me export kar sakte hain.

## Kis ko kya dikhta hai (Access)

- **Action (Delete) column** sirf tab dikhta hai jab usetype `0` ho, **ya** usetype `11` (company) ho aur `allow_bet_delete` true ho.
- Baaki sab users ko list **read-only** dikhti hai.
- **Bulk Delete Bets form** (filter panel ke andar) sirf usetype `0` ko dikhta hai — company users ko nahi.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Current Bets" heading, breadcrumb: Dashboard → Current Bets.
- **Top bar:**
  - "Search..." input — typing par (delay ke saath) data fetch hota hai (`appDelayInput`).
  - **Filter** icon button — niche wala filter panel collapse/expand karta hai.
  - **Export** (download) icon button — Excel download.
- **Section card:** "All Live Bets".
- **Filter panel (collapsible):**
  - **Sport** — dropdown (All + har sport). Change par list reload.
  - **Delete Bets form (sirf usetype `0`):** Formly repeat form — Select Match (searchable, sport ke hisaab se filtered), From Date (datetime-local), To Date (datetime-local), aur "Delete Bets" button.
- **Table columns:** `#`, `ID` (MstCode), `Sports`, `Match`, `Market`, `User`, `Selection`, `Type` (Back/Lay), `Odds`, `Stake`, `PL`, `Date`, `IP`, aur (sirf usetype `0` ya `allow_bet_delete` wale `11`) `Action` (delete button).
  - **Type logic:** `isBack == 1` hone par "Lay", warna "Back". Row ka rang bhi isi par (`lay0` / `back0` class).
- **Loader:** bets fetch hote waqt spinner.
- **Pagination:** `mat-paginator` — page size options 10 / 25 / 50 / 100 (default 50).

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi. (Yeh ek standalone listing page hai.)

## Actions (User kya kar sakta hai)

- Search box se bets filter karna.
- Sport filter change karna.
- Data ko Excel (`.xlsx`) me export/download karna.
- Single bet delete karna (Action delete button — password `prompt()` + confirm, sirf authorized users).
- Time/match range se bulk bet delete karna (Delete Bets form — password `prompt()` + confirm, sirf usetype `0`).
- Pagination se page aur page-size badalna.

## Data source (technical)

- `GET /bets` — current bets list (params: `page`, `sportId`, `matchId`, `search`, `limit`; aur `sportId == 7` par `marketId` bhi).
- `GET /getMatchesForBets` — Delete Bets form ki match dropdown (sport ke hisaab se filter).
- `POST /removeBet` — single bet delete (`marketId`, `betId`, `userId`, `matchId`, `password`).
- `POST /removeBetByTime` — time/match range se bulk delete (form fields + `password`).
- `POST /exportData` — Excel export (blob, params: `sportId`).
- **Socket event:** `ALL_BETS_UPDATE_DATA:<mstrid>` — naya update aane par list auto-refresh. Room `dataService.manageRoom(...)` se manage hota hai; `socket.emit('room', ...)` se join.
