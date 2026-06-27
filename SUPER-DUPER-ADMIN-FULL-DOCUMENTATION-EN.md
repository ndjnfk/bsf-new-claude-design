# Super Duper Admin — Full Documentation (English)

This is the **complete, single-file English documentation** for the `super-duper-admin` panel of the **bsf2020-admin-ui** project. Every sidebar page is documented in UI (sidebar) order, and pages that open other pages inside them (for example **Live Matches** → match click → Bet Slips / Session Bet Slip / Live Report / Collection Report) are documented as nested sub-pages right after their parent.

- **Live URL:** `https://bsftest.net/super-duper-admin/home-dashboard`
- **Local Base URL:** `http://localhost:4200/super-duper-admin`
- **Login level:** Super Duper Admin
- **Source code (read-only):** `D:\bsf-claude-fine_code\bsf-api-main-test-jack-branch\bsf2020-api`
- **These docs live OUTSIDE the project:** `d:\2024\bsf2020-admin-docs\` (no app/project files were changed)

> **Note:** This is the English single-file version. A Hinglish, per-page (multi-file, nested-folder) version of the same content lives alongside in this folder — see [README.md](README.md). Screenshots are placeholders; add live screenshots into the `screenshots/` folders.

---

## Page Index (sidebar order)

| # | Menu Item | Pages inside it (sub-pages) | Route |
|---|-----------|------------------------------|-------|
| 1 | **Dashboard** | — | `home-dashboard` |
| 2 | **Manage → Company / List Of Clients** | Client Dashboard | `users?userTypeId=11` |
| 3 | **Live Matches** ⭐ | Agent Match Dashboard → Bet Slips, Session Bet Slip, Live Report, Collection Report | `dashboard` |
| 4 | **Completed Matches** | Agent Match Dashboard (full) → Bet Slips, Session Bet Slip, Live Report, Client / Company / Session Earning / Collection Report, Ledger, Show Bet | `completedMatchesList` |
| 5 | **Aura GGR** | — | `royal-casino` |
| 6 | **Block Market** | — | `sports` |
| 7 | **Manage Clients** | Blocked Clients → Edit Blocked Client; Commission & Limits | `blocked-user`, `commission-limit` |
| 8 | **Manage Password** | — | `change-password` |
| 9 | **Search Logs User** | Log User Details | `search-logs-user` |
| 10 | **Manage Ledgers** | Collection Report, log-detail, My Stmt. (`report?id=3`), Profit & Loss (`report?id=2`) | `collection-report-all`, `log-detail`, `report` |
| 11 | **All Reports** | Bet History (id=1), Profit & Loss (id=2), My Stmt. (id=3), Login History (id=4), Deleted Bet History (id=5), Password History (id=6), Chips Summary | `report?id=1..6`, `chip-summary` |
| 12 | **Bet List Live** | — | `current-bets` |
| 13 | **Manage Series/Matches** | Manage Matches → Betfair / Indian Fancy / Session Fancy | `manage-series?sportId=4` |
| 14 | **Activate Matches** | Manage → Betfair / Indian Fancy / Session Fancy | `direct-activate` |
| 15 | **Agent Bank DP** | — | `bank-account/deposit` |
| 16 | **Agent Bank WD** | — | `bank-account/withdraw` |
| 17 | **Deduct Dealer** | — | `deduct-dealer` |
| 18 | **Results** | — | `match-result` |
| 19 | **Website Setting** | — | `domains` |
| 20 | **Add Worker** | — | `manage-helper` |
| 21 | **Old Match Results** | — | `settled-matches` |
| 22 | **Settlements** | — | `settlement-entry` |
| 23 | **Set Fancy BetLimit** | — | `manage-fancy` |
| 24 | **Queries** | — | `queries` |
| 25 | **News** | Create News, Update News | `news` |
| 26 | **Ip Surveillance** | — | `ip-surveillance` |
| 27 | **Concurrent Users** | — | `concurrent-users` |
| 28 | **Market Setting** | — | `settings` |

### Top-bar (Header) Actions
Available on every page (component `super-duper-admin.component`): a group dropdown (Change Password, A/C Chips In/Out modal, Generate Token), a Bet Delete action (revoke & delete a bet by Bet Id, `/revokeAndDelete`), and Sign out. On mobile these appear in an offcanvas side panel along with Balance / P&L.

### Important implementation notes
1. **`company-report` and `ledger-match-wise` routes are NOT registered** in `super-duper-admin-routing.module.ts` — the components/buttons exist in code, but the routes are not wired (the Completed Matches "Ledger" button is also commented out).
2. **`report` is a single shared component** driven by the `id` query param (1–6): 1 = Bet History, 2 = Profit & Loss, 3 = Account Statement / My Stmt, 4 = Login History, 5 = Deleted Bet History, 6 = Password History. id=1 and id=5 share the same table/endpoint (only `type` differs, 1 vs 0).
3. **`request` is a single shared component** (Agent Bank DP/WD) switched by the `:type` route param (deposit/withdraw) — the HOLD option appears only in withdraw; socket auto-refresh only in deposit.
4. **`create-blog` is a single shared component** for both Create and Update News — edit mode is triggered by the `:id` param.
5. **Live Matches vs Completed Matches hub:** both open the same `live-game-detials` (Agent Match Dashboard). Live Matches passes `pageType='liveMatches'`, so only Bet Slips / Session Bet Slip / Live Report / Collection Report show. Completed (settled) matches have no pageType, so Client Report, Company Report and Session Earning Report also appear.

---


## Dashboard

> **Menu path:** Sidebar → Dashboard
> **Route:** `/super-duper-admin/home-dashboard`
> **Query params:** none
> **Component:** `src/app/home-dashboard/home-dashboard.component.ts` (+ `.html`)
> **Parent page:** none (this is the landing page after login)

### 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![dashboard](screenshots/dashboard.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the Home (landing) screen shown after login. It displays a summary for the currently logged-in user — username, level, balance, profit/loss, share, and commission. It is a read-only display page with no actions or forms.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Home", breadcrumb contains only the "Home" link.
- **Section "Details"** (cards / ibox row):
  - **MY USERNAME** — `authService.user.mstrname`, with `authService.user.mstruserid` shown small below it.
  - **MY LEVEL** — `myLevelName` (mapped from usetype: 11=Company, 10=Admin, 9=Sub Admin, 8=Super Stockist, 1=Stockist, 2=Agent, 3=Client, otherwise=Super Duper Admin).
  - **Current Balance** — `authService.user.balance`.
  - **Profit/Loss** — `authService.user.p_l` (red `text-danger` if negative, otherwise green `text-success`).
  - **Company Contact** — `companyContactName` (mapped from usetype: 11/10=Company, 9=Admin, 8=Sub Admin, 1=Super Stockist, 2=Stockist, 3=Agent, otherwise=Super Duper Admin).
  - _(The MY FIX LIMIT card is commented out in the code — not currently shown.)_
- **Section "My Share and Company Share"** (paired cards):
  - **Maximum My Match Share** — `partner_cricket %` / **Minimum Company Match Share** — `100 - partner_cricket %`.
  - **Maximum My Casino Share** — `partner_casino %` / **Minimum Company Casino Share** — `100 - partner_casino %`.
  - _(The Tennis and Soccer share cards are commented out in the code.)_
- **Section "Commission"** (cards — each card is shown only when its value > 0 or `usetype == 0`):
  - **Match Odds Commission (To Take)** — `Commission`.
  - **Bookmaker Loss Commission (To Give)** — `rolling_commission`.
  - **Session Win Commission (To Take)** — `SessionComm`.
  - **Session Rolling Commission (To Give)** — `fancy_rolling_commission`.
- **Buttons:** none (display cards only).
- **Table columns:** no table.
- **Modals / dialogs:** none.

### Sub-pages

No sub-page — this is a leaf (read-only) page with no navigation out of it.

### Actions

- The user can only view their own summary information (view-only page). No buttons/forms/editing.

### Data Source (Technical)

- **API:** No direct API call. All values come from the `AuthService.user` object (loaded at login / `authService.init()`). In `ngOnInit`, the loader is managed by toggling the `dataService.loading` flag on/off.
- **Socket:** no socket event.

---


## List of Clients / Company

> **Menu path:** Sidebar → Manage → Company (also "List Of Clients" in the top bar)
> **Route:** `/super-duper-admin/users`
> **Query params:** `userTypeId=11` (Company list), optional `userId`, `category` (`agent`/`client`), `actionType`
> **Component:** `src/app/users/users.component.ts` (+ `.html`)
> **Parent page:** none (top-level manage page)

### 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![clients-list](screenshots/clients-list.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page shows the hierarchy-wise list of clients/agents that fall under the logged-in user (Company, Admin, Sub Admin, Super Stockist/Super Master, Stockist/Master, Agent/Dealer, Client). From here you can create new child users, deposit/withdraw chips, lock/unlock, change passwords, set sport block/limit, poker block, and edit share/commission/profile. The `userTypeId` and `category` query params decide which table set is displayed (for example, the Company list at `userTypeId=11`).

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Manage Clients", breadcrumb: Dashboard → Manage Clients.
- **Top bar (All Users box):** Refresh icon (`init`), User Count icon (`getUserCount`), and **Create Company / Create {role}** buttons — these navigate to the `users-create` page with `[queryParams]="{ userId, userTypeId }"`. Role visibility depends on `usersTypeList` and the parent's usetype.
- **Filters / search (within each table block):**
  - Status dropdown — All (`2`) / Active (`1`) / In Active (`0`) — `userGroup` (filters on `mstrlock` via `applyUserGroupFilter`).
  - **Search** input (type=search) — `search`, runs `init` on delayed input.
- **Tables (role-wise separate ibox, depending on `category`/`userTypeId`):** `data` is split by usetype into separate tables — `superAdminTableData` (10), `subAdminTableData` (9), `superMasterTableData` (8), `masterTableData` (1), `dealerTableData` (2), `clientTableData` (3).
- **Table columns (`columns`):** `User Name` (mstruserid + mstrname — **link to `user-dashboard`**), `Phone` (when project != 1; except betpro), `PL` (`P_L`), `New PL` (`pl`, only when usetype 0), `Profit Loss` (`profit_loss` — click triggers `clearChip`), `Exposure/Liability` (`settlementAmount`), `Balance`, `Agent Type` (`getRole`), `My/Agent share`, `Action`. In the role-wise child tables (`companyColumns`, `superAdminColumns`, etc.): `#/User Name/PL/New PL/Exposure/Balance/Agent Type/My Share/Agent share`.
- **Action column buttons:** `D` Deposit, `W` Withdraw, `Edit` (viewAccount), `SB` Sport Block, `SL` Sport Limit, `PB` Poker Block, User Lock/Unlock (slide toggle), Bet Lock/Unlock (slide toggle), `PWD` Change Password, Account Statement icon (`account-statement` page).
- **Modals / dialogs (MatDialog):**
  - **A/C Chips In/Out** (`accountChipInOutModal`) — Deposit/Withdraw tabs; fields: Parent Chips (disabled), User Chips/Balance (disabled), **Amount** (Chips), **Remark** (RefID). Spinner on the Deposit/Withdraw button (`chipLoading`).
  - **Account of {user}** (`viewAccountModal`) — tabs: Casino Limit (when usetype 11), Edit Profile; Profile/Additional info, Partnership Information (`getPartnershipData`), and the Commission edit form.
  - **Change Password** (`changePasswordModal`) — newPassword + confirmPassword (match validator).
  - **Sport Block** (`sportBlockModal`), **Sport Limit** (`sportLimitModal`, Formly: Min Stake, Max Stake, Max Profit, Bet Delay, Market Volume, Max Market Exposure, Lay Diff — Lay Diff only for sportId 4/cricket), **Poker Block** (`pokerBlockModal`).
  - **My Share** (`myShareModal`), **Max Share** (`maxShareModal`), **User Count** (`userCountModal`).

### Sub-pages

- [client-dashboard.md](client-dashboard.md) — opens when **User Name** in any row is clicked. RouterLink: `['/', urlType, 'user-dashboard']`, queryParams: `{ userId: d.usecode, userTypeId: d.usetype, parentId: d.parentId }`.
- **users-create** (separate page) — opens from the "Create Company / Create {role}" button (`users-create`, queryParams `{ userId, userTypeId }`). _(This is the peer create-form page in the same users folder.)_
- **account-statement** (separate page) — from the Account Statement icon in the Action column (`account-statement`, queryParams `{ id, type }`).

### Actions

- Create a new child user/company.
- Deposit / Withdraw chips (`saveCoins`).
- User lock/unlock (`lockUsers`), betting lock/unlock (`lockBetting`).
- Change password (`changeUserPassword`).
- Sport block (`blockedSports`), set sport limit (`sportLimits`), poker block (`blockedPoker`).
- View My Share / Max Share, edit commission (`updateComm`) and profile (`updateAccount`), casino limit increment (`poker/casinoLimitIncrement`).
- Click on Profit/Loss to clear chip (`clearChip`), view user count (`getUserCount`), search / sort / status filter.
- Click on a row to open that user's dashboard (`user-dashboard`).

### Data Source (Technical)

- **API:** `POST /masters` (list — category-wise if `category` is present, otherwise `type`/userTypeId-wise; paginated), `GET /users/{id}` (parent — `getParent`), `POST /saveCoins`, `POST /changeUserPassword`, `POST /updateAccount`, `POST /updateComm`, `POST /getPartnershipData`, `POST /lockUsers`, `POST /lockBetting`, `GET /blockedSports` / `POST /blockedSports`, `GET /sportLimits` / `POST /sportLimits`, `GET /blockedPoker` / `POST /blockedPoker`, `POST /clearChip`, `GET /accountStatement`, `POST /getUserCount`, `GET /poker/getCompanyCasinoLimit`, `POST /poker/casinoLimitIncrement`.
- **Socket:** no socket event (entirely REST based).

---


## Client Dashboard (Agent Match Dashboard)

> **Menu path:** List Of Clients → click User Name in a row
> **Route:** `/super-duper-admin/user-dashboard`
> **Query params:** `userId`, `userTypeId`, `parentId` (sometimes also `directRouteToCollectionReport`)
> **Component:** `src/app/user-dashboard/user-dashboard.component.ts` (+ `.html`)
> **Parent page:** [clients-list.md](clients-list.md)

