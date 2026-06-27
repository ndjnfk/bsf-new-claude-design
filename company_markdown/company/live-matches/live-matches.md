# Live Matches

> **Menu path:** Sidebar → Live Matches
> **Route:** `/company/dashboard`
> **Query params:** Koi nahi
> **Component:** `src/app/dashboard/dashboard.component.ts` (+ `.html`)
> **Role:** Company (usetype `11`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![live-matches](screenshots/live-matches.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page sport-wise live / upcoming matches ki list dikhata hai. Yahan se company (usetype `11`) pura sport ya individual match block/unblock kar sakti hai, match ka Live Report dekh sakti hai, aur specific match par users ko block kar sakti hai. Data socket ke through real-time update hota rehta hai. Kisi match ke **naam (Title) par click** karne se uska "Agent Match Dashboard" (hub page) khulta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches.
- **Inplay / Upcoming buttons:** Top par do button ("Inplay", "Upcoming") — abhi sirf UI buttons hain.
- **Sport tabs / buttons:** Sports ki buttons grid (`sports` array se). Click karne par us sport ke matches load hote hain (`getMatches`). Default Cricket (id 4) load hota hai. Kuch sport ids filter karke hata diye gaye hain (`[1233,1234,1235,1236,4339,7,77,11,6]`); `7` aur `4339` ko Horse-racing maana jaata hai.
- **All-sport toggle:** Selected sport table ke upar `mat-slide-toggle` "All {sport name}" — pura sport active/inactive (`updateSport`, confirm prompt ke saath).
- **Table columns (normal sports — Cricket/Soccer/Tennis):**
  - `#` — match block toggle (`blockMatch`) + (usetype `0` ya `11` hone par; company ke liye dikhega) "Block Match" icon button (`person_off`) jo Block User panel kholta hai.
  - `ID` — `matchId`.
  - `Title` — match name link → `live-game-detials` page (query: `matchId, marketId, sportId, matchName, matchStartDate, pageType: 'liveMatches'`).
  - `Sport` — CRICKET / Soccer / Tennis (SportID 4/1/2).
  - `DATE` — match date/time.
  - `Action` — "LiveReport" button → `my-markets` page (query: `matchId, marketId, sportId, matchStartDate`).
- **Horse racing layout (alag card):** match name, active toggle, country code, aur har time slot ke liye time button (→ `my-markets`) + "Bets" button (→ `current-bets`).
- **"No Data Available"** message jab list khaali ho aur loading na ho.
- **Modal / dialog — "Block User"** (`#blockUsers` template):
  - **Search User** input field (`blockUserInput$`).
  - **Type** dropdown — ALL / Block / Unblock (`blockFilter$`).
  - Users table — columns: checkbox (`select`), `User ID` (`mstruserid`).
  - **Save** button (`saveBlockUsers`).

## Sub-pages (is page ke andar khulne wale pages)

- [Agent Match Dashboard](agent-match-dashboard.md) — match ke **Title (naam) link** par click karne par khulta hai (hub page).
- [Live Report (My Markets)](live-report.md) — row ke **"LiveReport"** button par click (ya hub ke "Live Report" button se bhi).

## Actions (User kya kar sakta hai)

- Sport select karke us sport ke matches dekhna.
- Pura sport active/inactive karna (confirm prompt ke saath).
- Individual match block/unblock karna (toggle, confirm prompt ke saath).
- Match par specific users ko block/unblock karna (Block User dialog se, search + filter ke saath).
- Match ka Agent Match Dashboard (Title link) ya Live Report (LiveReport button) kholna.
- Horse racing me time-slot wise My Markets / Bets kholna.

## Data source (technical)

- **API:** `POST /dashboard` (`sport_id`), `PUT /sports/{id}` (active toggle), `POST /blockedMatches` (match block/unblock), `GET /blockedMatchUsers` / `POST /blockedMatchUsers`, `GET /blockedMarketUsers` / `POST /blockedMarketUsers`, `GET /allUsers` (user search).
- Sports list `DataService.getSports()` se. Route prefix `DataService.url` (`/company/`) se banta hai.
- **Socket:** emit `room` (`DASHBOARD_UPDATE_ADMIN`), per-marketId `joinRoom` / `leaveRoom`. On `DASHBOARD_UPDATE_ADMIN` → matches refresh (`getMatches`), on `message` → live odds update (`updateData`).
