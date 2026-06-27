# Results

> **Menu path:** Sidebar → Results
> **Route:** `/company/match-result`
> **Component:** `src/app/match-result/match-result.component.ts` (+ `match-result.component.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![results](screenshots/results.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Is page pe authorized company user **match markets ka result declare** karta hai aur declare ho chuke results ki list dekhta hai. Galti se declare hue result ko **Revoke (rollback)** bhi kar sakta hai. **Declare Result** section sirf kuch authorized users ko dikhta hai.

## Menu visibility (IMPORTANT — company-specific gating)

Yeh "Results" menu item sidebar me **har company user ko nahi dikhta**. Company panel (`company.component.ts`) menu se is item ko hata deta hai jab tak user in conditions me se kisi ek pe fit na ho:

- `usetype == 11 && mstrid == 4957`, **YA**
- `usetype == 11 && mstrid == 2 && mstrname == 'Ccompany'`.

In dono me se koi bhi match na ho to "Results" (aur "Set Fancy BetLimit") menu se splice ho jaata hai. Iske alawa, agar `allow_result_declare == 0` ho to bhi result-declare wala access nahi milta (sidebar se related item hat jaata hai).

> Note: Yeh sirf menu/visibility gating hai. Component ke andar bhi same condition se sections show/hide hote hain (neeche "Access" dekho).

## Kis ko kya dikhta hai (Access)

- **Declare Result form** sirf tab dikhta hai jab user `usetype == 0`, **ya** `allow_result_declare` true ho, **ya** specific company users (`usetype == 11` aur `mstrid == 4957`; ya `usetype == 11`, `mstrid == 2`, `mstrname == 'Ccompany'`).
- **Action (Revoke) column** sirf tab add hota hai jab `usetype == 0`, `usetype == 55`, ya wahi specific `usetype == 11` company users (mstrid 4957 / Ccompany).
- Baaki sab users ko sirf **Match Result list** (read-only) dikhti hai.

## Screen pe kya dikhta hai (UI Layout)

- **Declare Result section (conditional):**
  - Heading "Declare Result", breadcrumb Dashboard → Declare Result.
  - 4 cascading dropdowns (har step pe agla load hota hai): **Select Sport** → **Select Match** → **Select Market** → **Select Selection**.
  - **Declare** button (form valid hone par hi enable).
  - Note: Markets list me agar ek se zyada market ho to "Match Odds" market remove kar diya jaata hai. Selections list me **"Abandoned"** option extra add hota hai (selectionId 0).
- **Match Result section:**
  - Heading "Match Result", breadcrumb Dashboard → Match Result.
  - **Filters (collapsible, `filter_alt` icon se toggle):**
    - **Sport** (mat-select, All + sports).
    - **Select Match** (searchable mat-select, `ngx-mat-select-search`).
    - **Market** (mat-select, unique `MarketName`).
    - **Result Date** (date picker).
  - **Table columns:** `#`, Match (`MatchName`), Market (`MarketName`), Sport (`sportName`), Selection (`SelectionName`), Result (`result`), **Declared By** (`UserID`), Date, aur authorized users ke liye **Action** (Revoke button).
  - **Loader:** spinner (`isLoading`).
  - **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi. Declare aur list dono ek hi page par sections hain; Revoke ek `confirm()` dialog se hota hai (koi alag modal nahi).

## Actions (User kya kar sakta hai)

- **Result declare karna:** Sport → Match → Market → Selection chunkar Declare (`declareResult`). "Abandoned" bhi chun sakte hain.
- Result list ko Sport / Match (search) / Market / Date se **filter** karna.
- Declared result ko **Revoke** karna (`rollback`, `confirm` ke saath) — fancy aur market ke liye alag endpoint.
- Pagination ke through results browse karna.

## Data source (technical)

- `GET /results` (params: `page`, `sport_id`, `match_id`, `date`, `limit`) — result list.
- `GET /getMatchesForResult?sportId=` — declare ke liye matches.
- `POST /getMatchMarketList` (body: `sportsId`, `matchId`) — match ke markets ("Match Odds" filter hota hai).
- `GET /querySelection?marketId=` — market ki selections ("Abandoned" add hota hai).
- `POST /results` — result declare (Sport_id, series_id, match_id, market_id, selectionId, isFancy=0, names...).
- `POST /rollbackMarketResult` — market result revoke (isFancy != 1).
- `POST /rollbackFancyResult` — fancy result revoke (isFancy == 1).
- `GET /getMatchesBySport` (params: `sport_id`, `search`) — filter ke searchable matches.
- `DataService.getSports()` — sports list (filter: `is_betfair`).
- **Socket:** koi nahi.