### 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![client-dashboard](screenshots/client-dashboard.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the dashboard for a single user/agent, opened by clicking a row in the clients list. At the top there are quick-action buttons for that user (cash receive/pay, ledgers, direct agents/clients, coin history), and below them the user's Coins (balance) and Rs. Exposure (settlementAmount) cards. It is a hub/navigation page from which all the further user-specific pages are opened.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → SC → `{{ data?.mstrname }}`.
- **Box "Agent Match Dashboard"** (button row; all buttons navigate with that user's `userId`/`userTypeId`/`parentId`):
  - **Recieve Cash** — `recieve-pay-cash` (componentType `receiveCash`).
  - **Pay Cash** — `recieve-pay-cash` (componentType `payCash`).
  - **Ledger** — `chip-history-user`.
  - **Cash Ledger** — `chip-history-user` (`filterCash: 'All', typeId: 50`).
  - **Match ledger** — `ledger-match-summary`.
  - **Direct Agents** — `users` (`category: 'agent', actionType: 'd'`) — only when `usetype != 2 && usetype != 3`.
  - **Direct Client** — `users` (`category: 'client'`) — only when `usetype != 3`.
  - **Coin History** — `coinHistory`.
- **Cards row (below):**
  - **Coins** — `data?.balance`.
  - **Rs. Exposure** — `data?.settlementAmount`.
  - **Coins Exposure** — present in the card code but `display:none` (hidden).
- **Buttons:** the action buttons above are the only ones.
- **Table columns:** no table.
- **Modals / dialogs:** no modal (all routerLink navigation).

### Sub-pages

All the routes below go to `urlType`-prefixed routes (`urlType` derived from the logged-in user's usetype: company/super-admin/sub-admin/super-master/master/dealer/client/super-duper-admin):

- **recieve-pay-cash** — from the "Recieve Cash" / "Pay Cash" buttons (cash collection / settlement page).
- **chip-history-user** — from the "Ledger" and "Cash Ledger" buttons (chip/cash ledger page).
- **ledger-match-summary** — from the "Match ledger" button (match-wise ledger summary).
- [clients-list.md](clients-list.md) (`users` route) — from the "Direct Agents" (`category=agent`) and "Direct Client" (`category=client`) buttons — the same Users component, showing the list of agents/clients under this user.
- **coinHistory** — from the "Coin History" button (coin transaction history).

> Note: some of these (recieve-pay-cash, chip-history-user, ledger-match-summary, coinHistory) are separate components; this "list-of-clients" doc set covers only clients-list and client-dashboard, the rest are documented in their respective docs.

### Actions

- Receive/pay cash for the selected user.
- View Ledger / Cash Ledger / Match ledger / Coin History.
- Go to the list of this user's direct agents or direct clients.
- View Coins (balance) and Rs. Exposure (read-only cards).

### Data Source (Technical)

- **API:** `GET /users/{userId}` (`getUserData` — loads that user's details into `data` on page load). All other data is loaded by the target sub-pages themselves.
- **Socket:** no socket event.

---


## Live Matches

> **Menu path:** Sidebar → Live Matches
> **Route:** `/super-duper-admin/dashboard`
> **Query params:** None
> **Component:** `src/app/dashboard/dashboard.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![live-matches](screenshots/live-matches.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page shows a sport-wise list of live / upcoming matches. From here the admin can block/unblock an entire sport or an individual match, view a match's Live Report, and block users on a specific match. The data is updated in real time via socket. **Clicking a match name (Title)** opens its "Agent Match Dashboard" (hub page).

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches.
- **Inplay / Upcoming buttons:** Two buttons at the top ("Inplay", "Upcoming") — currently UI-only buttons.
- **Sport tabs / buttons:** A grid of sport buttons (from the `sports` array). Clicking one loads that sport's matches (`getMatches`). Cricket (id 4) loads by default. Some sport ids are filtered out (`[1233,1234,1235,1236,4339,7,77,11,6]`); `7` and `4339` are treated as Horse-racing.
- **All-sport toggle:** Above the selected sport table, a `mat-slide-toggle` "All {sport name}" — activates/deactivates the entire sport (`updateSport`, with a confirm prompt).
- **Table columns (normal sports — Cricket/Soccer/Tennis):**
  - `#` — match block toggle (`blockMatch`) + (when usetype is `0` or `11`) a "Block Match" icon button (`person_off`) that opens the Block User panel.
  - `ID` — `matchId`.
  - `Title` — match name link → `live-game-detials` page (query: `matchId, marketId, sportId, matchName, matchStartDate, pageType: 'liveMatches'`).
  - `Sport` — CRICKET / Soccer / Tennis (SportID 4/1/2).
  - `DATE` — match date/time.
  - `Action` — "LiveReport" button → `my-markets` page (query: `matchId, marketId, sportId, matchStartDate`).
- **Horse racing layout (separate card):** match name, active toggle, country code, and for each time slot a time button (→ `my-markets`) + a "Bets" button (→ `current-bets`).
- **"No Data Available"** message when the list is empty and not loading.
- **Modal / dialog — "Block User"** (`#blockUsers` template):
  - **Search User** input field (`blockUserInput$`).
  - **Type** dropdown — ALL / Block / Unblock (`blockFilter$`).
  - Users table — columns: checkbox (`select`), `User ID` (`mstruserid`).
  - **Save** button (`saveBlockUsers`).

### Sub-pages

- [Agent Match Dashboard](agent-match-dashboard.md) — opens when you click a match's **Title (name) link** (hub page).
- [Live Report (My Markets)](live-report.md) — opens via the row's **"LiveReport"** button (or also via the hub's "Live Report" button).

### Actions

- Select a sport and view that sport's matches.
- Activate/deactivate an entire sport (with a confirm prompt).
- Block/unblock an individual match (toggle, with a confirm prompt).
- Block/unblock specific users on a match (from the Block User dialog, with search + filter).
- Open a match's Agent Match Dashboard (Title link) or Live Report (LiveReport button).
- For horse racing, open My Markets / Bets per time slot.

### Data Source (Technical)

- **API:** `POST /dashboard` (`sport_id`), `PUT /sports/{id}` (active toggle), `POST /blockedMatches` (match block/unblock), `GET /blockedMatchUsers` / `POST /blockedMatchUsers`, `GET /blockedMarketUsers` / `POST /blockedMarketUsers`, `GET /allUsers` (user search).
- Sports list comes from `DataService.getSports()`.
- **Socket:** emit `room` (`DASHBOARD_UPDATE_ADMIN`), per-marketId `joinRoom` / `leaveRoom`. On `DASHBOARD_UPDATE_ADMIN` → matches refresh (`getMatches`), on `message` → live odds update (`updateData`).

---


## Agent Match Dashboard (Match name click)

> **Menu path:** Sidebar → Live Matches → click a match's **Title (name) link**
> **Route:** `/super-duper-admin/live-game-detials`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`, `matchStartDate`, `pageType` (here `'liveMatches'`)
> **Component:** `src/app/live-game-detials/live-game-detials.component.ts` (+ `.html`)
> **Parent page:** [Live Matches](live-matches.md)

## 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![agent-match-dashboard](screenshots/agent-match-dashboard.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is a small navigation / hub page ("Agent Match Dashboard"). It opens when you click a match name from Live Matches. No data table or odds are shown here — only buttons (links) to that match's related report / action pages. From here the user moves on to Bet Slips, Session Bet Slip, Live Report, Collection Report, etc. Each button forwards the same `matchId / marketId / sportId / matchName` query params. There are no API calls or sockets.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches". Breadcrumb: Dashboard → Matches → `{{ matchName }}`.
- **Header info bar:** An ibox panel with the large heading **"Agent Match Dashboard"**.
- **Tabs / sections:** No tabs. Just a single center-aligned button group (`btn btn-primary btn-lg`).
- **Inputs / toggles / tables / modals:** None.

#### Buttons (each is a router link)

Button visibility when arriving with `pageType = 'liveMatches'`:

| Button | Route | Query params | Shown in `liveMatches`? |
|---|---|---|---|
| **Bet Slips** | `betslips-tables` | `matchId, marketId, sportId, matchName` | ✅ Yes |
| **Session Bet Slip** | `sessionbetslips` | `matchId, matchName` | ✅ Yes |
| **Live Report** | `my-markets` | `matchId, marketId, sportId, matchStartDate` | ✅ Yes |
| **Collection Report** | `collection-report` | `matchId, matchName` | ✅ Yes |
| Client Report | `client-report` | `matchId` | ❌ Hidden (shown only when `pageType != 'liveMatches'`) |
| Company Report | `company-report` | `matchId` | ❌ Hidden (when `useType !== 0` AND `pageType != 'liveMatches'`) |
| Session Earning Report | `session-earning-report` | `matchId` | ❌ Hidden (shown only when `pageType != 'liveMatches'`) |

> **Note:** Because entry from Live Matches always carries `pageType = 'liveMatches'`, in this case **only Bet Slips, Session Bet Slip, Live Report, and Collection Report** are shown. Client Report, Company Report, and Session Earning Report remain **hidden**.

### Sub-pages

Sub-pages of the buttons visible in `liveMatches` mode:

- [Bet Slips](bet-slips.md) — via the "Bet Slips" button.
- [Session Bet Slip](session-bet-slip.md) — via the "Session Bet Slip" button.
- [Live Report (My Markets)](live-report.md) — via the "Live Report" button.
- [Collection Report](collection-report.md) — via the "Collection Report" button.

### Actions

- View Bet Slips for the match.
- View the Session Bet Slip.
- Open the Live Report (My Markets) page.
- View the Collection Report.
- (Only in non-liveMatches mode) Open Client / Company / Session Earning Report.

### Data Source (Technical)

- **API endpoints:** None. This page only reads `ActivatedRoute.queryParams` and renders buttons.
- **Base URL:** Buttons build their routes by prefixing `dataService.url` (component variable `url`).
- **User type:** `useType` is set from `authService.user.usetype` (only for button visibility).
- **Socket:** None.

---


## Bet Slips

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Bet Slips**
> **Route:** `/super-duper-admin/betslips-tables`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`
> **Component:** `src/app/betslips-tables/betslips-tables.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![bet-slips](screenshots/bet-slips.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page shows all bets of a match's **match-odds type markets** (Match Odds, Bookmaker, Toss, Tied, Goals, etc.) in a market-wise tab layout. On each market tab you get that market's **Market Position** (runner-wise P/L) and a **Bet Slips table** (each bet's detail, runner-wise position, my-share, and final plus/minus). User-wise filtering and pagination are also available. (This is not for fancy/session bets — the Session Bet Slip page handles those.)

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Bet Slips.
- **Top summary cards (4):** Total Bets, Settled Bets, Unsettled Bets, Reverted Bets (always 0). Values from `counts` (`/bets` response). (Inside the selected tab, these same 4 cards repeat with that market's `settled_bets_count`/`unsettled_bets_count`.)
- **Market tabs (nav-tabs):** `tabs` = all markets' `market_name`. Tab click → loads that market's data (`selectTab`).
- **User filter:** "All User" dropdown — unique `UserName` from the selected market's bets (`onUserChange`).
- **Market Position table:** columns — RUNNER (`selectionName`), POSITION (`winValue + lossValue`). Data from `POST /plByMarket`.
- **Bet Slips table columns:** `#` (serial), Date (`MstDate`), Market Title (`marketName`), Rate (`Odds`), Amount (`Stack`), Mode (Lay→KHAI / else LAGAI), Runner Name (`selectionName`), user (`UserName (mstrname)`), **per-runner Position columns** (`Position{n}` — runner-wise value via `getRunnerValue`), My Share (`myShare %`), **per-runner Share columns** (`Share{n}` — via `getMyShare`), status (Settled→Declared badge / else Pending), plusMinus (final share for settled bets). The footer shows Amount total, runner totals, share totals, and settled plus/minus total.
- **Pagination:** `mat-paginator`, page sizes 10/25/50/100.
- **Modals / dialogs:** None.

### Sub-pages

No sub-pages.

### Actions

- Switch market tabs to view each market's bets.
- Filter bets by user.
- View market position, runner-wise position, and my-share.
- View settled/unsettled status and plus-minus.
- Load more bets via pagination.

### Data Source (Technical)

- **API:** `GET /matches/{matchId}/markets` (markets + tabs + runner_json), `POST /plByMarket` (`matchId`, `MarketId[]`) — market position, `GET /bets` (params: `matchId, marketId, page, search, afterResult=yes, limit`) — bets + `counts` + pagination `meta`.
- My-share is calculated client-side (`getMyShare`) based on the logged-in user's `mstrid` and the bet's share hierarchy (Company/Admin/SAdmin/SMaster/Master/Dealer).
- **Socket:** None.

---


## Session Bet Slip

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Session Bet Slip**
> **Route:** `/super-duper-admin/sessionbetslips`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/sessionbetslips/sessionbetslips.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![session-bet-slip](screenshots/session-bet-slip.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page shows all of a match's **Fancy / Session bets** in a single table. Each session bet's detail — session title (selectionName), runs (Odds), amount, No/Yes mode, No/Yes position, my-share, and final plus/minus — is displayed. User-wise and Fancy(session)-wise filtering and pagination are available. (For match-odds type bets there is a separate [Bet Slips](bet-slips.md) page.)

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Session Bet Slips.
- **Top summary cards (4):** Total Bets, Settled Bets, Unsettled Bets, Reverted Bets (always 0). Values from `counts` (`/bets` response).
- **Filters (2 dropdowns):**
  - **All User** — unique `UserName` (`onUserChange`).
  - **All Fancy** — unique session names `selectionName` (`onFancyChange`).
- **Bet Slips table columns:** `#` (serial), betId (`MstCode`), Date (`MstDate`), user (`UserName (mstrname)`), sessionTitle (`selectionName`), runs (`Odds`), amount (`Stack`), mode (Lay→No / else Yes), no (`-getNoValue`), yes (`getNoValue`), My Share (`myShare %`), noPosition, yesPosition (`getMyShare` based on Lay/Back), status (Settled→Declared / else Pending), plusMinus (result-based win/loss share for settled session bets).
- **Footer totals:** Total label, Total Amount (`Stack`), Total No, Total Yes, Total Share No/Yes, and settled plus/minus total.
- **Pagination:** `mat-paginator`, page sizes 10/25/50/100.
- **Modals / dialogs:** None.

### Sub-pages

No sub-pages.

### Actions

- View session/fancy bets.
- Filter user-wise and Fancy(session)-wise.
- View No/Yes position, my-share, and settled plus/minus.
- Load more bets via pagination.

### Data Source (Technical)

- **API:** `GET /bets` (params: `matchId, page, search, afterResult=yes, limit, type=fancy`) — fancy bets + `counts` + pagination `meta`.
- Plus/minus and position are calculated client-side: `getNoValue`, `getMyShare`, `getTotalPlusMinus` (win/loss is decided from result `tblresult_result` vs the bet's `Odds`, by the Lay/Back combination).
- **Socket:** None.

---


## Live Report (My Markets)

> **Menu path:** Sidebar → Live Matches → row's **"LiveReport"** button **OR** match Title → Agent Match Dashboard → **Live Report**
> **Route:** `/super-duper-admin/my-markets`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchStartDate`
> **Component:** `src/app/my-markets/my-markets.component.ts` (+ `.html`) — sub-panels: `src/app/my-markets/fancies/fancies.component.*` and `src/app/my-markets/line/line.component.*`
> **Parent page:** [Live Matches](live-matches.md) (also opens from [Agent Match Dashboard](agent-match-dashboard.md))

## 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![live-report](screenshots/live-report.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the match's main **live management / monitoring dashboard**. All markets of a single match (Match Odds, Bookmaker, Toss, Goals, manual markets) are shown with real-time odds, plus Fancy and Line sessions in cricket. From here the admin views live odds, suspends/activates markets, places manual bets, declares results, blocks users, and browses bets of every category (Match/Bookmaker/Fancy/Toss/Tied/Goals + deleted bets). The data updates live over socket and bets refresh every 5 seconds.

> Note: This is the same page that opens both from the "LiveReport" button in the Live Matches list and from the "Live Report" button on the Agent Match Dashboard.

### On-screen Layout (UI)

#### Title / breadcrumb
- Heading **"LIVE MATCH REPORT"**. Breadcrumb: Dashboard → Matches → Live Report.

#### Header info / match info bar
- **Score board iframe** (at the top): `scoreUrl` (based on `matchId`), height ~145.
- **Live TV** toggle: clicking the TV icon opens/closes the live TV iframe (`getLiveTv()` / `closeTv()`), source `matchData.tvUrl`.
- **Match name card** (only for `usetype == 0`): match name + date, and action icons on the right side:
  - **Match active toggle** — activate/deactivate (`changeStatus`).
  - **In play** play icon (when inPlay && status OPEN).
  - **Fancy on/off** "F" button (only SportID 4 / cricket) — `saveFancy()` / `deActivateFancy()`.
  - **Toss on/off** — `addBookmaker('Toss')` / `removeBookmaker('Toss')`.
  - **Bookmaker on/off** — `addBookmaker('Bookmaker')` / `removeBookmaker('Bookmaker')`.
  - **Goals market add** (only sportId == 1 / soccer) — `addGoalsMarket()`.
  - **Block user** (`person_off`, usetype 0/11), **Match Settings** (usetype 0/55), **Add Market** (+).

#### Markets cards (one panel per market)
- **Toolbar:** market_name + (Min/Max stack if set).
- **Manual market controls** (usetype 0, is_manual==1): Ball Running checkbox, Suspend checkbox, diff value input, In-play alarm, multiplier buttons (-10..+10) to set odds (`setX`).
- **Right-side buttons:** Bookmaker manual toggle; market active toggle (`changeMarketStatus`); **Declare Result** trophy icon (`initResultForm`); **Block user**; **Market Settings**; **Book** icon (user position modal, `getUserPositionModal`).
- **Odds table columns:** RUNNER, LAGAI (back0), KHAI (lay0; 0 in Toss), POSITION (`odds.pl`). Suspend/Lock overlay when the runner/market is not ACTIVE.

#### Fancy panel (`app-fancies`) — only SportID 4, 6, or 11
- "Fancy" toolbar + tabs All / Session(Line) / Result Waiting (usetype 0), diff value, Company settings (usetype 11), Add Fancy (+).
- **Columns:** SESSION (HeadName + liability + controls), No (lay), Yes (back), Pos NO, Pos Yes, Action (POSITION button).

#### Line panel (`app-line`)
- Panel for cricket line/session markets (`app-line`), with a fancy-like No/Yes structure.

#### Tables
- **Declared Sessions** — SESSION / Result / Status (PnL) + Total footer + paginator.
- **Declared Toss** (when toss is declared) — MARKET / Result / POSITION + total.
- **Current User Position** — Account (drill-down) / TeamA / TeamB / The Draw (when there are 3 runners).

#### Bets section
- **Bet type tabs** (usetype != 55): All (disabled), Bookmaker Bets, Fancy Bets (sportId 4), Toss Bets, Tied Bets, Match Bets, Goal Bets, + Delete BM Bets / Delete Fncy Bets for usetype 0.
- **Search** input (debounced).
- **Bets table columns:** Action (Delete / Revoke), Username (→ parents), BetFor, Odds, Stack, PL, Date, Address (ip). Paginator.

#### Modals / dialogs
- Current User Position, Parents, Block User, Settings (match + market formly), Add Bet (manual), Declare Result, Add Market. The Fancy panel also has its own modals (Add Bet, Fancy Bets, Score Position, Result, Add Fancy, Block User, Settings, Parents).

### Sub-pages

No separate route-level sub-page. Inside, the `app-fancies` and `app-line` child components are embedded, plus several modals/dialogs (listed above).

### Actions

- View the live score board and live TV.
- Activate/deactivate the match, turn Fancy/Toss/Bookmaker on-off, add the Goals market.
- Per-market active toggle, suspend/ball-running, set manual odds, set in-play.
- Place a manual bet on a manual market (back/lay, odds, stake, password).
- Declare a market / match / fancy result.
- Block/unblock users at the match/market/fancy level.
- Update Match and Market settings; add a new manual market / fancy.
- Browse + search bets across the category tabs; delete a bet (password) / revoke a bet.
- View account-wise user position and parents; view Declared Sessions/Toss/Fancy positions.

### Data Source (Technical)

#### my-markets endpoints
- `GET /matches/{matchId}` (+ marketId) — match detail; `GET /matches/{matchId}/markets` — markets + runners.
- `GET /getBetLock`, `GET /declaredResults/toss`.
- Bets (tab-wise): `GET /bookmakerBets`, `/fancyBets`, `/tossBets`, `/tiedMatchBets`, `/matchOddsBets`, `/goalsBets`, `/bookmakerDeletedBets`, `/fancyDeletedBets`.
- `POST /plByMarket` (positions), `POST /profitLossByMatch` (declared sessions), `POST /removeBet`, `POST /revokeBet`, `POST /getParents`.
- Block: `GET/POST /blockedMatchUsers`, `GET/POST /blockedMarketUsers`; `POST /blockedMatches`.
- `POST /toggleManualActivation`, `PUT /matches/{MstCode}`, `PUT /markets/{marketId}` (settings), `POST /manualMarketBet`, `POST /addBookmaker`, `POST /removeBookmaker`, `POST /activateFancy`, `POST /deActivateFancy`, `POST /results`, `POST /manualMarket`, `POST /addGoalMarkets`, `POST /setBetLock`, `GET /allUsers`.

#### Fancy panel (fancies.component)
- `GET /matches/{matchId}/fancies`, `POST /fancyLiability`, `GET /fancyBets`, `GET /allUsers`, block `GET/POST`, `POST /toggleManualActivation`, `PUT` settings, fancy result `POST`, `POST /addManualFancy`, manual fancy bet `POST`.

#### Socket events
- **emit:** `UPDATE_MARKETS`, `room` (`MARKET_UPDATE_DATA:{matchId}`, `BETS_UPDATE_DATA:{mstrid}_{matchId}`), `MANUAL_DATA`.
- **on:** `UPDATE_MARKETS{matchId}`, `BETS_UPDATE_DATA:{mstrid}_{matchId}`, `MARKET_UPDATE_DATA:{matchId}`, `message` (live odds stream).
- **Line/Fancy:** emit `UPDATE_FANCY`, `room` (`FANCY{matchId}`), `MANUAL_FANCY_DATA`; on `UPDATE_FANCY{matchId}`, `message`, `LINE_BOOK_UPDATE:{mstrid}:{matchId}`.
- **Polling:** `getBets()` every 5 sec.

---


## Collection Report

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Collection Report**
> **Route:** `/super-duper-admin/collection-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/collection-report/collection-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![collection-report](screenshots/collection-report.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page shows a **specific match's** chip summary in two columns — which client you need to **receive money from** (Payment Receiving From / Lena Hai) and which client you need to **pay money to** (Payment Paid To / Dena Hai). Each column is a table containing the client's name and their current balance, plus a total in the footer. ("Own", "Cash", and "Own Commission" rows are filtered out.)

> Note: This is the chip summary for the logged-in user (`mstrid`) for that match. (The sidebar "Collection Report" — route `collection-report-all` — is a different page that shows the entire account's balance in three groups.)

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Collection Report.
- **Two columns (ibox cards):**
  - **PAYMENT RECEIVING FROM (Lena Hai)** — data `minusData`.
  - **PAYMENT PAID TO (Dena Hai)** — data `plusData`.
- **Table columns (each card):** Client Name (`mstruserid (mstrname)`), Current Balance (left: `Musum`, right: `PUsum`). Footer shows "Total" + amount (`DataService.getTotal`).
- **Inputs / filters / buttons:** None — data loads on page load.
- **Modals / dialogs:** None.

### Sub-pages

No sub-pages.

### Actions

- View, match-wise, which client to receive from and which to pay.
- View each column's total balance.

### Data Source (Technical)

- **API:** `POST /chipSummary` (`mstrid` = logged-in user, `matchId`) — response `data.minusData` (Lena Hai) and `data.plusData` (Dena Hai). Client-side filter: `Own`, `Cash`, `Own  Commission` rows are removed.
- **Socket:** None.

---


## Completed Matches

> **Menu path:** Sidebar → Completed Matches
> **Route:** `/super-duper-admin/completedMatchesList`
> **Query params:** none
> **Component:** `src/app/completed-matches-list/completed-matches-list.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![completed-matches](screenshots/completed-matches.png)

> _Screenshot pending — placeholder. Capture a screenshot from the live site and replace the image above._

### Purpose

This page shows a profit/loss report for settled (completed) matches, filtered by date range and sport. Each match row can be expanded to view its market-wise PL/Comm, and bet history can also be opened from there. Clicking the title of a Cricket match (sport_id == 4) opens its **Agent Match Dashboard** (settled match hub).

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches" — breadcrumb: Dashboard → Matches.
- **Filters / inputs:**
  - `From Date` — date picker (default: 10 days before today / `dayjs().add(-10,'days')`).
  - `To Date` — date picker (default: today).
- **Buttons:**
  - `Load` — reloads data for the selected date range (`getTypeData(1)`).
  - Sport tabs (`All` + each sport name) — sport-wise filter; clicking a tab reloads data. Default sport `currentSportId = 4` (cricket).
  - Expand button (`add` / `remove` icon) — expands the row and fetches market-wise detail (`innercollapse`).
- **Table columns (outer):** `DATE/TIME` (settle_date), `Match Id` (matchId), `Match Title` (EventName — clickable link only for cricket `sport_id == 4` → `live-game-detials`), `Won By` (declaredResult.selectionName), `PL` (PnL, green/red), `Comm` (green/red). Footer row: `Total` + TotalPL + TotalComm.
- **Inner (expanded) table columns:** `Market Name`, `PL`, `Comm`, `CreatedOn` (MstDate), `Action` (`Show Bet` button → `bet-history`).
- **Loader:** `mat-spinner` while data is loading.
- **Modals / dialogs:** No dialog — only inline expandable rows.

> ℹ️ Note: A "Ledger" button exists in the code but it is **commented out** (`ledger-match-wise` link). Its detail is in ledger-match-wise.md below.

### Sub-pages

- [Agent Match Dashboard](agent-match-dashboard.md) — opens when a cricket match title is clicked (settled match hub, all report buttons).
- [Bet History](bet-history.md) — opens from the `Show Bet` button in the expanded inner table.
- [Ledger (match-wise)](ledger-match-wise.md) — "Ledger" button (currently commented out + route not registered).

### Actions

- Select From/To dates and run the report with `Load`.
- Filter sport-wise (or All) using the sport tabs.
- Expand a match to view its market-wise PL/Comm detail.
- Click a cricket match title to open the Agent Match Dashboard.
- Click `Show Bet` from an expanded row to view a user's bet history.
- View total PL and total Comm in the footer.

### Data Source (Technical)

- **API:**
  - `POST /profitLoss` (body `{ userId, fromDate, toDate, page, sportId, limit }`) — completed matches PL list (paginated; `meta` contains total/current_page/per_page).
  - `POST /profitLossByMatch` (body `{ sportId, userId, matchId, fromDate, toDate }`) — market-wise detail on expand.
  - The sports list comes from `dataService.getSports()`.
- **Socket:** none.

---


## Agent Match Dashboard (Settled Match Hub)

> **Menu path:** Sidebar → Completed Matches → (click cricket match title)
> **Route:** `/super-duper-admin/live-game-detials`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`, `matchStartDate` _(NOTE: **`pageType` is NOT passed** from here → so it opens in "settled match" mode)_
> **Component:** `src/app/live-game-detials/live-game-detials.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![agent-match-dashboard](screenshots/agent-match-dashboard.png)

> _Screenshot pending — placeholder. Capture a screenshot from the live site and replace the image above._

### Purpose

This is a **hub / launcher page** containing large buttons for all of a particular match's reports and bet-slip pages. The same component is also used in the Live Matches section, but **when arriving from completed matches the `pageType` query param is not sent**, so here all report buttons (Client Report, Company Report, Session Earning Report) are visible too — in the Live Matches version these are hidden.

### Difference from the Live Matches version (IMPORTANT)

In `live-game-detials.component.html` the buttons are shown conditionally:

| Button | Condition | Completed Matches (no pageType) | Live Matches (pageType = 'liveMatches') |
|---|---|---|---|
| Bet Slips | always | ✅ | ✅ |
| Session Bet Slip | always | ✅ | ✅ |
| Live Report | always | ✅ | ✅ |
| Client Report | `pageType != 'liveMatches'` | ✅ | ❌ |
| Collection Report | always | ✅ | ✅ |
| Company Report | `useType !== 0 && pageType != 'liveMatches'` | ✅ (if useType ≠ 0) | ❌ |
| Session Earning Report | `pageType != 'liveMatches'` | ✅ | ❌ |

> In other words, arriving from Completed Matches shows the **full button set** (Company Report only when the logged-in user's `useType !== 0`).

### On-screen Layout (UI)

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
- **Modals / dialogs:** none — only navigation buttons.

### Sub-pages

- [Bet Slips](bet-slips.md) — match bet slips (odds/bookmaker/toss markets).
- [Session Bet Slip](session-bet-slip.md) — fancy/session bets.
- [Live Report](live-report.md) — `my-markets` market-wise live report.
- [Client Report](client-report.md) — PL/commission by agent hierarchy.
- [Collection Report](collection-report.md) — collection (receiving/paying) summary.
- [Company Report](company-report.md) — company-level report. ⚠️ route not registered.
- [Session Earning Report](session-earning-report.md) — session earning report.

### Actions

- Navigate to any of the match's report / bet-slip pages (button click).

### Data Source (Technical)

- **API:** This page itself makes no API call — it only reads the match params from `ActivatedRoute.queryParams` and builds the base route from `dataService.url`. Each destination page fetches its own data.
- **Socket:** none.

---


## Bet Slips

> **Menu path:** Agent Match Dashboard → Bet Slips
> **Route:** `/super-duper-admin/betslips-tables`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`
> **Component:** `src/app/betslips-tables/betslips-tables.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. -->
![bet-slips](screenshots/bet-slips.png)

> _Screenshot pending — placeholder._

> ℹ️ **The detail is the same as the Live Matches version — see [../live-matches/bet-slips.md](../live-matches/bet-slips.md).**

### Purpose

Shows the bets for all of the match's markets (odds / bookmaker / toss / tied) tab-wise, calculating the runner-wise position and "my share" for each bet. Bets are fetched even for a settled match (`afterResult=yes`).

### On-screen Layout (UI)

- **Market tabs:** each market name (from `/matches/{matchId}/markets`).
- **PL by market** mini table (runner / position).
- **Bet slip table columns:** `serialNo`, `date`, `marketTitle`, `rate`, `amount`, `mode`, `runnerName`, `user`, dynamic `Position{n}`, `myShare`, dynamic `Share{n}`, `status`, `plusMinus`.
- **User filter** dropdown.
- **Paginator.**

### Sub-pages
No sub-page.

### Data Source (Technical)

- **API:** `GET /matches/{matchId}/markets`, `GET /bets?...&afterResult=yes`, `POST /plByMarket`.
- **Socket:** none.

---


## Session Bet Slip

> **Menu path:** Agent Match Dashboard → Session Bet Slip
> **Route:** `/super-duper-admin/sessionbetslips`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/sessionbetslips/sessionbetslips.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. -->
![session-bet-slip](screenshots/session-bet-slip.png)

> _Screenshot pending — placeholder._

> ℹ️ **The detail is the same as the Live Matches version — see [../live-matches/session-bet-slip.md](../live-matches/session-bet-slip.md).**

### Purpose

Shows the match's **fancy / session bets**, calculating the yes/no position, my-share and settled plus/minus for each bet. Data is fetched even for a settled match (`afterResult=yes`, `type=fancy`).

### On-screen Layout (UI)

- **Fancy table columns:** `serialNo`, `betId`, `date`, `user`, `sessionTitle`, `runs`, `amount`, `mode`, `no`, `yes`, `myShare`, `noPosition`, `yesPosition`, `status`, `plusMinus`.
- **Filters:** User dropdown (`All User`), Fancy dropdown (`All Fancy`).
- **Paginator** + loader.

### Sub-pages
No sub-page.

### Data Source (Technical)

- **API:** `GET /bets?matchId=...&type=fancy&afterResult=yes&page=...&limit=...`.
- **Socket:** none.

---


## Live Report (My Markets)

> **Menu path:** Agent Match Dashboard → Live Report
> **Route:** `/super-duper-admin/my-markets`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchStartDate`
> **Component:** `src/app/my-markets/my-markets.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. -->
![live-report](screenshots/live-report.png)

> _Screenshot pending — placeholder._

> ℹ️ **The detail is the same as the Live Matches version — see [../live-matches/my-markets.md](../live-matches/my-markets.md).**

### Purpose

Shows the match's market-wise live report (`my-markets`) — with runners, positions and exposure. When opened from a completed match the same component is used (live odds after settlement).

### On-screen Layout (UI)

- Market / runner-wise report tables (detail in the Live Matches doc).
- Match param-based heading.

### Sub-pages
No sub-page.

### Data Source (Technical)

- **API:** the `my-markets` component's endpoints (detail: ../live-matches/my-markets.md).
- **Socket:** socket for live data (detail in the Live Matches doc).

---


## Collection Report

> **Menu path:** Agent Match Dashboard → Collection Report
> **Route:** `/super-duper-admin/collection-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/collection-report/collection-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. -->
![collection-report](screenshots/collection-report.png)

> _Screenshot pending — placeholder._

> ℹ️ **The detail is the same as the Live Matches version — see [../live-matches/collection-report.md](../live-matches/collection-report.md).**

### Purpose

Shows the collection summary after a match — from which client money is to be **received (Plus / Receiving)** and to whom money is to be **paid (Minus / Paying)**. Internal entries such as `Own`, `Cash`, `Own Commission` are filtered out.

### On-screen Layout (UI)

- **Receiving (Plus) table columns:** `clientName`, `currentBalance`.
- **Paying (Minus) table columns:** `clientName`, `currentBalance`.
- **Modals / dialogs:** none.

### Sub-pages
No sub-page.

### Data Source (Technical)

- **API:** `POST /chipSummary` (body `{ mstrid, matchId }`) → `res.data` (`plusData` / `minusData`).
- **Socket:** none.

---


## Client Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Client Report
> **Route:** `/super-duper-admin/client-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/client-report/client-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![client-report](screenshots/client-report.png)

> _Screenshot pending — placeholder. Capture a screenshot from the live site and replace the image above._

### Purpose

This page shows a profit/loss, commission and share report for a match, broken down **by agent hierarchy (client, dealer, master, super master, sub admin, admin)**. A separate table is built for each level below the logged-in user.

### On-screen Layout (UI)

- **Title / breadcrumb:** match-name based heading.
- **Tables (built after filtering by usetype):**
  - User/Client list (`usetype == 3`)
  - Dealer list (`usetype == 2`)
  - Master list (`usetype == 1`)
  - Super Master list (`usetype == 8`)
  - Sub Admin list (`usetype == 9`)
  - Admin list (`usetype == 10`)
- **Table columns (same for all tables):** `UserNm`, `MatchPlusMinus`, `SessionPlusMinus`, `TotalPlusMinus`, `MatchCommission`, `SessionCommission`, `TotalCommission`, `Net`, `AgentShare`, `FinalShare`.
- **Modals / dialogs:** none.

### Sub-pages

No sub-page.

### Actions

- View the PL / commission / share for each agent level of the match (read-only report).

### Data Source (Technical)

- **API:** `GET /agentReport?userId={mstrid}&matchId={matchId}` → response `res.agentData` (array). The component filters it by `usetype` to build the separate lists.
- **Socket:** none.

---


## Company Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Company Report
> **Route:** `/super-duper-admin/company-report`
> **Query params:** `matchId` (+ the component also reads `matchName`)
> **Component:** `src/app/company-report/company-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![company-report](screenshots/company-report.png)

> _Screenshot pending — placeholder. Capture a screenshot from the live site and replace the image above._

> ⚠️ **This route was not found registered in the routing module** — the `company-report` path is not registered in `super-duper-admin-routing.module.ts`. The component file (`company-report.component.ts`) and the Agent Match Dashboard button (`*ngIf="useType !== 0 && pageType != 'liveMatches'"`) both exist in the code, but because the route is not configured, clicking the button will not load the page properly until the route is added.

### Purpose

This page shows a **company-level** profit/loss, commission and share breakdown for a match (match + session combined, system PL, my share, company share).

### On-screen Layout (UI)

- **Top header row:** `blank`, `PlusMinus`, `COMMISSION`, `OTHERS` (grouped header).
- **Company table columns:** `cName`, `matchPlusMinus`, `sessionPlusMinus`, `total`, `sesStake`, `matchCommission`, `sessionCommission`, `totalCommission`, `systemPlusMinus`, `share`, `myShare`, `companyShare`.
- **Modals / dialogs:** none.

### Sub-pages

No sub-page.

### Actions

- View the company-level financial summary of the match (read-only).

### Data Source (Technical)

- **API:** `GET /companyReport?userId={mstrid}&useType={useType}&matchId={matchId}` → response `res.data`.
- **Socket:** none.

---


## Session Earning Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Session Earning Report
> **Route:** `/super-duper-admin/session-earning-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/session-earning-report/session-earning-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![session-earning-report](screenshots/session-earning-report.png)

> _Screenshot pending — placeholder. Capture a screenshot from the live site and replace the image above._

### Purpose

This page shows an agent-wise report of a match's **session (fancy) earnings** — session PL, session commission, net total, share amount and final.

> ℹ️ Note: The component has old commented-out code that used `GET /sessionEarningReport` and built separate tables by usetype 11/10/9/8/1/2/3. The **active code** now fetches data from `GET /agentReport` (the same endpoint as Client Report), currently using the raw `data` array.

### On-screen Layout (UI)

- **Table columns (`column1`):** `UserNm`, `Session`, `CommSession`, `netTotal`, `shrAmt`, `final`.
- **Modals / dialogs:** none.

### Sub-pages

No sub-page.

### Actions

- View the agent-wise breakdown of the match's session/fancy earnings (read-only).

### Data Source (Technical)

- **API:** `GET /agentReport?userId={mstrid}&matchId={matchId}` → response `res.agentData` (`this.data`).
  - _(Legacy/commented: `GET /sessionEarningReport` → `res.sessionEarningData`.)_
- **Socket:** none.

---


## Ledger (Match-wise)

> **Menu path:** Sidebar → Completed Matches → (row) → Ledger button
> **Route:** `/super-duper-admin/ledger-match-wise`
> **Query params:** `name`, `matchId`, `userid`, `parentId`
> **Component:** `src/app/ledger-match-wise/ledger-match-wise.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![ledger-match-wise](screenshots/ledger-match-wise.png)

> _Screenshot pending — placeholder. Capture a screenshot from the live site and replace the image above._

> ⚠️ **This route was not found registered in the routing module** — the `ledger-match-wise` path is not registered in `super-duper-admin-routing.module.ts`. The component file (`ledger-match-wise.component.ts`) exists, but on the list page (`completed-matches-list.component.html`) the "Ledger" button that navigates to this route is **commented out**. So the page exists in the code, but neither is the route configured nor is the button visible. (Note: similar registered routes `ledger-match-summary` and `ledger-tables` do exist.)

### Purpose

This page shows a user's match-wise (or overall, if matchId is blank) **chip/ledger history** — credit/debit entries with narration.

### On-screen Layout (UI)

- **Title:** username (from the `name` param).
- **Table columns (`columns`):** `Date`, `narration`, `Credit`, `Debit`.
- **Paginator:** MatPaginator (client-side `MatTableDataSource`).
- **Modals / dialogs:** none.

### Sub-pages

No sub-page.

### Actions

- View and paginate the user's ledger entries (credit/debit) (read-only).

### Data Source (Technical)

- **API:** `POST /chipHistoryID` (body `{ userId: params.userid, parentId: params.parentId, matchId }` — sends `null` if `matchId` is blank) → `res.data`.
- **Socket:** none.

---


## Bet History (Show Bet)

> **Menu path:** Sidebar → Completed Matches → (expand match row) → Show Bet button
> **Route:** `/super-duper-admin/bet-history`
> **Query params:** `matchId`, `marketId`, `userId`, `username`, `fancyId`
> **Component:** `src/app/bet-history/bet-history.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

## 📸 Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![bet-history](screenshots/bet-history.png)

> _Screenshot pending — placeholder. Capture a screenshot from the live site and replace the image above._

### Purpose

This page shows the bet history of a user (and their downline agents) on a market/fancy, along with the chip distribution of the **Plus Account** and **Minus Account**. In the Plus/Minus tables you can click an agent to drill down into their downline.

### On-screen Layout (UI)

- **Title / breadcrumb:** `data[0].Description` (market/match description) — breadcrumb: Dashboard → {Description}.
- **Plus Account table** (green toolbar): columns `User`, `Account` (mstrname), `Chip` (PUsum) + footer Total. An `undo`/reset button if the viewing user is not themselves.
- **Minus Account table:** columns `User`, `Account` (mstrname), `Chip` (Musum) + footer Total.
- **Bet list table** (`column3`): `#`, `UserName`, `selectionName`, `Odds`, `Stack`, `PL`, `Date`, `ip`, `STATUS`.
- **Drill-down:** click an agent name in the Plus/Minus table → that agent's plus/minus (`initPlusMinus`).
- **Modals / dialogs:** none.

### Sub-pages

No sub-page (drill-down happens inline).

### Actions

- View all bets for the market/fancy (odds, stack, PL, status, IP).
- Click an agent in the Plus/Minus account to view the distribution beneath them.
- Reset (`undo`) to return to the original user.

### Data Source (Technical)

- **API:**
  - `POST /showBet` (body `{ matchId, MarketId, fancyId, userId }`) → `value.data` (bet list).
  - `POST /adjustAc` (body `{ userId, matchId, MarketId, fancyId }`) → `data.plusData` / `data.minusData`.
- **Socket:** none.

---


## Aura GGR

> **Menu path:** Sidebar → Aura GGR
> **Route:** `/super-duper-admin/royal-casino`
> **Component:** `src/app/royal-casino/royal-casino.component.ts` (+ `.html`)

### Screenshot

![aura-ggr](screenshots/aura-ggr.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page displays the GGR / profit-loss summary report for Royal Casino (Aura) by date range. The overall total (GGR) is shown at the top, with a date-wise summary table below it. As soon as the page opens (in the constructor), the report loads once without any filter applied.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches" — breadcrumb: Dashboard → Royal Casino Report.
- **Filters / inputs:**
  - `From Date:` — date input (`type=date`, `fromDate`).
  - `To Date:` — date input (`type=date`, `toDate`).
- **Buttons:**
  - `Search` — fetches the report for the selected date range (`royalCasinoReport()`).
- **Summary card:** A card titled "Summary" that shows `Total` followed by the overall total value (`total`).
- **Report table columns (`column1`):** `Title` (`Label`), `Date` (`SummaryDate`), `Declared` (always hardcoded to "Yes"), `Profit/Loss` (`NetChips`). A footer row is also rendered (with blank cells).
- **Modals / dialogs:** None.

### Sub-pages

None.

### Actions

- Select a From/To date and pull the Royal Casino report with `Search`.
- View the overall total (GGR).
- View the date-wise profit/loss (NetChips) in the summary table.

### Data Source (Technical)

- **API:** `GET /royalCasinoReport` (params: `fromDate`, `toDate` — sent only when a value is set). The response arrives in `res.royalCasinoReportData`.
  - The total (GGR) is taken from the row where `Label === 'Overall Total'`.
  - The remaining rows (other than Overall Total) are shown in the table.
- **Socket:** None.

---


## Block Market

> **Menu path:** Sidebar → Block Market
> **Route:** `/super-duper-admin/sports`
> **Component:** `src/app/sports/sports.component.ts` (+ `.html`)

### Screenshot

![block-market](screenshots/block-market.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page displays the full list of sports and provides the ability to turn each sport on/off (block/unblock). It is a simple table where a toggle instantly changes a sport's status and refreshes the list.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Sports Block" — breadcrumb: Dashboard → Sports Block.
- **Section card:** A card titled "Block Sports" that contains the sports table.
- **Filters / inputs:** No search/filter input.
- **Buttons / controls:**
  - Per-row slide-toggle (Action column) — turns that sport on/off. `[checked]` is set based on `d.active == 1`.
- **Table columns (`columns`):**
  - `So.` — serial number (`index + 1`).
  - `Name` — the sport's name (`d.name`).
  - `Status` — "{name} is ON/Off" (ON if `d.active == 1`, otherwise Off).
  - `Action` — slide-toggle.
- **Loader:** While the list is loading (`isLoading`), a `mat-spinner` is shown.
- **Modals / dialogs:** None.

### Sub-pages

None.

### Actions

- View the list of sports and their current status (ON/Off).
- Block/unblock a sport using its Action toggle. The update happens as soon as the toggle is pressed, and the list reloads.

### Data Source (Technical)

- **API:**
  - The sports list is loaded via `dataService.getSports()` (promise).
  - `PUT /sports/:id` — body `{ active: sport.active ? 0 : 1 }` — toggles the sport's status. After success, the list is refreshed via `init()`.
- **Socket:** None.

---


## Blocked Clients

> **Menu path:** Sidebar → Manage Clients → Blocked Clients
> **Route:** `/super-duper-admin/blocked-user`
> **Component:** `src/app/blocked-user/blocked-user.component.ts` (+ `.html`)

### Screenshot

![blocked-clients](screenshots/blocked-clients.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page displays the list of blocked users who have been locked (lock/bet-lock). From here you can view each blocked user's commission details, go to the edit page to block/unblock them (agent lock / bet lock), and change their password.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Blocked Clients. Section title "Blocked Users".
- **Buttons / tools:** CSV button, PDF button (export — present in the UI only, no action wired yet), and a **Search...** input (present in the UI, not yet wired via `ngModel` — in code, search runs through `blockedUserSearch`).
- **Table columns (`blockedUserColumns`):**
  - `ID` — `mstruserid`
  - `User Name` — `(mstrname)` (with brackets)
  - `Match Comm.` — `Commission`
  - `Ssn Comm.` — `SessionComm`
  - `Share` — (empty cell)
  - `Actions` — **Edit** link (`[routerLink]="['../edit-blocked-user', d.mstruserid]"`) + **Change Password** button (`changePassword(d)`)
- **Modals / dialogs (defined on the parent page, ng-template):**
  - **Edit SC** (`#editBlockModal`) — fields: User Id (disabled), Name, Current Limit (disabled), My Match Share (disabled), Match Share (disabled), Match Commission (disabled), Session Commission (disabled), Agent Blocked (toggle), Bets Blocked (toggle); Cancel + Save Change buttons. _(Note: in the list, Edit now navigates to the child page via routerLink; the old `openEditBlock()` dialog code still exists in the component but the Edit link does not use it.)_
  - **Change Password SC** (`#changePasswordModal`) — New Password, Confirm Password fields (with a `matchPassword` validator on confirm) + Change button.

### Sub-pages

- [Edit Blocked Client](edit-blocked-client.md) — opens when **Edit** is pressed in a blocked user's row (route `edit-blocked-user/:id`).

### Actions

- View the blocked users list (search is supported in code via `blockedUserSearch`).
- Edit a user — navigate to the child page and set the Agent Blocked / Bets Blocked toggles.
- Change a user's password (modal).
- CSV / PDF export buttons (UI only, action pending).

### Data Source (Technical)

- **API:**
  - `GET /getBlockUsers` (param `search`) — fetches the list. The response `value.users` is placed into `blockedUserData.bets`.
  - `POST /setBlockedUsers` (`name`, `userId`, `mstrLock`, `betLock`) — saves block/unblock (`onSaveChangeClicked`, dialog mode).
  - `POST /changeUserPassword` (`userName`, `userId`, `newPassword`, `confirmPassword`) — password change.
- **Socket:** None.

---


## Edit Blocked Client

> **Menu path:** Sidebar → Manage Clients → Blocked Clients → (in row) Edit
> **Route:** `/super-duper-admin/edit-blocked-user/:id`
> **Component:** `src/app/blocked-user/edit-blocked-user/edit-blocked-user.component.ts` (+ `.html`)
> **Parent page:** [Blocked Clients](blocked-clients.md)

### Screenshot

![edit-blocked-client](screenshots/edit-blocked-client.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page is for editing the details of a single blocked user. From here, the user is turned on/off via the **Agent Blocked** (agent lock) and **Bets Blocked** (bet lock) toggles. The remaining commission/share fields are view-only (disabled). The page opens from the **Edit** button on the Blocked Clients list.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Clients", breadcrumb: Dashboard → Edit Block Clients. Section title "Edit User".
- **Form fields (`editBlockForm`):**
  - `User Id` — disabled (`userid`)
  - `Name` — editable (`name`)
  - `Current Limit` — disabled (`currentLimit`, the user's balance)
  - `My Match Share` — disabled (`100 - partner_cricket`)
  - `Match Share` — disabled (`partner_cricket`)
  - `Match Commission` — disabled (`Commission`)
  - `Session Commission` — disabled (`SessionComm`)
  - **Agent Blocked** — slide-toggle, ON/OFF label. ON when `mstrlock === 0`.
  - **Bets Blocked** — slide-toggle, ON/OFF label. ON when `bet_lock === 0`.
- **Buttons:**
  - **Cancel** — back to the Blocked Clients list (`[routerLink]="['/', urlType, 'blocked-user']"`).
  - **Save Changes** — `onSaveChangeClicked()`.
- **Modals / dialogs:** None in page mode. (The component is dual-mode — see below.)

### Dual mode (technical note)

The component can run in two ways:
- **Page mode** (default): the user is fetched from the route param `:id`, and after Save it navigates back to the list.
- **Dialog mode**: if data arrives via `MAT_DIALOG_DATA`, the form is populated from it, and Save/Cancel call `dialogRef.close()`. (Here, the blocked-user page uses page mode for editing.)

### Sub-pages

None.

### Actions

- View the user's block details (commission/share disabled fields).
- Edit the Name.
- Set agent lock/unlock via the **Agent Blocked** toggle.
- Set bet lock/unlock via the **Bets Blocked** toggle.
- Update with Save Changes, or go back to the list with Cancel.

### Data Source (Technical)

- **API:**
  - `GET /getBlockUsers` (param `search` = id) — in page mode, fetches the user data; the form is populated by matching `mstruserid === id || mstrid === id` from the response `users`.
  - `POST /setBlockedUsers` (`name`, `userId`, `mstrLock` = agentBlocked ? 0 : 1, `betLock` = betsBlocked ? 0 : 1) — save.
- `urlType` is derived from `dataService.getUrlType(authService.user.usetype)` (used for Cancel/navigation).
- **Socket:** None.

---


## Commission & Limits

> **Menu path:** Sidebar → Manage Clients → Commission & Limits
> **Route:** `/super-duper-admin/commission-limit`
> **Query params:** `userTypeId=0` (default super-duper-admin view), optional `userId` (to view a specific user's downline)
> **Component:** `src/app/commission-limit/commission-limit.component.ts` (+ `.html`)

### Screenshot

![commission-limits](screenshots/commission-limits.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page displays the commission (Bookmaker & Session) and balances of downline users in a role-wise table, plus an overall Summary (My Balance, Downline Balance, Exposure). From here you can manage deposit/withdraw, account/commission/partnership edit, sport block, sport limit, poker block, downline balance, and a client's exposure (Expo / bets list). When the query param `userId` changes, the data reloads (drilling down into a child's downline).

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Commission & Limits.
- **Filters / inputs (in each table block):**
  - Status dropdown — `userGroup`: All (`2`) / Active (`0`) / In Active (`1`). (Default `2`.)
  - **Search** input (`type=search`, `search`) — debounced (`DelayInputDirective`).
- **Role-wise table blocks (data is filtered by `userTypeId`):** Super Admin (`usetype 10`), Sub Admin (`9`), Super Master (`8`), Master (`1`), Dealer (`2`), Client/User (`3`). The relevant blocks are shown according to the logged-in role.
- **Table columns (`superAdminColumns`, etc.):**
  - `So.` — serial number (`#`, index)
  - `User Name` — `mstruserid` + `mstrname` (link to user-dashboard)
  - `BM. Comm` — `rolling_commission` (Bookmaker commission)
  - `SES. Comm` — `fancy_rolling_commission` (Session commission)
  - `Balance` — `balance`
  - `Down Bal` — "Down Bal" button (`getDownlineBalance`); in the Client table this becomes the **Expo** button (`expoModals`)
  - `Action` — `D` Deposit, `W` Withdraw, `Edit` (viewAccount), `SB` Sport Block, `SL` Sport Limit (usetype 0/11), `PB` Poker Block
- **Summary card (bottom):** Refresh icon (`refreshExposure`); the table shows **My Balance** (`user.balance`), **Down Line Balance** (`totalDownlineBalance`), **Rs. Exposure** (`exposureData`).
- **Modals / dialogs (ng-template):**
  - **A/C Chips In/Out** (`#accountChipInOutModal`) — Deposit/Withdraw tabs; fields: Parent Chips (disabled), User Chips/Balance (disabled), **Amount** (`Chips`), **Remark** (`RefID`).
  - **Account of {user}** (`#viewAccountModal`) — Edit Profile / Commission / Partnership tabs; profile (Name, remarks, create_no_of_child), commission (oddsComm, sessionComm, otherComm), partnership (cricket/soccer/tennis/casino/dream/binary/election/virtual_game role-wise shares), and change password.
  - **Sport Block** (`#sportBlockModal`) — sports list toggles (`/blockedSports`).
  - **Sport Limit** (`#sportLimitModal`) — Formly repeat form per market/fancy/bookmaker: Min Stake, Max Stake, Max Profit, Bet Delay, Market Volume, Max Market Exposure.
  - **Poker Block** (`#pokerBlockModal`) — poker games toggles (`/blockedPoker`).
  - **Downline Balance** (`#downlineBalanceModal`) — the selected user's downline_balance.
  - **Expo** (`#expoModal`) — the client's open bets list (`/bets`), `expocolumns`.
  - **User Count** (`#userCountModal`) — date-range-wise user count (`/getUserCount`).

### Sub-pages

No separate route-based sub-page. The User Name link goes to `user-dashboard` (a separate page). Everything else is handled within this page's modals/dialogs.

### Actions

- View downline users' commission and balance role-wise; search / sort / status-filter.
- Deposit / Withdraw chips (A/C Chips In/Out).
- Edit account / commission / partnership / profile; change password.
- Set sport block, sport limit, poker block.
- Lock/unlock user (`lockUsers`) and betting lock/unlock (`lockBetting`) — toggles in the viewAccount modal, with a confirm prompt.
- View downline balance (Down Bal), view a client's exposure/bets (Expo).
- Clear Profit/Loss (`clearChip`), refresh the summary exposure.

### Data Source (Technical)

- **API:**
  - `POST /masters` (list, body `userid`+`page`, params `search`/`sort`/`order`/`user_lock`/`limit`)
  - `GET /users/{id}` (parent details, decides role/title)
  - `POST /chipSummary` (Summary exposure — `exposureData = data.plusData[0].PUsum`)
  - `GET /masters/downlineBalance` (param `parentId`) — Down Bal
  - `GET /bets` (Expo — the client's bets)
  - `POST /saveCoins` (deposit/withdraw, `CrDr`)
  - `POST /updateAccount`, `POST /updateComm`, `POST /getPartnershipData`
  - `POST /lockUsers`, `POST /lockBetting`
  - `GET /blockedSports` / `POST /blockedSports`, `GET /sportLimits` / `POST /sportLimits`, `GET /blockedPoker` / `POST /blockedPoker`
  - `POST /clearChip`, `GET /accountStatement`, `POST /changeUserPassword`, `POST /getUserCount`
- **Note:** `totalDownlineBalance` is calculated client-side — the sum of `downline_balance + balance` (converting string values to numbers via `+()`).
- **Socket:** None (all REST based).

---


## Manage Password

> **Menu path:** Sidebar → Manage Password
> **Route:** `/super-duper-admin/change-password`
> **Component:** `src/app/change-password/change-password.component.ts` (+ `.html`)

### Screenshot

![manage-password](screenshots/manage-password.png)

> _Screenshot pending — placeholder. Replace the image above with a screenshot taken from the live site._

### Purpose

This page lets the logged-in user change their own login password. If the user is a **helper (usetype 55)**, they must first verify a **Security Question**; only after that does the Change Password form appear. For all other users, the Change Password form is shown directly.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Change Password" when `isVerified` is true, otherwise "Security Question". Breadcrumb: Dashboard → (Change Password / Security Question).
- **Security Question section** (when `isVerified == false`, i.e. helper usetype 55):
  - Question text (`user.question`)
  - **Enter Answer** input (`answer`)
  - **Submit** button (`verifyAnswer`, disabled when the answer is empty)
- **Change Password section** (when `isVerified == true`):
  - **OLD PASSWORD** — `oldpass` (type=password)
  - **NEW PASSWORD** — `newpass` (type=password)
  - **CONFIRM PASSWORD** — `renewpass` (type=password, validated on input via `checkPass()`)
  - Error message line (red, centered) — `errorMsg` (shown when a field is missing or new ≠ confirm)
  - **Save Changes** button — enabled only when `enableSubmit == true` (i.e. new == confirm).
- **Modals / dialogs:** none.
- **Table columns:** no table.

### Sub-pages

None.

### Actions

- (Helper) Verify by entering the answer to the security question (`verifyAnswer`).
- Fill in Old / New / Confirm password; Save is enabled only when new == confirm.
- **Save Changes** — changes the password. On success:
  - If `authService.user.password_changed == 0`, calls `DataService.logout()` (forces re-login).
  - Otherwise, redirects to the role-wise dashboard based on the user's `usetype` (0→super-duper-admin, 11→company, 10→super-admin, 9→sub-admin, 8→super-master, 1→master, 2→dealer, 55→helper).

### Data Source (Technical)

- **API:** `POST /verifyAnswer` (verify security question), `POST /changePassword` (body: `old_password`, `newpassword`, `Renewpassword`).
- User info comes from `AuthService.user`; on success, performs a role-wise router navigate or `DataService.logout()`.
- **Socket:** none.

---


## Search Logs User

> **Menu path:** Sidebar → Search Logs User
> **Route:** `/super-duper-admin/search-logs-user`
> **Component:** `src/app/search-logs-user/search-logs-user.component.ts` (+ `.html`)

### Screenshot

![search-logs-user](screenshots/search-logs-user.png)

> _Screenshot pending — placeholder. Replace the image above with a screenshot taken from the live site._

### Purpose

On this page you can enter a **User ID** and view that user's **parent hierarchy** (the full chain from Super Duper Admin down to the User). If logs exist for that user, the "User Logs Statement" button becomes enabled, which opens a detail page showing the user's complete betting/balance/liability logs.

### On-screen Layout (UI)

- **Title / breadcrumb:** heading "DASHBOARD", breadcrumb: Dashboard → Search User.
- **Filters / inputs:**
  - **Enter User Id** — text input (`selectedUserId`).
  - "User doesn't exist" error text (red) — shown when `inputbox_lable == false` (i.e. no logs found).
- **Buttons:**
  - **Submit** (`getUserDetails`) — checks the user's logs and fetches the parents.
  - **User Logs Statement** (shown only when `showLogsBtn == true`) — navigates to the child detail page (`../logs-user-details/<mstruserid>`).
- **Table columns (Search User Details):** two-column table — **Role** (`roleLabels`: Super duper Admin, Company, AD (super-admin), SC (sub-admin), SST (super-master), SS (master), SA (dealer), Sp (user)) and, next to it, that role's parent: `mstruserid (mstrname) partner_cricket%`. If there is no parent, "-".
- **Modals / dialogs:** none.

> Note: the constructor runs `init()`, which loads the masters list via `POST /masters` (only for data prep; this list is not rendered directly in the current UI).

### Sub-pages

- [User Logs Statement (Log User Details)](log-user-details.md) — opens when the "User Logs Statement" button is clicked (route `logs-user-details/:id`).

### Actions

- Enter a User ID and press **Submit** — checks the parent hierarchy and the logs.
- When logs are found, open the **User Logs Statement** page.

### Data Source (Technical)

- **API:**
  - `POST /masters` — masters/users list (constructor `init()`).
  - `GET /getLogsByUsername` (params: `page`, `username`) — the user's logs; the button is enabled when total > 0.
  - `POST /getParents` (body: `userId`) — parent hierarchy (`viewParent`).
- **Socket:** none.

---


## Log User Details (User Logs Statement)

> **Menu path:** Sidebar → Search Logs User → (User Logs Statement button)
> **Route:** `/super-duper-admin/logs-user-details/:id`
> **Component:** `src/app/search-logs-user/logs-user-details/logs-user-details.component.ts` (+ `.html`)
> **Parent page:** [Search Logs User](search-logs-user.md)

### Screenshot

![log-user-details](screenshots/log-user-details.png)

> _Screenshot pending — placeholder. Replace the image above with a screenshot taken from the live site._

### Purpose

This page shows the full **logs statement** for a selected user — for each bet/transaction it displays the match, market, selection, side, price, log type, type, date, and the before/after values for balance and liability. The User ID comes from the route's `:id` param. The data on this page can also be downloaded as a PDF.

### On-screen Layout (UI)

- **Title / breadcrumb:** heading "DASHBOARD", breadcrumb: Dashboard → Search User.
- **Section card:** "Block Sports" (the heading text is exactly this in the code).
- **Buttons:** **Download PDF** (`downloadPDF`) — generates a landscape PDF using jsPDF + autoTable (filename `user_log_statement<timestamp>.pdf`).
- **Table columns:** #, Match Name, Market Name, Selection Name, Side (`betType`), Price (`volume`), Log Type, Type, Date, Balance, Before Balance, After Balance, Liability, Before Liability, After Liability.
- **Pagination:** mat-paginator — page size options 10/25/50/100, default 50.
- **Modals / dialogs:** none.

> Note: the PDF table does not include the Side/Price columns (only 12 columns: Match/Market/Selection Name, Log Type, Type, Date, Balance, Before/After Balance, Liability, Before/After Liability).

### Sub-pages

None.

### Actions

- View the logs statement table (read-only).
- Change the page and page size via pagination (`getLogs`).
- **Download PDF** to save the full statement as a PDF.

### Data Source (Technical)

- **API:** `GET /getLogsByUsername` (params: `page`, `limit`, `username` — uppercased from the route's `:id`). Response: `data`, `meta.total`, `meta.perPage`.
- **Socket:** none.

---


## Collection Report

> **Menu path:** Sidebar → Manage Ledgers → Collection Report
> **Route:** `/super-duper-admin/collection-report-all`
> **Component:** `src/app/collection-report-all/collection-report-all.component.ts` (+ `.html`)

### Screenshot

![collection-report](screenshots/collection-report.png)

> _Screenshot pending — placeholder. Replace the image above with a screenshot taken from the live site._

### Purpose

This page shows users' balance positions in **three groups** — Minus (to receive), Plus (to pay), and Zero (cleared). Each group is a table containing the user's name and amount, and clicking a user takes you to their dashboard.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Collection Report" heading, breadcrumb: Dashboard → Collection Report.
- **Three sections (ibox cards), each with a table:**
  - **Minus Users (TO RECEIVE)** — `balanceType: 'minus'`
  - **Plus Users (TO PAY)** — `balanceType: 'plus'`
  - **Zero Users (CLEARED)** — `balanceType: 'zero'`
- **Table columns (each section):**
  - **Name** — `username (name)`, a clickable link.
  - **Amount** — 2 decimals (`number:'1.2-2'`).
  - **Total** amount in the footer (`dataService.getTotal`).
- **No data:** "No data" in the row.
- No filter/search input or button (data loads on page load).
- **Modals / dialogs:** none.

### Sub-pages

There is no separate-route sub-page doc, but **clicking the Name link** navigates to the user's **User Dashboard**:
`[url]/user-dashboard` with query params — `userId`, `userTypeId` (= `usetype`), `directRouteToCollectionReport: true`, `parentId`. This is for drilling down into that user's ledger.

### Actions

- View the users and their amounts in all three groups (Minus/Plus/Zero).
- Click a user name to go to their User Dashboard (collection report context).
- View the Total amount for each section.

### Data Source (Technical)

- **API:** `GET /collectionReport` — `minusUsers` / `plusUsers` / `zeroUsers` data. The response either returns these keys directly, or filters by the `balanceType` field in the `_users_balance` (or `data`) array (`getSectionData`).
- **Socket:** none.

---


## Log Detail

> **Menu path:** Sidebar → Manage Ledgers → log-detail
> **Route:** `/super-duper-admin/log-detail`
> **Component:** `src/app/log-detail/log-detail.component.ts` (+ `.html`)

### Screenshot

![log-detail](screenshots/log-detail.png)

> _Screenshot pending — placeholder. Replace the image above with a screenshot taken from the live site._

### Purpose

This page shows a detail table of system **logs** — for each bet/transaction it displays the match, market, selection, type, and the before/after values for balance and liability. The logs load as soon as the page loads.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Logs" heading, breadcrumb: Dashboard → Logs.
- **Section card:** "Logs Details".
- **Table columns:** #, Match Name, Market Name, Selection Name, Type, Date, Before Balance, After Balance, Before Liability, After Liability.
- No filter/search input or button.
- **Pagination:** the code contains pagination logic (`getLogs(page)`, `totalPages`, `itemsPerPage`), but the `<pagination-controls>` markup is commented out — so pagination is not currently visible in the UI.
- **Modals / dialogs:** none.

### Sub-pages

None.

### Actions

- View the logs detail table (read-only).

### Data Source (Technical)

- **API:** `GET /logs` (params: `page`). The response contains `data`, `total`, `pageSize`.
- **Socket:** none.

---


## My Statement (Account Statement)

> **Menu path:** Sidebar → Manage Ledgers → My Stmt
> **Route:** `/super-duper-admin/report`
> **Query params:** `id=3`, `accTypeId=4` (Credit Limit account type pre-selected)
> **Component:** `src/app/report/report.component.ts` (+ `.html`)

### Screenshot

![my-statement](screenshots/my-statement.png)

> _Screenshot pending — placeholder. Replace the image above with a screenshot taken from the live site._

### Shared component (note)

`report/report.component` is a single component that shows different reports based on the URL's `id` query param (`selectedBetType = id`). For **My Stmt**, **`id=3`** (Account Statement) is used, and this menu also passes `accTypeId=4` (Credit Limit), which is set into `accountType` in the component. Other id values: 1=Bet History, 2=Profit & Loss, 4=Login History, 5=Deleted Bet History, 6=Password History.

### Purpose

This page shows the **account statement** (ledger/credit-limit transactions) for the selected user (default "self") for a given date range — for each entry it displays date, narration, credit, debit, and balance.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (client-side table filter) + Filter icon button (collapse/expand the filter panel).
- **Report type dropdown (heading):** disabled mat-select showing "Account Statements List".
- **Filter panel fields:**
  - **Select User** — searchable dropdown (`getChild` API, default "self").
  - **Type** — dropdown to change the report type.
  - **Transaction Type** — All / Debit (DR) / Credit (CR). _(only on id=3)_
  - **Account Type** — All / Ledger (1) / Commission (2) / Settlement (3) / Credit Limit (4). _(only on id=3; from My Stmt the default is Credit Limit = `accTypeId=4`)_
  - **From Date** (default 10 days before today), **To Date** (default today).
- **Buttons:** **Load** — fetches data with the selected filters.
- **Table columns (id=3):** #, Date, User (`mstrUserId`), Description (Narration — deposit=green, withdraw=red; "loan" → "Open Account"), Cr (Credit, green), Dbt (Debit, red), Balance. Total Credit and total Debit in the footer.
- **Loading:** spinner; **Pagination:** mat-paginator (10/25/50/100); **No data:** "There is no data available."
- **Modals / dialogs:** none.

### Sub-pages

No separate sub-page (in the Account Statement variant, no row navigation is active).

### Actions

- Set User, Type, Transaction Type, Account Type, and From/To date, then **Load** to fetch data.
- Filter the table via the search box.
- Change page/page-size via pagination.

### Data Source (Technical)

- **API:** `GET /accountStatement` (params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type`, `type` (=accountType), `limit`). Response: `data`, `meta`, `openingBalance`.
- **Select User:** `GET /getChild` (search-based child list).
- **Socket:** none.

---


## Profit & Loss

> **Menu path:** Sidebar → Manage Ledgers → Profit & Loss
> **Route:** `/super-duper-admin/report`
> **Query params:** `id=2`
> **Component:** `src/app/report/report.component.ts` (+ `.html`)

### Screenshot

![profit-loss](screenshots/profit-loss.png)

> _Screenshot pending — placeholder. Replace the image above with a screenshot taken from the live site._

### Shared component (note)

`report/report.component` is a single component that shows different reports based on the URL's `id` query param (`selectedBetType = id`). For **Profit & Loss**, **`id=2`** is used. Other id values: 1=Bet History, 3=Account Statement (My Stmt), 4=Login History, 5=Deleted Bet History, 6=Password History.

### Purpose

This page shows the selected user's (default "self") **match-wise Profit & Loss** for a given date range. There are sport-wise tabs at the top, and each match row can be expanded to see its **market-wise breakup**.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (client-side filter) + Filter icon button (collapse/expand the filter panel).
- **Report type dropdown (heading):** disabled mat-select showing "Profit & Loss List".
- **Filter panel fields:** Select User (`getChild`, default "self"), Type dropdown, From Date (default 10 days before today), To Date (default today).
- **Buttons:** **Load** — fetches data with the selected filters.
- **Sport tabs:** "All" + each sport (`dataService.getSports()`). On tab change, `currentSportId` is set and P&L reloads.
- **Table columns (id=2):** DATE/TIME (`settle_date`), Match Id, Match Title (`EventName`), PL (`PnL`, color coded), Comm (color coded), and **Action** (expand +/-). Total PL and total Comm in the footer.
- **Row expand (inner table):** Market Name, PL, Comm, CreatedOn, and a **Show Bet** button — redirects to the bet-history page (query: matchId, marketId, userId, username, fancyId).
- **Loading:** spinner; **Pagination:** mat-paginator (10/25/50/100); **No data:** "There is no data available."
- **Modals / dialogs:** none.

### Sub-pages

- **Bet History** — opens from the "Show Bet" button in the inner table (`[url]bet-history`, with query params). It shows the bet list for that match/market.

### Actions

- Set User and From/To date, then **Load** to fetch data.
- Change the sport tab (All / a specific sport).
- Expand a match row (+) to see the market-wise PL/Comm breakup.
- Use **Show Bet** to go to that market's bet history.
- Filter via the search box; change page/page-size via pagination.

### Data Source (Technical)

- **API:**
  - `POST /profitLoss` (body: `userId`, `fromDate`, `toDate`, `page`, `sportId`, `limit`) — match-wise P&L list.
  - `POST /profitLossByMatch` (body: `sportId`, `userId`, `matchId`, `fromDate`, `toDate`) — market-wise inner data on row expand.
  - `GET /getChild` — searchable child list for Select User.
- **Sports list:** `dataService.getSports()` (for the tabs).
- **Socket:** none.

---


## Bet History (Report id=1)

> **Menu path:** Sidebar → All Reports → Bet History
> **Route:** `/super-duper-admin/report?id=1`
> **Query params:** `id=1` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is a single `report` component that displays 6 different reports based on the `id` query param. On this page `id=1` (Bet History). Inside the component, `selectedBetType = '1'` is set. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Verified from component code — the mapping is correct.)

## Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![bet-history](screenshots/bet-history.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Displays a list of all (active) bets placed by the selected user within a date range — which market/selection the bet was on, at what odds and stack, and the resulting P/L. This is the `id=1` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (client-side filtering of the table data) + Filter icon button (collapse/expand the filter panel).
- **Report type label (heading):** disabled dropdown showing "Bet History List".
- **Filters / inputs:**
  - **Select User** — searchable dropdown (`getChild` API; default "self").
  - **Type** — dropdown to switch the report type (Bet History is selected here).
  - **From Date** — date picker (default: 10 days before today).
  - **To Date** — date picker (default: today).
  - **Match Status** — shown only on `id=1` (and `id=5`): Matched (M) / Unmatched (U) / Past (P). Default Matched.
- **Buttons:** "Load" — fetch data using the selected filters.
- **Table columns:** #, UserName, BetFor (Description badge + selection/market name + Bet ID + "Matched"), Odds, Stack, PL (positive=green / negative=red), Date, Address (ip), Status. Back/Lay rows have different colors (`lay0`/`back0`).
- **Footer:** "Total" row shows the total P_L of all visible rows (color coded).
- **Loading:** spinner on the table while data is loading.
- **Pagination:** mat-paginator (page size 10/25/50/100).
- **No data:** "There is no data available." message.

### Sub-pages

None. (Changing only the `id` makes the same component display a different report variant.)

### Actions

- Select a user, set From/To dates, choose Match Status (M/U/P).
- Fetch data with "Load".
- Filter results using the search box.
- Change page / page-size with pagination.
- Switch to another report via the Type dropdown.

### Data Source (Technical)

- **API:** `POST /betHistory` — body: `user_id`, `from_date`, `to_date`, `type: 1` (for id=1), `page_no`, `sport_id: '0'`, `bet_type` (= matchStatus M/U/P), `limit`.
- `GET /getChild` — searchable child list for the Select User dropdown.
- **Socket:** None.

---


## Profit & Loss (Report id=2)

> **Menu path:** Sidebar → All Reports → Profit & Loss
> **Route:** `/super-duper-admin/report?id=2`
> **Query params:** `id=2` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same `report` component; on this page `id=2` (Profit & Loss). Inside the component, `selectedBetType = '2'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Verified from component code.)

## Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![profit-loss](screenshots/profit-loss.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Displays the selected user's match-wise Profit & Loss and Commission summary. There are tabs per sport, and each match row can be expanded to view its market-wise breakup. This is the `id=2` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Profit & Loss List".
- **Filters / inputs:** Select User, Type dropdown, From Date, To Date, Load button. (Transaction Type / Account Type / Match Status are not shown here.)
- **Sport tabs:** a nav bar above the table — "All" + a tab for each sport. Changing a tab sets `currentSportId` and reloads the data.
- **Table columns:** DATE/TIME (settle_date), Match Id, Match Title (EventName), PL (PnL, color coded), Comm (color coded), Action (expand +/- button).
- **Expand (inner table):** expanding a row shows a market-wise table — Market Name, PL, Comm, CreatedOn (MstDate), Action ("Show Bet" button that redirects to the `bet-history` page with matchId/marketId/userId/username/fancyId query params).
- **Footer:** Total PL and Total Comm (color coded).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

### Sub-pages

- [Bet History](bet-history.md) — opens from the inner table's "Show Bet" button (to view the specific bets for that match/market).

### Actions

- Set user / date range and click "Load".
- Change the sport tab.
- Expand (+) a match row to view market-wise PL/Comm.
- Use "Show Bet" to view the bet history for that market.
- Use search and pagination.

### Data Source (Technical)

- **API:** `POST /profitLoss` — body: `userId`, `fromDate`, `toDate`, `page`, `sportId` (= currentSportId), `limit`.
- `POST /profitLossByMatch` — market-wise data on row expand (body: `sportId`, `userId`, `matchId`, `fromDate`, `toDate`).
- `GET /getChild` — Select User list. Sports list comes from `dataService.getSports()` (for the tabs).
- **Socket:** None.

---


## My Statement / Account Statement (Report id=3)

> **Menu path:** Sidebar → All Reports → My Stmt (Account Statements)
> **Route:** `/super-duper-admin/report?id=3`
> **Query params:** `id=3` (required), `userTypeId` _(optional)_, `accTypeId` _(optional, pre-selects the Account Type)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same `report` component; on this page `id=3` (Account Statement / My Stmt). Inside the component, `selectedBetType = '3'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Verified from component code.)

## Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![my-statement](screenshots/my-statement.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Displays the selected user's account ledger / statement — date-wise credit/debit entries with narration and a running balance. The Transaction Type and Account Type filters narrow the entries. This is the `id=3` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Account Statements List".
- **Filters / inputs (extra filters for id=3):**
  - **Select User** — searchable dropdown.
  - **Type** — report type dropdown.
  - **Transaction Type** — All / Debit (DR) / Credit (CR). _(Shown only on id=3.)_
  - **Account Type** — All / Ledger (1) / Commission (2) / Settlement (3) / Credit Limit (4). _(Only on id=3; can be pre-selected via the `accTypeId` query param.)_
  - **From Date**, **To Date**, **Load** button.
- **Table columns:** #, Date (Sdate), User (mstrUserId), Description (Narration — "deposit"=green, "withdraw"=red, others dark; the text "loan" is displayed replaced with "Open Account"), Cr (Credit, green), Dbt (Debit, red), Balance.
- **Footer:** "Total" row shows Total Credit (green) and Total Debit (red).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

### Sub-pages

None.

### Actions

- Set user, From/To dates, Transaction Type and Account Type, then click "Load".
- Filter entries using the search box.
- Change page / page-size with pagination.

### Data Source (Technical)

- **API:** `GET /accountStatement` — query params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type` (all/DR/CR), `type` (= accountType all/1/2/3/4), `limit`. The response also includes `openingBalance`.
- `GET /getChild` — Select User list.
- **Socket:** None.

---


## Login History (Report id=4)

> **Menu path:** Sidebar → All Reports → Login History
> **Route:** `/super-duper-admin/report?id=4`
> **Query params:** `id=4` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same `report` component; on this page `id=4` (Login History). Inside the component, `selectedBetType = '4'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Verified from component code.)

## Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![login-history](screenshots/login-history.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Displays the login records of the selected user — when, and from which IP/device/browser and location (city/region/org) the login occurred. This is the `id=4` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Login History List".
- **Filters / inputs:** Select User, Type dropdown, From Date, To Date, Load button. (Transaction/Account Type and Match Status are not shown here.)
- **Table columns:** #, Date (logstdt), Ip Address (ipadress), User (mstruserid), Device Info, Browser Info, City, Region, Organization (org).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

### Sub-pages

None.

### Actions

- Set user and date range, then click "Load".
- Filter results using the search box.
- Change page / page-size with pagination.

### Data Source (Technical)

- **API:** `GET /loginHistory` — query params: `page`, `userId`, `from_date`, `to_date`, `limit`.
- `GET /getChild` — Select User list.
- **Socket:** None.

---


## Deleted Bet History (Report id=5)

> **Menu path:** Sidebar → All Reports → Delete Bet History
> **Route:** `/super-duper-admin/report?id=5`
> **Query params:** `id=5` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same `report` component; on this page `id=5` (Deleted Bet History). Inside the component, `selectedBetType = '5'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Verified from component code.)
>
> **Access:** The "Delete Bet History" option appears in the Type dropdown only when `userTypeId === 0` or `userTypeId === 11` (i.e., top-level / admin-level users).

## Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![deleted-bet-history](screenshots/deleted-bet-history.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Displays a list of the selected user's deleted/voided bets. The layout is exactly like Bet History (id=1); the only difference is that `type=0` is sent to the backend (id=1 sends `type=1`) — so this fetches deleted bets. This is the `id=5` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Delete Bet History List".
- **Filters / inputs:**
  - **Select User**, **Type** dropdown, **From Date**, **To Date**, **Load** button.
  - **Match Status** — shown on `id=5` (and `id=1`): Matched (M) / Unmatched (U) / Past (P).
- **Table columns:** #, UserName, BetFor (Description badge + selection/market + Bet ID + "Matched"), Odds, Stack, PL (color coded), Date, Address (ip), Status. (Same as Bet History.)
- **Footer:** "Total" row shows the total P_L (color coded).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

### Sub-pages

None.

### Actions

- Set user, date range and Match Status, then click "Load".
- Filter results using the search box.
- Change page / page-size with pagination.

### Data Source (Technical)

- **API:** `POST /betHistory` — the same endpoint Bet History uses, but `type: 0` (deleted) is sent. Body: `user_id`, `from_date`, `to_date`, `type: 0`, `page_no`, `sport_id: '0'`, `bet_type` (= matchStatus), `limit`.
- `GET /getChild` — Select User list.
- **Socket:** None.

---


## Password History (Report id=6)

> **Menu path:** Sidebar → All Reports → Password History
> **Route:** `/super-duper-admin/report?id=6`
> **Query params:** `id=6` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same `report` component; on this page `id=6` (Password History). Inside the component, `selectedBetType = '6'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Verified from component code.)

## Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![password-history](screenshots/password-history.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Displays the selected user's password change history — whose password was changed, when, by whom (the changer), and from which IP. This is the `id=6` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Password History List".
- **Filters / inputs:** Select User, Type dropdown, From Date, To Date, Load button. (Transaction/Account Type and Match Status are not shown here.)
- **Table columns:** #, Username, Changer Name (changername), IP, Date (created_at).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

### Sub-pages

None.

### Actions

- Set user and date range, then click "Load".
- Change page / page-size with pagination.
- _(Note: the client-side search box does not apply to the id=6 table — the table is bound directly to `data`.)_

### Data Source (Technical)

- **API:** `GET /passwordHistory` — query params: `page`, `userId`, `from_date`, `to_date`, `limit`. (The response arrives in a `res.data.data` + `res.data.meta` structure.)
- `GET /getChild` — Select User list.
- **Socket:** None.

---


## Chips Summary

> **Menu path:** Sidebar → All Reports → Chips Summary
> **Route:** `/super-duper-admin/chip-summary`
> **Query params:** None.
> **Component:** `src/app/chip-summary/chip-summary.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is a separate component (not the `report` component) — the standalone `ChipSummaryComponent` is loaded on the `chip-summary` route.

## Screenshot

<!-- TODO: Add the live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![chips-summary](screenshots/chips-summary.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Displays the chip (cash) settlement summary in two columns — on one side the downline users to whom money must be "Given" (Plus), and on the other side those from whom money must be "Taken" (Minus). By reviewing downline balances, the user can perform a Part Settlement (P/S) or Full Settlement (F/S) right here, and can also drill down into a child.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Chips Summary" heading, breadcrumb: Dashboard → Chips Summary.
- **Sport filter:** Sport dropdown in the top toolbar (All + each sport) — changing it reloads the data (`changeSport`).
- **Two cards (side by side):**
  - **Left card — "<user> ( + ) Give"** — plus users (to be given). Columns: Role (badge "c"), Name (mstrname (mstruserid)), Balance (PUsum, 2-decimal), Action. The tfoot below shows the Total (sum of PUsum).
  - **Right card — "<user> ( - ) Take"** — minus users (to be taken). Columns: Role, Name, Balance (Musum, 2-decimal), Action. The tfoot below shows the Total (sum of Musum).
- Each card has a "Search" input at the top, and if a drill-down has been performed (current user type differs from your own type), an **undo** icon button (to return to your own level).
- **Name column:** if the row is a child and its usetype is not 3, the name is clickable (`init(UserID, usetype)` drills down into that child).
- **Action column buttons (per row, depending on conditions):**
  - **P/S** — Part Settlement; opens the settlement chip modal.
  - **F/S** — Full Settlement; `clearChip`. If the current user is `usetype 0` and the row is `usetype 8` (and the popup flag is true), the discount modal opens; otherwise a direct confirm ("Are you sure?").
  - **H** — History; navigates to the `chip-history-user` page (query params: userid, name, parentId).
  - P/S and F/S appear only when `canSettle(d)` is true and the row is a child. (`canSettle` depends on the project / `allow_deposit_withdraw` / usetype-2 conditions.)
- **Modals / dialogs:**
  - **settlementChipModal** (P/S) — fields: Amount (Chips, number, required, min 1), Current Balance (display), Remark (Narration). "Save".
  - **settlementChipDiscountModal** (F/S discount case) — fields: Cash Discount (discount, number 1–5, required), Remark (Narration). "Save".

### Sub-pages

- **Chip History (User)** — the `H` button navigates to the `chip-history-user` page (the selected user's chip history).

### Actions

- Refresh the summary by changing the sport filter.
- View the users and Totals in both the Plus/Minus lists.
- Drill down into a child user's downline by clicking the child's name.
- Return to your own level via the undo button.
- Perform a part settlement via P/S (enter amount + remark and Save).
- Perform a full settlement via F/S (discount + remark in the discount case, otherwise a direct confirm).
- View chip history via the H button.

### Data Source (Technical)

- **API:**
  - `POST /chipSummary` — balance summary of plus/minus users (body: `mstrid`, `typeId`, `sportId`). Response: `data.plusData` / `data.minusData`.
  - `POST /clearChip` — save settlement (P/S, F/S and discount all use this endpoint; body contains `userId`, `CrDr`, `Chips`, `discount`, `IsFree`, `Narration`).
  - Sports list comes from `dataService.getSports()`.
- **Socket:** None.

---


## Bet List Live

> **Menu path:** Sidebar → Bet List Live
> **Route:** `/super-duper-admin/current-bets`
> **Query params:** `sportId`, `matchId`, `marketId` _(optional — may arrive via deep-link)_
> **Component:** `src/app/current-bets/current-bets.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![bet-list-live](screenshots/bet-list-live.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This page shows all **live (current) bets** in real time. The list refreshes automatically whenever a socket event arrives. Authorized users (usetype `0`, or usetype `11` with `allow_bet_delete`) can also delete bets and export the full data to Excel.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Current Bets" heading, breadcrumb: Dashboard → Current Bets.
- **Top bar:**
  - "Search..." input — typing fetches data (with a delay) via `appDelayInput`.
  - **Filter** icon button — collapses/expands the filter panel below.
  - **Export** (download) icon button — downloads Excel.
- **Section card:** "All Live Bets".
- **Filter panel (collapsible):**
  - **Sport** — dropdown (All + each sport). Changing it reloads the list.
  - **Delete Bets form (usetype `0` only):** Formly repeat form — Select Match (searchable, filtered by sport), From Date (datetime-local), To Date (datetime-local), and a "Delete Bets" button.
- **Table columns:** `#`, `ID` (MstCode), `Sports`, `Match`, `Market`, `User`, `Selection`, `Type` (Back/Lay), `Odds`, `Stake`, `PL`, `Date`, `IP`, and (only for usetype `0` or usetype `11` with `allow_bet_delete`) `Action` (delete button).
  - **Type logic:** when `isBack == 1` it shows "Lay", otherwise "Back". The row color also depends on this (`lay0` / `back0` class).
- **Loader:** spinner while bets are being fetched.
- **Pagination:** `mat-paginator` — page size options 10 / 25 / 50 / 100 (default 50).

### Sub-pages

None. (This is a standalone listing page.)

### Actions

- Filter bets via the search box.
- Change the sport filter.
- Export/download data to Excel (`.xlsx`).
- Delete a single bet (Action delete button — password `prompt()` + confirm, authorized users only).
- Bulk-delete bets by time/match range (Delete Bets form — password `prompt()` + confirm, usetype `0` only).
- Change the page and page size via pagination.

### Data Source (Technical)

- `GET /bets` — current bets list (params: `page`, `sportId`, `matchId`, `search`, `limit`; plus `marketId` when `sportId == 7`).
- `GET /getMatchesForBets` — match dropdown for the Delete Bets form (filtered by sport).
- `POST /removeBet` — delete a single bet (`marketId`, `betId`, `userId`, `matchId`, `password`).
- `POST /removeBetByTime` — bulk-delete by time/match range (form fields + `password`).
- `POST /exportData` — Excel export (blob, params: `sportId`).
- **Socket event:** `ALL_BETS_UPDATE_DATA:<mstrid>` — auto-refreshes the list when a new update arrives. The room is managed via `dataService.manageRoom(...)`; joined via `socket.emit('room', ...)`.

---


## Manage Series/Matches

> **Menu path:** Sidebar → Manage Series/Matches
> **Route:** `/super-duper-admin/manage-series` (query param `sportId=4` default)
> **Query params:** `sportId`
> **Component:** `src/app/super-duper-admin/manage-series/manage-series.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![manage-series-matches](screenshots/manage-series-matches.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page the admin manages the **series (tournaments)** for the various sports. Series received from the API or added manually can be activated/deactivated, and new **manual series** can be added. For an active series, the admin can proceed to the **"Manage Matches"** page.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Manage Series" heading, breadcrumb Dashboard → Manage Series. The card title is "List".
- **Tabs:** Sport-wise tabs at the top (only sports with `is_betfair == true`). Clicking a tab reloads the same route with the `sportId` query param.
- **Buttons:**
  - Top-right round **"Add Series"** (+ icon) — opens the modal to add a new manual series.
- **Table columns:**
  - `#` (serial number)
  - `ID` (series id)
  - `Name` (manual series get a `" (Manual)"` suffix)
  - `Action` — active/inactive **slide-toggle** + a **"Manage Matches"** button when active
- **Loader:** spinner while data loads.
- **Modal — "Add Series":** Formly form fields:
  - `Series Name` (input, required)
  - `Series ID` (input, auto-generated default value `111` + random)
  - (hidden fields: `is_manual = 1`, `sportId = '4'`)
  - "Save" button in the footer (enabled only when the form is valid).

### Sub-pages

- [Manage Matches](manage-matches.md) — via the "Manage Matches" button in the `Action` column of an **active** series. Route `../manage-matches` (query: `sportId`, `seriesId`).

> **Note:** From within Manage Matches, the Line Fancy, Indian Fancy, and Betfair Market pages open further. All three are documented in the Manage Matches doc and in their own files:
> - [Manage Session Fancy / Line Fancy](manage-session-fancy.md)
> - [Manage Indian Fancy](manage-indian-fancy.md)
> - [Manage Betfair Market](manage-bet-fair.md)
>
> All three are also reachable from the **Activate Matches** (`direct-activate`) page — see [activate-matches.md](../activate-matches.md).

### Actions

- Switch sport tabs to view that sport's series.
- Activate/deactivate a series via the slide-toggle (`saveSeries`).
- Navigate to the "Manage Matches" page for an active series.
- Create and save a new manual series via "Add Series".

### Data Source (Technical)

- `GET /series` (params: `sportId`, `type=manage`) — loads the list. The response contains `seriesfrmDataBase` (already active) + `seriesfrmApiAndManual` (received from API/manual). The code merges both and sets the `active` flag.
- `POST /series` — activate/save a series (`seriesId`, `seriesName`, `sportId`, `is_manual`).
- `POST /manualSeries` — create a new manual series (modal Save).
- `DataService.getSports()` — sport tabs (filter: `is_betfair`).

---


## Manage Matches

> **Menu path:** Sidebar → Manage Series/Matches → (active series) "Manage Matches"
> **Route:** `/super-duper-admin/manage-matches`
> **Query params:** `sportId`, `seriesId`
> **Component:** `src/app/super-duper-admin/manage-matches/manage-matches.component.ts` (+ `.html`)
> **Parent page:** [Manage Series/Matches](manage-series-matches.md)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![manage-matches](screenshots/manage-matches.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

A page to manage the **matches within a selected series**. API/manual matches can be activated (toggle), a new **manual match** can be added, and for an active match the sub-pages for managing fancy/markets open up.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Manage Matches" heading, breadcrumb Dashboard → Manage Matches. Card title "List".
- **Buttons:** Top-right round **"Add Match"** (+ icon) — manual match add modal.
- **Table columns:**
  - `Name` (match name)
  - `Country Code`
  - `Date` (openDate, medium format)
  - `Action` — see below.
- **Action column:**
  - **Slide-toggle** (activate/deactivate) — only when `has_bookmaker !== '1'`.
  - For an active match, a **"Manage"** button (casino icon) — toggles an expandable detail row.
- **Expandable detail row ("Manage"):** Contains links/buttons (depending on sportId):
  - **Line Fancy** (only `sportId === '4'`) → `../manage-session-fancy`
  - **Indian Fancy** (only `sportId === '4'`) → `../manage-indian-fancy`
  - **Betfair Market** (every sport) → `../manage-bet-fair`
  - _(For helper usetype `55`, if the 'Fancy Activation' permission is missing the Line/Indian Fancy buttons are disabled.)_
- **Loader:** spinner while loading.
- **Modal — "Add Match":** Formly fields — `Match Name` (required), `Match ID` (auto `111`+random), `Starting Date and Time` (datetime-local, required); hidden: `is_manual`, `seriesId`. Save button enabled when the form is valid.

### Sub-pages

- [Manage Session Fancy (Line Fancy)](manage-session-fancy.md) — "Line Fancy" button in the "Manage" detail (cricket only, sportId 4).
- [Manage Indian Fancy](manage-indian-fancy.md) — "Indian Fancy" button in the "Manage" detail (cricket only, sportId 4).
- [Manage Betfair Market](manage-bet-fair.md) — "Betfair Market" button in the "Manage" detail.

### Actions

- Activate/deactivate a match (slide-toggle → `saveMatch`).
- Create a new manual match via "Add Match" (`save` → `/manualMatch`).
- Expand "Manage" to go to the Line Fancy / Indian Fancy / Betfair Market pages.

### Data Source (Technical)

- `GET /matches` (params: `seriesId`, `sportId`, `type=manage`) — list. Response: `matchfrmApiAndManual` + `matchfrmDataBase` (active). The code merges both and sets `active` and `has_bookmaker`.
- `POST /matches` — activate/save a match (`matchId`, `matchName`, `date`, `seriesId`, `countryCode`, `type=manage`).
- `POST /manualMatch` — new manual match (modal Save).
- `DataService` → loading state.

---


## Manage Betfair Market

> **Menu path:** Sidebar → Manage Series/Matches → Manage Matches → (active match) "Manage" → "Betfair Market"
> **Route:** `/super-duper-admin/manage-bet-fair`
> **Query params:** `sportId`, `seriesId`, `matchId`
> **Component:** `src/app/super-duper-admin/manage-bet-fair/manage-bet-fair.component.ts` (+ `.html`)
> **Parent page:** [Manage Matches](manage-matches.md)

> **Second entry point:** This page also opens from the "Manage" detail row of the **Activate Matches** (`direct-activate`) page (the "Betfair Market" button). See [activate-matches.md](../activate-matches.md).

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![manage-bet-fair](screenshots/manage-bet-fair.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

A page to activate a match's **Betfair markets** (Match Odds, etc.) and to publish/unpublish their data. From here a new **manual market** (with runners) can also be added. The page heading shows "Betfair Markets".

### On-screen Layout (UI)

- **Title / breadcrumb:** "Betfair Markets" heading, breadcrumb Dashboard → Betfair Markets. Card title "List".
- **Buttons:** Top-right round **"Add Market"** (+ icon) — manual market modal.
- **Table columns:**
  - `#` (serial)
  - `Name` (marketName)
  - `Start Time` (marketStartTime, medium)
  - `Action` — see below.
- **Action column (conditional):**
  - **"Activate"** — when the market is not active.
  - Manual market + active → **"Activated"** (disabled).
  - Non-manual + active + not published → **"Publish Data"**.
  - Non-manual + active + published → **"Unpublish Data"** (red button).
- **Horse racing note:** when `sportId` is 7 or 4339, `isHorse = true` — table data is filtered by `event.id == matchId`; otherwise non-LINE markets are shown.
- **Loader:** spinner.
- **Modal — "Add Market":** Formly fields — `Market Name` (required), `Market ID` (auto; for a manual match `M-`+random, otherwise `M-`+matchOdds.marketId), and a **Runners** repeat group (`Runner ID`, `Runner Name` required; Add/Delete allowed). Hidden: `is_manual`, `series_id`, `match_id`, `sports_id`, `totalMatched`.

### Sub-pages

None.

### Actions

- Activate a market (`save` → `/markets`, or `/manualMarket` for a manual market).
- Publish / unpublish data.
- Create a new manual market (with runners) (`saveMarket` → `/addManualMarket`).

### Data Source (Technical)

- `GET /markets` (params: `matchId`, `sportId`, `seriesId`, `type=manage`) — list. Response: `data` + `manualMarkets` + `activeMarkets`. The code sets the `active` and `isPublished` flags.
- `POST /getRunnersByMarket` — runners of the "Match Odds" market (when matchId does not start with `111`).
- `POST /markets` — activate a non-manual market.
- `POST /manualMarket` — activate a manual market.
- `POST /publishData` / `POST /unpublishData` — publish/unpublish (`MarketId`, `MatchId`, `SportId`, `SeriesId`).
- `POST /addManualMarket` — create a new manual market (with runners; missing selectionId is auto-generated).

---


## Manage Indian Fancy

> **Menu path:** Sidebar → Manage Series/Matches → Manage Matches → (active match) "Manage" → "Indian Fancy"
> **Route:** `/super-duper-admin/manage-indian-fancy`
> **Query params:** `matchId`, `marketId`
> **Component:** `src/app/super-duper-admin/manage-indian-fancy/manage-indian-fancy.component.ts` (+ `.html`)
> **Parent page:** [Manage Matches](manage-matches.md)

> **Second entry point:** This page also opens from the "Manage" detail of **Activate Matches** (`direct-activate`) (the "Indian Fancy" button — sportId 4/11/6). See [activate-matches.md](../activate-matches.md).

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![manage-indian-fancy](screenshots/manage-indian-fancy.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

A page to activate a match's **Indian (session) fancy runners**. The list auto-refreshes every 2 seconds (polling), and a new **manual fancy** can be added. Fancies whose result has already been declared are removed from the list.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Manage Indian Fancy" heading, breadcrumb Dashboard → Manage Indian Fancy. Card title "List".
- **Buttons:** Top-right round **"Add Market"** (+ icon) — opens the Add Fancy modal.
- **Match selector:** "Select Match" dropdown (active matches for sportId 4 only; `[(ngModel)]="matchId"`).
- **Table columns:**
  - `#` (serial)
  - `RunnerName` (the header text reads "Match ID" but the data is `d.RunnerName`)
  - `Activate` — if not active, an **"Activate"** button; when active, **"Activated"** (disabled).
- **Loader:** global loading spinner (dataService.loading).
- **Modal — "Add Fancy":** Formly fields — `Runner Name` (required), `Selection ID` (auto `M-`+random, required). Hidden: `is_manual`, `match_id`. Save enabled when the form is valid.

### Sub-pages

None.

### Actions

- Select a match from the dropdown (the list loads for that match).
- Activate a fancy runner (`save` → `/fancies`).
- Add a new manual fancy (`saveFancy` → `/addManualFancy`).

### Data Source (Technical)

- `GET /getActiveMatches?sportId=4` — match dropdown options.
- `GET /fancies/{matchId}` — fancy list (response `data.session` + `activatedFancies`). Those with `result === null` are "active"; once a result has arrived they are removed from the list. **2-second polling** loop (`init()` calls itself again).
- `POST /fancies` — activate a fancy runner (`SelectionId`, `match_id`).
- `POST /addManualFancy` — new manual fancy (modal Save).
- _Note:_ `ngOnDestroy` sets `refreshData = false` so that polling stops.

---


## Manage Session Fancy (Line Fancy)

> **Menu path:** Sidebar → Manage Series/Matches → Manage Matches → (active match) "Manage" → "Line Fancy"
> **Route:** `/super-duper-admin/manage-session-fancy`
> **Query params:** `sportId`, `seriesId`, `matchId`
> **Component:** `src/app/super-duper-admin/manage-session-fancy/manage-session-fancy.component.ts` (+ `.html`)
> **Parent page:** [Manage Matches](manage-matches.md)

> **Second entry point:** This page also opens from the "Manage" detail of **Activate Matches** (`direct-activate`) (the "Line Fancy" button — sportId 4 only). See [activate-matches.md](../activate-matches.md).

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![manage-session-fancy](screenshots/manage-session-fancy.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

A page to activate and publish/unpublish a match's **Line markets (Line Fancy / session line)**. The page heading shows "Line Markets". It shows only markets whose name contains `LINE`.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Line Markets" heading, breadcrumb Dashboard → Line Markets.
- **Table columns:**
  - `#` (serial)
  - `Market Name` (marketName)
  - `Action` — see below.
- **Action column (conditional):**
  - Not active → **"Activate"** button.
  - Active + not published → **"Publish Data"** (outline button).
  - Active + published → **"Unpublish Data"** (red button).
- **Filter:** table `data | filterBy : ['marketName'] : 'LINE'` — LINE markets only.
- **Loader:** global loading spinner (dataService.loading).

> _Note:_ This page has no "Add" button / modal (it is simpler than manage-bet-fair).

### Sub-pages

None.

### Actions

- Activate a line market (`save`).
- Publish / unpublish data.

### Data Source (Technical)

- `GET /markets` (params: `matchId`, `sportId`, `type=manage`, `category=line`) — list. Response `data` + `activeMarkets`. The code sets the `active` and `isPublished` flags.
- `POST /markets` (param `category=line`) — activate a market (`marketId`, `marketName`, `totalMatched`, `match_id`, `sports_id`, `series_id`).
- `POST /publishData` (param `category=line`) — publish.
- `POST /unpublishData` (param `category=line`) — unpublish.

---


## Activate Matches

> **Menu path:** Sidebar → Activate Matches
> **Route:** `/super-duper-admin/direct-activate`
> **Query params:** `sportId` _(optional — default `4`)_
> **Component:** `src/app/super-duper-admin/direct-activate/direct-activate.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![activate-matches](screenshots/activate-matches.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page the admin **activates upcoming matches/markets directly** (without managing series/match). After activating, the admin can publish/unpublish data and add or remove fancy / bookmaker / toss / goal markets. The data source **API port (RAMA/CBTF/DIAMOND)** is also switched here.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Activate Matches" heading, breadcrumb Dashboard → Activate Matches. Card title "List".
- **Top-right controls:**
  - **API Port** dropdown — `RAMA (Default)` (value 1), `CBTF` (2), `DIAMOND` (3). The selection is remembered in localStorage `selectedApiPort`.
  - **"Refresh"** icon button — reloads the list.
- **Tabs:** Sport-wise tabs (filtered: `id <= 77` and `id != 7`).
- **Table columns:**
  - `Name` (matchName)
  - `Date` (match time, medium format)
  - `Action` — several context-dependent buttons (see below). Table ordered by `time`.
- **Action column buttons (conditional):**
  - **"Activate"** — when the market is not active.
  - **"Publish Data" / "Unpublish Data"** — for active markets (except sportId 11/6).
  - **"Activated"** (disabled) — for casino (11) / election (6) sports.
  - **"Manage"** (casino icon) — toggles an expandable detail row (except sportId 11/6).
  - **"Activate Fancy"** (control_point icon) — for sportId 11/6; expands the fancy detail row.
  - **"Activate Bookmaker"** (bookmark_add icon) — sportId 6 (virtual bookmaker).
  - For cricket (sportId 4), letter toggles: **`F`** (Fancy on/off), **`B`** (Bookmaker), **`T`** (Toss).
  - For soccer (sportId 1), a **`G`** (Goal) button (when there is no goal market).
- **Expandable detail row ("Manage"):** Buttons (depending on sportId):
  - **Line Fancy** (sportId 4) → `../manage-session-fancy`
  - **Indian Fancy** (sportId 4/11/6) → `../manage-indian-fancy`
  - **Betfair Market** (except sportId 11/6) → `../manage-bet-fair`
  - _(For helper usetype 55, if the 'Fancy Activation' permission is missing the Line/Indian Fancy buttons are disabled.)_
- **Fancy detail row ("Activate Fancy"):** The inner table — columns `#`, `Runner Name`, `Activate` (per-runner Activate/Activated button).
- **Loader:** spinner while loading.
- **Prompts:** on API port change, a password `prompt()` + confirm dialog.

### Sub-pages

From the "Manage" detail row, these three pages open (their primary documentation is in the Manage Series flow folder):

- [Manage Session Fancy (Line Fancy)](manage-series-matches/manage-session-fancy.md) — sportId 4.
- [Manage Indian Fancy](manage-series-matches/manage-indian-fancy.md) — sportId 4 / 11 / 6.
- [Manage Betfair Market](manage-series-matches/manage-bet-fair.md) — except sportId 11/6.

### Actions

- Switch sport tabs + refresh the list.
- Activate a market (`save`).
- Publish / unpublish data.
- Activate/deactivate fancy (cricket `F` toggle, or per-runner Activate for casino/election).
- Add or remove Bookmaker / Toss (cricket `B`/`T`).
- Add a virtual bookmaker (election, sportId 6).
- Add a goal market (soccer, sportId 1).
- Open "Manage" to go to the Line Fancy / Indian Fancy / Betfair Market pages.
- Switch the API data port (RAMA/CBTF/DIAMOND) (with password + confirm).

### Data Source (Technical)

- `GET /markets/directActivate` (params: `sportId`, `type=manage`) — loads the list. The eventList is processed sport-wise; the `has_fancy`/`has_bookmaker`/`has_toss`/`has_goal`/`active`/`isPublished` flags are computed.
- `POST /markets/directActivate` — activate a market (`marketId`, `sportId`).
- `POST /fancies` — activate a fancy runner (casino/election; `SelectionId`, `match_id`, `sportId`, `RunnerName`, `marketId`).
- `GET /fancies/{matchId}` — fancy detail (`activatedFancies`) — on expandFancy.
- `POST /activateFancy` / `POST /deActivateFancy` — cricket fancy on/off (`matchId`).
- `POST /addBookmaker` / `POST /removeBookmaker` — add/remove Bookmaker/Toss (`matchId`, `type`).
- `POST /addVirtualBookmaker` — virtual bookmaker (election; `matchId`, `type`).
- `POST /addGoalMarkets` — goal market (soccer; `totalMatched`, `match_id`).
- `POST /publishData` / `POST /unpublishData` — publish/unpublish data.
- `POST /switch-data` — API port switch (`apiValue`, `password`).
- `DataService.getSports()` — sport tabs (filter `id <= 77 && id != 7`).

---


## Agent Bank DP (Deposit)

> **Menu path:** Sidebar → Agent Bank DP
> **Route:** `/super-duper-admin/bank-account/deposit`
> **Query params:** `:type` = `deposit`
> **Component:** `src/app/request/request.component.ts` (+ `request.component.html`)
> **Parent page:** [Agent Bank WD](agent-bank-wd.md) — same component, withdraw mode

### Screenshot

![agent-bank-dp](screenshots/agent-bank-dp.png)

> _Screenshot placeholder — replace the image above with a screenshot taken from the live site._

### Purpose

This page manages the **deposit (money credit) requests** of dealers/agents. When a user submits a deposit request, it appears in this list, and the admin can **Complete** or **Reject** it (along with an amount and transaction id). A single `RequestComponent` handles both deposit and withdraw — the route's `:type` param decides which mode runs; on this page `:type = deposit` is received.

### Deposit Mode Behaviour (IMPORTANT)

When the route param is `deposit`:
- `reqType = '1'` is set — the `/getRequest` API is called with `type=1`, i.e. only **deposit** requests are returned.
- The heading and breadcrumb show **"Deposit"**.
- Because `type != 'request'`, the default Status filter is set to **PENDING** (only pending requests are shown first).
- **The HOLD option is NOT available in deposit mode** — neither in the Status filter dropdown nor in the Change Status modal. HOLD is available only in Withdraw mode.
- The rest of the layout (filters, table columns, modals) remains the same as Withdraw mode.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Deposit". Breadcrumb: Dashboard → Deposit. Below it a "List" header with a filter toggle icon.
- **Filters / inputs:**
  - **Select Dealer** (searchable mat-select, `ngx-mat-select-search`) — shown only for `user.usetype == 0` (super admin). Selecting a dealer reloads the list.
  - **Status** (dropdown) — All / Pending / Completed / Rejected. _(No Hold in Deposit.)_
  - **From Date** / **To Date** (date pickers).
  - **Days** (dropdown) — Today / Yesterday / last 7 days / last 30 days.
- **Buttons:**
  - Filter toggle icon (`filter_alt`) — collapse/expand the filter panel.
  - **Export** (download icon) — only for `usetype == 0`; exports to Excel (.xlsx) (`/exportDepositData`).
  - Per-row **View Image** (image icon) — shown when a screenshot is available. _(Action column only for `usetype != 0`.)_
  - Per-row **Edit** (edit icon) — only on a PENDING (or HOLD) request; opens the Change Status modal.
- **Table columns:** #, Username, Description, Request Method (Normal/Fast), Amount, Account Name, UPI, Account Number, IFSC Code (hidden for baziwala), User P/L, Available (balance), Exposure (liability), Request Type (Deposit/Withdraw), Bank Name, Branch Name, Sender Name, Transaction Id, Utr Number, Remark, Date, Status, Action. The footer shows **Total** (sum of req_amount).
  - Note: The **Cashout Number** column is always removed in the constructor. The **Action** column is removed for `usetype == 0`. If `baziwala` is true, the IFSC Code column is also removed.
- **Total D/W Amount card:** Only on mobile and when `showTotal` is true (`usetype==1` and domain `exchbet` / `13.233.143.163`). It shows a Total D/W filter dropdown plus Total Deposit / Total Withdraw amounts.
- **Pagination:** mat-paginator (page sizes 10/25/50/100, default 50).

### Sub-pages

No separate sub-page — everything is handled through modals:

- **View modal** (`#viewModal`) — full request details: Payment Gateway, Bank Name, Account Name, UPI/Mobile, IFSC, Account Number, Request Amount, Approved Amount, Status, UTR, User Name, Sender Name, Receiver Name, Select Account, Description.
- **Change Status modal** (`#statusModal`) — fields: Status (COMPLETE / REJECT — no HOLD in deposit), Amount (only on COMPLETE), Transaction Id (only on COMPLETE; required when `project == 2`), Remark (textarea). Submit button. Status is disabled if the request is not PENDING/HOLD.
- **View Image modal** (`#viewImg`) — shows the request's screenshot image.

### Actions

- Filter deposit requests by Dealer, Status, date range, and Days.
- View a request's screenshot image.
- Edit a PENDING request to change its status — **COMPLETE** (amount + transaction id) or **REJECT**.
- On Reject, Chips is set to `0`; on submit, the balance/chips are updated (`/updateRequest`).
- Export data to Excel (.xlsx) (super admin).
- View Total Deposit/Withdraw amounts (conditional, mobile).
- Browse more records via pagination.

### Data Source (Technical)

- `POST /getRequest` — requests list (body `dealer_id`; query params: `page`, `type=1`, `from_date`, `to_date`, `status`, `userId`, `limit`).
- `POST /updateRequest` — status change (`id`, `Chips`, `CrDr`=type, `remark`, `transaction_id`, `status`).
- `GET /getTotal` — total deposit/withdraw amounts (`from_date`, `to_date`).
- `POST /exportDepositData` — Excel export (`type`, `userId`; responseType blob).
- `GET /getChild` — dealer search dropdown (`search`, `dealer=true`).
- **Socket:** `USER_UPDATE_DATA:<mstrid>` — when a `notification` event arrives (`reqType===1`), the deposit list **auto refreshes**.

---


## Agent Bank WD (Withdraw)

> **Menu path:** Sidebar → Agent Bank WD
> **Route:** `/super-duper-admin/bank-account/withdraw`
> **Query params:** `:type` = `withdraw`
> **Component:** `src/app/request/request.component.ts` (+ `request.component.html`)
> **Parent page:** [Agent Bank DP](agent-bank-dp.md) — same component, deposit mode

### Screenshot

![agent-bank-wd](screenshots/agent-bank-wd.png)

> _Screenshot placeholder — replace the image above with a screenshot taken from the live site._

### Purpose

This page manages the **withdraw (money debit) requests** of dealers/agents. When a user submits a withdraw request, it appears in this list, and the admin can **Complete**, **Reject**, or **Hold** it. **This is exactly the same component that Agent Bank DP uses** (`RequestComponent`) — only the route's `:type` param differs (`withdraw`), so the behaviour switches into withdraw mode.

### Withdraw Mode Behaviour + Differences from DP (IMPORTANT)

A single `RequestComponent` handles both deposit and withdraw. When the route param is `withdraw`:
- `reqType = '2'` is set — the `/getRequest` API is called with `type=2`, i.e. only **withdraw** requests are returned.
- The heading and breadcrumb show **"Withdraw"**.
- Because `type != 'request'`, the default Status filter is set to **PENDING**.
- **The extra `HOLD` option appears only in Withdraw mode:**
  - A **Hold** option appears in the Status filter dropdown (not in DP).
  - A **HOLD** option is also available in the Change Status modal (not in DP).
- The DP socket auto-refresh (`reqType===1`) **does not run on withdraw** — it is only for the deposit list.
- The rest of the layout (filters, table columns, modals) remains the same as DP.

> Note: If the route param is `request`, the title is "Bank Account Request" and `reqType = ''` (both types) is used — but from the sidebar only deposit/withdraw open.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Withdraw". Breadcrumb: Dashboard → Withdraw. Below it a "List" header with a filter toggle icon.
- **Filters / inputs:**
  - **Select Dealer** (searchable mat-select) — only for `user.usetype == 0`.
  - **Status** (dropdown) — All / Pending / **Hold** / Completed / Rejected. _(Hold only in withdraw.)_
  - **From Date** / **To Date** (date pickers).
  - **Days** (dropdown) — Today / Yesterday / last 7 days / last 30 days.
- **Buttons:**
  - Filter toggle icon (`filter_alt`).
  - **Export** (download icon) — only for `usetype == 0`; Excel export.
  - Per-row **View Image** (image icon) — for the screenshot.
  - Per-row **Edit** (edit icon) — only on a PENDING or HOLD request; opens the Change Status modal. Action column only for `usetype != 0`.
- **Table columns:** #, Username, Description, Request Method (Normal/Fast), Amount, Account Name, UPI, Account Number, IFSC Code (hidden for baziwala), User P/L, Available (balance), Exposure (liability), Request Type, Bank Name, Branch Name, Sender Name, Transaction Id, Utr Number, Remark, Date, Status, Action. The footer shows **Total** (sum of req_amount).
  - Note: The **Cashout Number** column is always removed; the **Action** column is removed for `usetype == 0`.
- **Total D/W Amount card:** Only on mobile + when `showTotal` is true (`usetype==1` and domain exchbet / 13.233.143.163).
- **Pagination:** mat-paginator (10/25/50/100, default 50).

### Sub-pages

No separate sub-page — everything via modals:

- **View modal** (`#viewModal`) — request details (Payment Gateway, Bank/Account details, Amounts, Status, UTR, names, Description).
- **Change Status modal** (`#statusModal`) — fields: Status (**HOLD** / COMPLETE / REJECT — HOLD only in withdraw), Amount (only on COMPLETE), Transaction Id (only on COMPLETE; required when `project == 2`), Remark. Submit.
- **View Image modal** (`#viewImg`) — shows the screenshot.

### Actions

- Filter withdraw requests by Dealer, Status (Hold included), date range, and Days.
- View the screenshot image.
- Edit a PENDING/HOLD request to change its status — **COMPLETE** (amount + transaction id), **REJECT**, or **HOLD**.
- On Reject, Chips is set to `0`; on submit, the balance/chips are updated.
- Excel export (super admin).
- Browse records via pagination.

### Data Source (Technical)

- `POST /getRequest` — requests list (body `dealer_id`; query: `page`, `type=2`, `from_date`, `to_date`, `status`, `userId`, `limit`).
- `POST /updateRequest` — status change (`id`, `Chips`, `CrDr`=type, `remark`, `transaction_id`, `status`).
- `GET /getTotal` — total deposit/withdraw amounts.
- `POST /exportDepositData` — Excel export.
- `GET /getChild` — dealer search dropdown (`search`, `dealer=true`).
- **Socket:** `USER_UPDATE_DATA:<mstrid>` — auto-refresh only for deposit (`reqType===1`); not for withdraw.

---


## Deduct Dealer

> **Menu path:** Sidebar → Deduct Dealer
> **Route:** `/super-duper-admin/deduct-dealer`
> **Component:** `src/app/deduct-dealer/deduct-dealer.component.ts` (+ `deduct-dealer.component.html`)

### Screenshot

![deduct-dealer](screenshots/deduct-dealer.png)

> _Screenshot placeholder — replace the image above with a screenshot taken from the live site._

### Purpose

From this page the admin can **add (Chips IN)** or **deduct (Chips Out)** chips to/from a dealer/agent's account. When a dealer is selected, both their **deductable amount** and previous add/deduct **history** are shown, and the amount is adjusted through a modal.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Deduct Dealer". Breadcrumb: Dashboard → (label). Below it a "List" header with a filter toggle icon.
- **Filters / inputs:**
  - **Select Dealer** (searchable mat-select, `ngx-mat-select-search`) — shown only for `user.usetype == 0`. Selecting a dealer loads the data for both tables (`init`).
- **Buttons:**
  - Filter toggle icon (`filter_alt`).
  - Per-row **Edit** (edit icon) — in the summary table; opens the Deduct Amount modal.
  - **Chips IN** (in the modal) — adds the amount (`type='1'`).
  - **Chips Out** (in the modal) — deducts the amount (`type='2'`).
- **Tables (two tables):**
  - **Table 1 (summary)** — columns: `#`, Username, **Amount Deductable** (`deduct_amount`). The Action column has the Edit button.
  - **Table 2 (history)** — columns: `#`, Username, **Amount Available** (negative = red, positive = green), **Amount Added/Deducted** (negative red / positive green), Date, Remark.
- **Pagination:** mat-paginator (for the history table; pageIndex synced from server `current_page`; page sizes 10/25/50/100).

### Sub-pages

No separate sub-page — just one modal:

- **Deduct Amount modal** (`#statusModal`) — fields: **Enter Amount** (number, min 1), **Remark** (textarea). The footer has two buttons: **Chips IN** and **Chips Out**. A validation error (`showErr` / `showMsg`) is also shown.

### Actions

- Search for and select a dealer.
- View the selected dealer's deductable amount and add/deduct history.
- Open the modal via the Edit icon and enter an amount + remark.
- Add chips to the dealer with **Chips IN**, or deduct chips with **Chips Out**.
- Amount validation (on submit): the amount must be **positive** (`> 0`) and must **not exceed the deductable amount**.
- Browse records in the history table via pagination.

### Data Source (Technical)

- `GET /getDeductAmount` — dealer's deductable amount (params: `dealer_id`, `page`, `limit`).
- `GET /getDeductData` — add/deduct history list (params: `dealer_id`, `page`, `limit`; response meta includes `total`/`current_page`/`per_page`).
- `POST /deductAmount` — add/deduct chips (body: `Chips`, `dealer_id`, `type` [1=IN, 2=OUT], `remark`).
- `GET /getChild` — dealer search dropdown (`search`, `dealer=true`).
- **Socket:** none.

---


## Results

> **Menu path:** Sidebar → Results
> **Route:** `/super-duper-admin/match-result`
> **Component:** `src/app/match-result/match-result.component.ts` (+ `match-result.component.html`)

### Screenshot

![results](screenshots/results.png)

> _Screenshot placeholder — replace the image above with a screenshot taken from the live site._

### Purpose

On this page the admin **declares results for match markets** and views the list of already-declared results. Authorized users can also **Revoke (rollback)** a result that was declared by mistake. The **Declare Result** section is only visible to certain authorized users.

### Access (Who Sees What)

- The **Declare Result form** is shown only when the user has `usetype == 0`, **or** `allow_result_declare` is true, **or** they are specific users (`usetype == 11` and `mstrid == 4957`; or `usetype == 11`, `mstrid == 2`, `mstrname == 'Ccompany'`).
- The **Action (Revoke) column** is added only when `usetype == 0`, `usetype == 55`, or the same specific `usetype == 11` users (mstrid 4957 / Ccompany).
- All other users see only the **Match Result list** (read-only).

### On-screen Layout (UI)

- **Declare Result section (conditional):**
  - Heading "Declare Result", breadcrumb Dashboard → Declare Result.
  - 4 cascading dropdowns (each step loads the next): **Select Sport** → **Select Match** → **Select Market** → **Select Selection**.
  - **Declare** button (enabled only when the form is valid).
  - Note: If the Markets list has more than one market, the "Match Odds" market is removed. In the Selections list, an extra **"Abandoned"** option is added (selectionId 0).
- **Match Result section:**
  - Heading "Match Result", breadcrumb Dashboard → Match Result.
  - **Filters (collapsible, toggled via the `filter_alt` icon):**
    - **Sport** (mat-select, All + sports).
    - **Select Match** (searchable mat-select, `ngx-mat-select-search`).
    - **Market** (mat-select, unique `MarketName`).
    - **Result Date** (date picker).
  - **Table columns:** `#`, Match (`MatchName`), Market (`MarketName`), Sport (`sportName`), Selection (`SelectionName`), Result (`result`), **Declared By** (`UserID`), Date, and for authorized users an **Action** (Revoke button).
  - **Loader:** spinner (`isLoading`).
  - **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.

### Sub-pages

No sub-page. Both Declare and the list are sections on the same page; Revoke happens via a `confirm()` dialog (no separate modal).

### Actions

- **Declare a result:** choose Sport → Match → Market → Selection, then Declare (`declareResult`). "Abandoned" can also be chosen.
- **Filter** the result list by Sport / Match (search) / Market / Date.
- **Revoke** a declared result (`rollback`, with a `confirm`) — separate endpoints for fancy and market.
- Browse results via pagination.

### Data Source (Technical)

- `GET /results` (params: `page`, `sport_id`, `match_id`, `date`, `limit`) — result list.
- `GET /getMatchesForResult?sportId=` — matches for declaring.
- `POST /getMatchMarketList` (body: `sportsId`, `matchId`) — markets for the match ("Match Odds" is filtered out).
- `GET /querySelection?marketId=` — selections for the market ("Abandoned" is added).
- `POST /results` — declare result (Sport_id, series_id, match_id, market_id, selectionId, isFancy=0, names...).
- `POST /rollbackMarketResult` — revoke a market result (isFancy != 1).
- `POST /rollbackFancyResult` — revoke a fancy result (isFancy == 1).
- `GET /getMatchesBySport` (params: `sport_id`, `search`) — searchable matches for the filter.
- `DataService.getSports()` — sports list (filter: `is_betfair`).
- **Socket:** none.

---


## Website Setting

> **Menu path:** Sidebar → Website Setting
> **Route:** `/super-duper-admin/domains`
> **Component:** `src/app/super-duper-admin/domains/domains.component.ts` (+ `domains.component.html`)

### Screenshot

![website-setting](screenshots/website-setting.png)

> _Screenshot placeholder — replace the image above with a screenshot taken from the live site._

### Purpose

On this page the list of website **domains** is managed. New domains can be added, and an existing domain's settings — logo, login banner, URL, headline, alternate URL, register option — can be edited.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Domains", breadcrumb Dashboard → Domains.
- **Filters / inputs:** none.
- **Buttons:**
  - **Add** (`domain_add` icon on the toolbar) — opens the create-domain modal (`manage()` with no argument).
  - Per-row **Edit** (pencil icon) — opens the edit-domain modal (`manage(d)`).
  - **Save** (inside the modal) — enabled when `form.valid`.
- **Table columns:** Logo (image, 80px), Login Banner (image, 80px), Name, Url (`value` field), Alternate Url, Action.
- **Loader:** spinner (`isLoading`) while the list is loading.
- **Cards/sections:** one "List" card.

### Sub-pages

No separate sub-page — a single modal reused for both create and edit (formly form, `maxWidth: 350px`):

- **Create Domain modal** (when there is no `id`) — fields: **Name** (required), **Url** (required), **Alternate URL**, **Mobile** (required), **Headline** (required), **Admin Headline**, **Logo** (file, image, required), **Login Banner** (file, image).
- **Edit Domain modal** (when there is an `id`) — fields: **Show Register** (Yes=1 / No=0), **Admin Headline**, **Alternate URL**, **Logo** (file), **Login Banner** (file). _(The create-only fields Name/Url/Mobile/Headline are not shown in edit.)_
  - Note: If Logo/Login Banner is a string (i.e. an existing URL, no new file chosen), it is sent empty on save so it is not overwritten.

### Actions

- Add a new domain.
- Edit an existing domain (including logo/banner upload, register on/off).
- Save the form (POST on create, PUT on edit).

### Data Source (Technical)

- `GET /domains` — domains list.
- `POST /domains` — create a new domain (FormData, multipart with logo/banner files).
- `PUT /domains/{id}` — update a domain (FormData).
- **Socket:** none.

---


## Add Worker

> **Menu path:** Sidebar → Add Worker
> **Route:** `/super-duper-admin/manage-helper`
> **Query params:** `userId`, `userTypeId` _(optional — if absent, the logged-in user's mstrid/usetype are used)_
> **Component:** `src/app/mange-helper/mange-helper.component.ts` (+ `mange-helper.component.html`) _(folder spelling: `mange-helper`)_

### Screenshot

![add-worker](screenshots/add-worker.png)

> _Screenshot placeholder — replace the image above with a screenshot taken from the live site._

### Purpose

On this page **"Helper" (worker/staff) accounts** are managed. You can create a new helper, grant them **permissions**, **change passwords**, and **edit** or **delete** accounts. A new helper's `usetype` is always `55`.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Helper", breadcrumb Dashboard → Helper.
- **Filters / inputs:** none.
- **Buttons:**
  - **Add New** (toolbar) — opens the Create Helper modal.
  - Per-row **Change Password** (`key` icon) — password change modal.
  - Per-row **View Account** (`manage_accounts` icon) — account edit modal.
  - Per-row **Delete Account** (`delete` icon) — deletes the helper immediately (`/helper/{id}` DELETE).
- **Table columns:** Name (`mstrname`), User Name (`mstruserid`), Action.
- **Loader:** spinner (`isLoading`).
- **Cards/sections:** one "List" card.

### Permissions Options

The "Select Permissions" multi-select on the Create Helper form offers these options:

- Fancy Activation
- Fancy Result Declare
- Match On and Off
- User Password Change
- Match Result Declare
- Active Matches and Manage Series
- **Extra (only for `usetype == 11` or `1`):** Deposit Request, Withdraw Request, Bank Account Add/Remove

### Sub-pages

No separate sub-page — three modals:

- **Create Helper modal** (`#createUserModal`) — fields: **Name** (required), **Registration Date** (defaults to today, disabled), **User ID** (required, with **live availability check** — "Username available." / "Username already exits."), **Domain** (mat-select, shown only to `usetype == 0`; for `usetype == 1` the user's domain is set automatically), **Select Permissions** (multi-select, required), **Password** (required), and a **Security Question** fieldset (Question + Answer, both required). The Save button is enabled when `form.valid`.
- **Change Password modal** (`#changePasswordModal`) — fields: **Old Password** (only when the form has an `oldPassword` control), **New Password** (required), **Confirm Password** (required, must match New — otherwise a `notMatch` error). Change button.
- **View Account modal** (`#viewAccountModal`) — title "View Account For {name}". Fields: **Name** (required), **User ID** (required). Update button.

### Actions

- Create a new helper — with permissions + security question.
- **Username availability** live check (`/username` async validator).
- Change a helper's password (with confirm-match validation).
- Update a helper's name/account.
- Delete a helper account.

### Data Source (Technical)

- `GET /helper` — helper list.
- `POST /helper` — create a new helper (raw form value, including permissions/question/answer).
- `PUT /helper/{id}` — update a helper account.
- `DELETE /helper/{id}` — delete a helper.
- `POST /username` — username availability validation (async).
- `POST /changeUserPassword` — password change (`userName`, `newPassword`, `userId`).
- `GET /domains` — domain dropdown list (in the create form, lazy loaded).
- **Socket:** none.

---


## Old Match Results

> **Menu path:** Sidebar → Old Match Results
> **Route:** `/super-duper-admin/settled-matches`
> **Component:** `src/app/super-duper-admin/settled-matches/settled-matches.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![old-match-results](screenshots/old-match-results.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page the admin views the list of matches that have already been settled (results declared + bets settled). Old settled matches can be searched by filtering on sport, match name and date range.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Settled Matches" heading, breadcrumb Dashboard → Settled Matches. Card title "List".
- **Filters (collapsible card — toggled via the top-right filter icon button):**
  - `Sport Name` (mat-select, "All" + only betfair sports)
  - `Match Name` (text input)
  - `From Date` (date picker, default today minus 10 days)
  - `To Date` (date picker, default today)
  - "Search" button.
- **Buttons:** Filter icon (card collapse/expand), Search.
- **Table columns:**
  - `#` (serial)
  - `Match` (matchName)
  - `Open Date` (createdOn, `medium` date format)
- **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.
- **Empty state:** "There is no data available." when there is no data.
- **Loader:** spinner above the table (isLoading).

### Sub-pages

None.

### Actions

- Filter settled matches by sport / match name / date range and click "Search".
- Browse the list through pagination.

### Data Source (Technical)

- **API:** `POST /getSettleMatchList` — body contains `match_name`, `bet_deleted` (status), `sport_id`, `from_date`, `to_date` (+ `page_no:0`, `limit:0` in body); query params `page`, `limit`. Response: `data.data` (list), `data.meta` (pagination).
- Sports dropdown: `DataService.getSports()` (only `is_betfair` sports are kept).
- **Socket:** none.

> _Note: A "Status" filter (All / Deleted Bets / Undo Bets) is commented out in the template — currently inactive._

---


## Settlements

> **Menu path:** Sidebar → Settlements
> **Route:** `/super-duper-admin/settlement-entry`
> **Component:** `src/app/super-duper-admin/settlement-entry/settlement-entry.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![settlements](screenshots/settlements.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page the admin views the list of settlement (give-and-take) entries between parent and child users. Each entry contains the parent/child name, date, amount and remark. An incorrect entry can also be deleted.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Settlement Entries" heading, breadcrumb Dashboard → Settlement Entries. Card title "List".
- **Search input:** Top-right "Search..." text box — the table is filtered client-side via the `search` pipe.
- **Table columns:**
  - `#` (serial)
  - `Parent Name` (parentUser)
  - `Child Name` (childUser)
  - `Date` (onDate, `medium` format)
  - `Amount` (amountV)
  - `Remark` (remarkV)
  - `Action` (delete icon button)
- **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.
- **Empty state:** "There is no data available." when there is no data.
- **Loader:** spinner (isLoading).

### Sub-pages

None.

### Actions

- Filter entries client-side by typing in the search box.
- Remove a settlement entry via the delete icon (`remove()`, with an "Are you sure?" confirmation).
- Browse entries through pagination.

### Data Source (Technical)

- **API:**
  - `GET /getSettlementList` (params: `page`, `limit`) — settlement entries list. Response: `data.data` + `data.meta`.
  - `POST /removeSettlementList` (body: `ID = rowId`) — delete entry.
- **Socket:** none.

> _Note: A Date / User filter form (Select User search, From/To date, Filter button) and the `getChild` (`GET /getChild`) user-search logic are commented out in the template — currently inactive._

---


## Set Fancy BetLimit

> **Menu path:** Sidebar → Set Fancy BetLimit
> **Route:** `/super-duper-admin/manage-fancy`
> **Component:** `src/app/super-duper-admin/manage-fancy/manage-fancy.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![set-fancy-betlimit](screenshots/set-fancy-betlimit.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page the admin manages the fancy markets of a match — setting bet limits (min/max stake, exposure), message and status, showing/hiding a fancy, and declaring or abandoning a fancy result. Some limit/status columns are hidden for specific company users.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Manage Fancy Markets" heading, breadcrumb Dashboard → Fancy Markets. Card title "List".
- **Filters / inputs (toolbar row):**
  - `Select match` (mat-select, match list — list reloads on selection)
  - `Select type` (mat-select: All / Sessions (`session`) / Line (`line`))
  - `Search` (text input, `appDelayInput` — reloads on delayed input)
- **Table columns:**
  - `#` (serial)
  - `Match Name` (matchName)
  - `Fancy Name` — slide-toggle (active=1 → on, otherwise hidden) + `HeadName` label
  - `Min Stake` (number input — `MinStake`)
  - `Max Stake` (number input — `MaxStake`)
  - `Max Exposure` (number input — `max_session_liability`)
  - `Max Bet Exposure` (number input — `max_session_bet_liability`)
  - `Message` (text input — `message`)
  - `Status` (mat-select: Active(1) / In Active(0) / Suspend(4) / Hide(9))
  - `Result` (text input — `result`)
  - `Declare` (Declare button — enabled only when `result` is filled)
  - `Action` (Abandoned button + "Update Stake & Message" button)
- **Conditional hide:** For specific users the `Min Stake`, `Max Stake`, `Max Exposure`, `Max Bet Exposure`, `Message`, `Status` columns and the "Update Stake & Message" button are hidden. Condition: (`usetype == 11 && mstrid == 4957`) or (`usetype == 11 && mstrid == 2 && mstrname == 'Ccompany'`).
- **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.
- **Empty / not-found states:** "There is no data available." (data 0 and search blank) / "Not found." (result 0 with a search term).
- **Loader:** spinner (isLoading) + global loader (`dataService.loading`).

### Sub-pages

None.

### Actions

- Filter the fancy list by selecting match + type and searching.
- Show/hide a fancy via the slide-toggle (`hide()` → active 1 ↔ 9).
- Set Active / In Active / Suspend / Hide from the Status dropdown (`updateStatus()`).
- Edit min/max stake, exposure, message and save via "Update Stake & Message" (`updateFancyStake()`).
- Declare a fancy result by entering a result value and clicking "Declare" (`declareResult()`, with confirmation).
- Abandon a fancy via "Abandoned" (`abandonedFancy()`, with confirmation).
- Browse fancy markets through pagination.

### Data Source (Technical)

- **API:**
  - `GET /fancies` (params: `page`, `type`, `matchId`, `search`, `limit`) — fancy list (`data`), matches dropdown (`matches`), selected `matchId`, `meta`.
  - `PUT /fancies/{ID}` (body: `active`) — status update / show-hide.
  - `PUT /updateFancyStake/{ID}` (body: full row `d`, blank message → `null`) — stake/exposure/message update.
  - `POST /declareFancyResult` (body: `sportId`, `fancy_Id`, `matchId`, `result`, `selectionId = mFancyId`) — declare fancy result.
  - `POST /abandonedFancy` (body: `sportId`, `fancy_Id`, `matchId`) — abandon fancy.
- **Socket:** none.

---


## Queries

> **Menu path:** Sidebar → Queries
> **Route:** `/super-duper-admin/queries`
> **Query params:** `status` (PENDING / RESOLVED)
> **Component:** `src/app/super-duper-admin/queries/queries.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![queries](screenshots/queries.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page the queries/complaints submitted by users are shown. They are viewed across PENDING and RESOLVED tabs; the full text of a query can be viewed, and a pending query can be marked as resolved.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Queries" heading, breadcrumb Dashboard → Queries. Card title "List".
- **Tabs:** PENDING, RESOLVED (switched via the `status` query param; clicking a tab changes the route `/super-duper-admin/queries?status=...`).
- **Filters / search:** no text search (status tabs only).
- **Table columns:**
  - `#` (serial)
  - `Mobile` (mobile)
  - `Category` (category)
  - `Query` (first 100 chars + "...")
  - `Issue Date` (issue_date, `medium`)
  - `Resolve Date` (resolve_date, `medium`)
  - `Action` (Mark As Resolved icon + View icon)
- **Buttons:**
  - "Mark As Resolved" (done icon) — disabled on the RESOLVED tab; resolves the query when pending.
  - "View" (visibility icon) — opens the query detail modal.
- **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.
- **Modal:** "Query #{id}" — toolbar header + full query text + close button.
- **Loader:** spinner (isLoading) + global loader.

### Sub-pages

None (in-page modal only).

### Actions

- Switch between the PENDING / RESOLVED tabs.
- View the full text of a query in the modal (`openQuery()`).
- Mark a pending query as Resolved (`changeStatus()`).
- Browse through pagination.

### Data Source (Technical)

- **API:**
  - `GET /queries` (params: `page`, `status`, `limit`) — queries list (`data.data` + `data.meta`).
  - `PUT /queries/{id}` (body: `status: 'RESOLVED'`) — resolve query.
- **Socket:** none.

---


## News

> **Menu path:** Sidebar → News
> **Route:** `/super-duper-admin/news`
> **Component:** `src/app/blogs/blogs.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![news](screenshots/news.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page the list of news/blog posts is managed. You can create a new blog, edit an existing blog and delete a blog.

### On-screen Layout (UI)

- **Title / breadcrumb:** "News" heading, breadcrumb Dashboard → News. Card title "News List".
- **Filters / search:** none.
- **Buttons:**
  - Add (+ icon, "Create Blog") — navigates to the `create-blog` route.
  - Edit (pencil icon) — navigates to the `update-blog/{id}` route.
  - Delete Blog (delete icon) — deletes the blog after confirmation.
- **Table columns:**
  - `#` (serial)
  - `Slug` (slug)
  - `Content` (first 100 chars + "...")
  - `Created On` (createdOn, `medium`)
  - `Action` (Edit + Delete buttons)
- **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.
- **Loader:** spinner (isLoading) + global loader.

> _Note: A content-view modal markup (`changePasswordModal`, "Query #...") exists in the template but is not wired up (old copy-paste). Create/edit happens on a separate page (create-blog component)._

### Sub-pages

- [Create News](create-news.md) — opens via the Add (+) button (`create-blog` route).
- [Update News](update-news.md) — opens via the Edit (pencil) button (`update-blog/{id}` route).

### Actions

- Create a new blog/news (Create News page).
- Edit an existing blog (Update News page).
- Delete a blog (`deleteBlog()`, with an "Are you sure to delete ?" confirmation).
- Browse through pagination.

### Data Source (Technical)

- **API:**
  - `GET /blogs` (params: `page`, `limit`) — blog list (`data.data` + `data.meta`).
  - `DELETE /blog/{id}` — delete blog.
  - (Create/update are handled in the create-blog component — see sub-pages.)
- **Socket:** none.

---


## Create News

> **Menu path:** Sidebar → News → Add (+) button
> **Route:** `/super-duper-admin/create-blog`
> **Component:** `src/app/create-blog/create-blog.component.ts` (+ `.html`)
> **Parent page:** [News](news.md)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![create-news](screenshots/create-news.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page a new news/blog post is created — with title/slug, banner image, short description and rich-text content (HTML editor). The blog is saved via the "POST" button.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Create News" heading, breadcrumb Dashboard → Create News. Card title "Create a news".
- **Form fields:**
  - `Add Title/Slug` (text input — `slug`)
  - `Banner Image` (file upload, `image/*` only — Formly `file` field, key `image`)
  - `Add Description` (textarea — `description`)
  - Rich-text editor (`angular-editor`, height ~30rem — `content`). Image upload is also available inside the editor: `POST {apiBase}/blogImage`. The insert-video button is hidden.
- **Buttons:** "POST" (in create mode; submit → `saveBlog()`).
- **Loader:** global loader (`dataService.loading`).

### Sub-pages

None.

### Actions

- Create a new blog by filling in slug, banner image, description and content ("POST").
- Format and insert images via the editor (custom classes: quote, redText, titleText).

### Data Source (Technical)

- **API:**
  - `POST /blog` — save new blog (multipart `FormData`: `image`, `content`, `slug`, `description`). Create mode applies when the route has no `:id`.
  - Editor image upload: `POST {apiBase}/blogImage` (hard-coded in the component as `http://13.233.143.163/api/admin/blogImage`).
- **Socket:** none.

> _Note: The same component also handles edit mode — when `:id` is present it becomes "Update News". See [Update News](update-news.md)._

---


## Update News

> **Menu path:** Sidebar → News → Edit (pencil) button
> **Route:** `/super-duper-admin/update-blog/:id`
> **Component:** `src/app/create-blog/create-blog.component.ts` (+ `.html`) — the same component as Create News, in edit mode when `:id` is present
> **Parent page:** [News](news.md)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![update-news](screenshots/update-news.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page an existing news/blog post is edited. When `:id` is present in the route, the component switches to edit mode (`updateView = true`), loads the existing blog data, and saves via the "UPDATE" button.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Create News" heading (the template is the same), breadcrumb Dashboard → Create News. Card title "Create a news".
- **Form fields (same as Create News, but pre-filled with data):**
  - `Add Title/Slug` (text input — `slug`, loaded and filled in)
  - `Banner Image` (file upload — `image`; if no new file is chosen, an empty string is sent in place of the existing one)
  - `Add Description` (textarea — `description`)
  - Rich-text editor (`angular-editor` — `content`, the existing content is loaded and shown)
- **Buttons:** "UPDATE" (in edit mode the button label becomes "UPDATE"; submit → `saveBlog()`).
- **Loader:** global loader.

### Sub-pages

None.

### Actions

- Update a blog by editing slug / image / description / content ("UPDATE").

### Data Source (Technical)

- **API:**
  - `GET /getBlog` (param: `id`) — load existing blog (`data.slug`, `data.content`, `data.description`).
  - `POST /updateBlog/{blogId}` — update blog (multipart `FormData`: `image`, `content`, `slug`, `description`).
  - Editor image upload: `POST {apiBase}/blogImage`.
- **Socket:** none.

> _Note: Create and Update are both the same `CreateBlogComponent`. The mode is decided from `id` in `ActivatedRoute.params` — if `id` is present it is update (`updateView=true`), otherwise create._

---


## Ip Surveillance

> **Menu path:** Sidebar → Ip Surveillance
> **Route:** `/super-duper-admin/ip-surveillance`
> **Component:** `src/app/ip-surveillance/ip-surveillance.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![ip-surveillance](screenshots/ip-surveillance.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page today's login logs are shown grouped by IP (only `usetype === 3` users). The goal is to track suspicious activity by spotting multiple users logging in from a single IP.

### On-screen Layout (UI)

- **Title / breadcrumb:** "IP Surveillance" heading, breadcrumb Dashboard → IP Surveillance. Card title "List".
- **Filters / search:** none.
- **Table columns:**
  - `S.No` (serial)
  - `User(s)` — all users for one IP (userId + username list)
  - `IP` (ip)
  - `City` (city, "-" when blank)
  - `Region` (region, "-" when blank)
  - `org` (org)
  - `Login Time(s)` — all login times for that IP (`medium` format)
  - `Action` — "Block IP" button (UI only; no backend action wired up yet)
- **Empty state:** "There is no data available." when data is 0.

### Sub-pages

None.

### Actions

- View today's IP-wise grouped login logs.
- See how many users logged in under a single IP.
- (The Block IP button is visible but has no backend action attached yet.)

### Data Source (Technical)

- **API:** `GET /loginLogs/today` — today's login logs. Client-side, a `usetype === 3` filter is applied and entries are grouped by IP (`groupByIp`) (per IP: users list + loginTimes array, duplicate users skipped).
- **Socket:** none.

> _Note: An old (commented-out) table version also exists at the top of the HTML — only the "List" table below it is active._

---


## Concurrent Users

> **Menu path:** Sidebar → Concurrent Users
> **Route:** `/super-duper-admin/concurrent-users`
> **Component:** `src/app/concurrent-users/concurrent-users.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![concurrent-users](screenshots/concurrent-users.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page sport-wise active or completed (result) matches are shown, and for a given match the live count of how many users placed how many bets can be viewed in a modal. Active matches keep updating live via the socket.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Concurrent Users" heading, breadcrumb Dashboard → Concurrent Users.
- **Top filters:**
  - `Select Sport` — dropdown (sports list; default Cricket = id 4. Some sport ids are filtered out: 1233, 1234, 1235, 1236, 4339, 7, 77, 11, 6).
  - `Type` — dropdown: Active (`true`) / Result (`false`).
  - "Search" button.
  - `From Date` / `To Date` (date pickers) + "Load" button — shown only in Result mode (`completedMatchesLoaded`) (default range: today minus 10 days to today).
- **List card ("List"):** same column set for both Active and Result modes, only the field names differ:
  - `Sports` (SportID/sport_id → CRICKET/Soccer/Tennis)
  - `Match Id`
  - `Market Id` (active: marketId / result: MarketId)
  - `Match Name` (active: matchName / result: EventName)
  - `DATE` (active: date / result: settle_date, `medium`)
  - `Action` — "Get Users" button (per-user bet count modal)
- **Modal (userModal):** header "Total Users - X / Total Bets - Y"; table S.No, User ID (username), Total Bets; "Close" button.

### Sub-pages

None (in-page Get Users modal only).

### Actions

- Select Sport and Type (Active/Result) and click "Search".
- In Result mode, provide a From/To date range and click "Load".
- View the per-user bet count modal for a match via "Get Users" (`getCountUser()` — merges normal + fancy bets).
- Live active matches refresh automatically via socket updates.

### Data Source (Technical)

- **API:**
  - `POST /dashboard` (body: `sport_id`) — active matches list. Rooms add/remove + join/leave per `marketId`.
  - `GET /bets/countPerUser/` (param: `matchId`) — per-user bet counts for a match (`normalBets`, `fancyBets`).
  - `POST /profitLoss` (body: `userId`, `fromDate`, `toDate`, `page`, `sportId`, `limit`) — completed/result matches data.
  - Sports list: `DataService.getSports()`.
- **Socket:** `connect`; emit `room` { name: 'DASHBOARD_UPDATE_ADMIN' }; `DASHBOARD_UPDATE_ADMIN` (matches refresh); `message` (live market data update via `updateData`); per-`marketId` join/leave room. Rooms are cleaned up in `ngOnDestroy`.

---


## Market Setting

> **Menu path:** Sidebar → Market Setting
> **Route:** `/super-duper-admin/settings`
> **Component:** `src/app/super-duper-admin/settings/settings.component.ts` (+ `.html`)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![market-setting](screenshots/market-setting.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

On this page global market/betting settings are configured — default stakes, default values, sport-wise limits (min/max stake, profit, bet delay etc.), the on/off toggle for auto result declare, and the option to clear the database.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Settings" heading, breadcrumb Dashboard → Settings.
- **Sections / cards:**
  - **On/Off Auto Declare Result: Fancy And Markets (not for match odds)** — shown only to the `usetype === 0` user. A single checkbox "Auto Declare Result:" + status message. The toggle uses a browser `prompt` (password) + `confirm`.
  - **Default Stake** (when stakes are loaded) — Formly `repeat` form, "Add Stake" to add/delete multiple stake values, "Save" button.
  - **Set Default Values** — table: Name, Value (number input), Action ("Update" button per row).
  - **Sport Limit** — sport-wise tabs (from the sports list). For each sport, each type (market / fancy / bookmaker / toss) has the fields: Min Stake, Max Stake, Max Profit, Bet Delay, Market Volume, Max Market Exposure, Lay Diff (visible only for cricket / sport id 4). Plus an "Apply To Active market" checkbox and a "Save" button.
  - **Clear Database** (when `resetDbfields`) — Password field, "Confirm & Clear" button, note: "After clearing the database, please reload all PM2 services...".
- **Modals / dialogs:** no modal (the auto declare toggle uses the browser prompt/confirm).
- **Loader:** global loader (`dataService.loading`).

### Sub-pages

None.

### Actions

- Turn Auto Declare Result on/off — with a password prompt + confirm (`toggleAutoDeclare()`; on cancel/error the checkbox reverts).
- Add/edit/save default stake values (`saveStake()`).
- Update the default values table (`update()`).
- Set sport limits per sport per type (`updateSportLimit()`; with the "Apply To Active market" checkbox).
- Clear the database (by providing a password — `resetDb()`, with confirmation, then redirect to `/login`).

### Data Source (Technical)

- **API:**
  - `GET /saveStake` / `POST /saveStake` — default stakes.
  - `GET /getDefaultValues` / `POST /setDefaultValues` (body: `{ settings: data }`) — default values.
  - `GET /sportLimits` (param: `userId=1`) / `POST /sportLimits` (body: `sportLimitModel` — sportId, userId, data[], applyToAll) — sport limits.
  - `GET /autoDeclareResult/status` (status === 1 → active) / `POST /autoDeclareResult/toggle` (body: `status`, `password`) — auto declare toggle.
  - `POST /clear` (body: `{ password }`) — clear database.
- **Socket:** none.

---


