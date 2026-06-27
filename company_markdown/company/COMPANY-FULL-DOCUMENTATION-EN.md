# Company Panel — Full Documentation (English)

This is the **complete, single-file English documentation** for the `company` panel (role = 11) of the **bsf2020-admin-ui** project. Every sidebar page is documented in UI (sidebar) order, and pages that open other pages inside them (for example **Live Matches** → match click → Bet Slips / Session Bet Slip / Live Report / Collection Report) are documented as nested sub-pages right after their parent.

- **Live URL:** `http://localhost:4200/company/home-dashboard`
- **Login level:** Company (role 11)
- **Source code (read-only):** `d:\2024\bsf2020-admin-ui\src\app`
- **These docs live OUTSIDE the project:** `d:\2024\bsf2020-admin-docs\company\` (no app/project files were changed)

> **Note:** This is the English single-file version. A Hinglish, per-page (multi-file, nested-folder) version of the same content lives alongside it — see [README.md](README.md). Many pages are shared with the super-duper-admin panel (same Angular components); the company-specific menu, routes (prefix `/company/`), query params and role (11) were adapted. Screenshots are placeholders; add live screenshots into the `screenshots/` folders.

---

## Page Index (sidebar order)

| # | Menu Item | Pages inside it (sub-pages) | Route |
|---|-----------|------------------------------|-------|
| 1 | **Dashboard** | — | `home-dashboard` |
| 2 | **Manage** (role-wise user lists) | Admin (10), Sub Admin (9), Super Stockist (8), Stockist (1), Agent (2) → user click → User Dashboard → Receive/Pay Cash, Client Ledger, Match Ledger Summary, Coin History, Ledger Tables | `users?userTypeId=…` |
| 3 | **Live Matches** ⭐ | Agent Match Dashboard → Bet Slips, Session Bet Slip, Live Report, Collection Report | `dashboard` |
| 4 | **Completed Matches** | Agent Match Dashboard (full) → Bet Slips, Session Bet Slip, Live Report, Client / Company / Session Earning / Collection Report, Ledger, Show Bet | `completedMatchesList` |
| 5 | **Aura GGR** | — | `royal-casino` |
| 6 | **Block Market** | — | `sports` |
| 7 | **Manage Clients** | User (`users?userTypeId=3`), Blocked Clients → Edit Blocked Client, Commission & Limits | `users`, `blocked-user`, `commission-limit` |
| 8 | **Manage Password** | — | `change-password` |
| 9 | **Search Logs User** | Log User Details | `search-logs-user` |
| 10 | **Manage Ledgers** | Collection Report, My Stmt. (`report?id=3`), Profit & Loss (`report?id=2`), **Company Len Den** ⭐ | `collection-report-all`, `report`, `company-lenden` |
| 11 | **All Reports** | My Stmt. (id=3), Profit & Loss (id=2), Chips Summary, Bet History (id=1), **Settlement** (`chip-history?type=3`) ⭐, Login History (id=4), Deleted Bet History (id=5), Password History (id=6) | `report?id=…`, `chip-summary`, `chip-history` |
| 12 | **Bet List Live** | — | `current-bets` |
| 13 | **Results** _(conditional menu)_ | — | `match-result` |
| 14 | **Set Fancy BetLimit** _(conditional menu)_ | — | `manage-fancy` |
| 15 | **Banners** ⭐ | — | `banners` |
| 16 | **Concurrent Users** | — | `concurrent-users` |

### Top-bar (Header) dropdown pages
Available on every page (component `company.component`): **Change Password** (`change-password`), **Settings** (`settings` — the company Settings/Domain Settings page), **Offers Settings** (`offers-settings` — agent offers form), plus Balance / P&L / Log out on mobile. A blinking **Agent Offer** badge in the sidebar header opens `agent-offers` (read-only offer display) when `usetype != 0`.

### Important implementation notes
1. **Company-specific pages not present in super-duper-admin:** Company Len Den (`company-lenden`), Banners (`banners`), Settlement (`chip-history?type=3`), and the header pages Settings (`settings`) and Offers Settings (`offers-settings`).
2. **`company-report` and `ledger-match-wise` routes ARE registered** in the company routing module (unlike super-duper-admin, where they were not), so they are working pages here.
3. **Role-wise Manage lists** (Admin / Sub Admin / Super Stockist / Stockist / Agent / User) are all the **same `users` component**, differing only by the `userTypeId` query param. Full detail is under the "Admin" section.
4. **`report` is a single shared component** driven by the `id` query param (1 = Bet History, 2 = Profit & Loss, 3 = Account Statement / My Stmt, 4 = Login History, 5 = Deleted Bet History, 6 = Password History).
5. **Results and Set Fancy BetLimit menus are conditional** — shown only to users matching `(usetype==11 && mstrid==4957)` or `(usetype==11 && mstrid==2 && mstrname=='Ccompany')`, with declare access governed by `allow_result_declare`.
6. **Live Matches vs Completed Matches hub:** both open the same `live-game-detials` (Agent Match Dashboard). Live Matches passes `pageType='liveMatches'`, so only Bet Slips / Session Bet Slip / Live Report / Collection Report show. Completed (settled) matches have no pageType, so Client Report, Company Report and Session Earning Report also appear.

---


## Dashboard

> **Menu path:** Sidebar → Dashboard
> **Route:** `/company/home-dashboard`
> **Query params:** none
> **Component:** `src/app/home-dashboard/home-dashboard.component.ts` (+ `.html`)
> **Parent page:** none (this is the landing page shown after login)

### 📸 Screenshot

<!-- TODO: Place a live UI screenshot of this page here. Put the file in the screenshots/ folder. -->
![dashboard](screenshots/dashboard.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the Home (landing) screen shown after login. It displays a summary of the currently logged-in Company user — username, level, balance, profit/loss, share, and commission. It is a read-only display page only; there are no actions or forms. For a Company login (usetype=11), the level is shown as "Company" and the company contact is shown as "Company".

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Home", with only a "Home" link in the breadcrumb.
- **Section "Details"** (cards / ibox row):
  - **MY USERNAME** — `authService.user.mstrname`, with a small `authService.user.mstruserid` below it.
  - **MY LEVEL** — `myLevelName` (mapped from usetype: 11=Company, 10=Admin, 9=Sub Admin, 8=Super Stockist, 1=Stockist, 2=Agent, 3=Client, others=Super Duper Admin). For a Company login this is "Company".
  - **Current Balance** — `authService.user.balance`.
  - **Profit/Loss** — `authService.user.p_l` (red `text-danger` if negative, otherwise green `text-success`).
  - **Company Contact** — `companyContactName` (mapped from usetype: 11/10=Company, 9=Admin, 8=Sub Admin, 1=Super Stockist, 2=Stockist, 3=Agent, others=Super Duper Admin).
  - _(The MY FIX LIMIT card is commented out in code — currently not shown.)_
- **Section "My Share and Company Share"** (paired cards):
  - **Maximum My Match Share** — `partner_cricket %` / **Minimum Company Match Share** — `100 - partner_cricket %`.
  - **Maximum My Casino Share** — `partner_casino %` / **Minimum Company Casino Share** — `100 - partner_casino %`.
  - _(The Tennis and Soccer share cards are commented out in code.)_
- **Section "Commission"** (cards — each card is shown only when its value is > 0 or when `usetype == 0`):
  - **Match Odds Commission (To Take)** — `Commission`.
  - **Bookmaker Loss Commission (To Give)** — `rolling_commission`.
  - **Session Win Commission (To Take)** — `SessionComm`.
  - **Session Rolling Commission (To Give)** — `fancy_rolling_commission`.
- **Buttons:** none (display cards only).
- **Table columns:** no table.
- **Modals / dialogs:** none.

### Sub-pages

No sub-pages — this is a leaf (read-only) page with no navigation out of it.

### Actions

- The user can only view their own summary information (view-only page). No buttons/forms/edits.

### Data Source (Technical)

- **API:** No direct API call. All values come from the `AuthService.user` object (loaded on login / `authService.init()`). In `ngOnInit`, the `dataService.loading` flag is toggled on/off to manage the loader.
- **Socket:** no socket events.

---


## Manage → Admin (Users List)

> **Menu path:** Sidebar → Manage → Admin
> **Route:** `/company/users`
> **Query params:** `userTypeId=10` (Admin list), optional `userId`, `category` (`agent`/`client`), `actionType`
> **Component:** `src/app/users/users.component.ts` (+ `.html`)
> **Parent page:** none (top-level Manage page)

### 📸 Screenshot

<!-- TODO: Place a live UI screenshot of this page here. Put the file in the screenshots/ folder. -->
![admin-list](screenshots/admin-list.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the same common **Users** page used for all 5 lists under the Company panel's "Manage" submenu (Admin, Sub Admin, Super Stockist, Stockist, Agent) — only the `userTypeId` query param changes. With `userTypeId=10`, the list is filtered to users with the **Admin** role. From here you can create new child users, deposit/withdraw chips, lock/unlock, change passwords, set sport block/limit, poker block, and edit share/commission/profile.

> Note: The other 4 list pages (Sub Admin, Super Stockist, Stockist, Agent) also open **this** component with a different `userTypeId` — their docs only describe the difference (userTypeId) and link here for the full detail.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Manage Clients", breadcrumb: Dashboard → Manage Clients.
- **Top bar (All Users box):** Refresh icon (`init`), User Count icon (`getUserCount`), and **Create {role}** buttons — these navigate to the `users-create` page with `[queryParams]="{ userId, userTypeId }"`. Role visibility depends on `usersTypeList` and the parent's usetype.
- **Filters / search (within each table block):**
  - Status dropdown — All (`2`) / Active (`1`) / In Active (`0`) — `userGroup` (filters on `mstrlock` via `applyUserGroupFilter`).
  - **Search** input (type=search) — `search`, runs `init` on delayed input.
- **Tables (separate ibox per role, depending on `userTypeId`/`category`):** `data` is split by usetype into separate tables — `superAdminTableData` (10), `subAdminTableData` (9), `superMasterTableData` (8), `masterTableData` (1), `dealerTableData` (2), `clientTableData` (3). With `userTypeId=10` the Admin (super-admin) table is shown.
- **Table columns (`columns`):** `User Name` (mstruserid + mstrname — **link to `user-dashboard`**), `Phone` (when project != 1; except betpro), `PL` (`P_L`), `New PL` (`pl`, only on usetype 0), `Exposure/Liability` (`settlementAmount`), `Balance`, `Agent Type` (`getRole`), `My/Agent share`, `Action`. In the per-role child tables (`companyColumns`, `superAdminColumns`, etc.): `#/User Name/PL/New PL/Exposure/Balance/Agent Type/My Share/Agent share`.
- **Action column buttons:** `D` Deposit, `W` Withdraw, `Edit` (viewAccount), `SB` Sport Block, `SL` Sport Limit, `PB` Poker Block, User Lock/Unlock (slide toggle), Bet Lock/Unlock (slide toggle), `PWD` Change Password, Account Statement icon (`account-statement` page).
- **Modals / dialogs (MatDialog):**
  - **A/C Chips In/Out** (`accountChipInOutModal`) — Deposit/Withdraw tabs; fields: Parent Chips (disabled), User Chips/Balance (disabled), **Amount** (Chips), **Remark** (RefID). Spinner on the Deposit/Withdraw button (`chipLoading`).
  - **Account of {user}** (`viewAccountModal`) — tabs: Casino Limit (on usetype 11), Edit Profile; Profile/Additional info, Partnership Information (`getPartnershipData`), and the Commission edit form.
  - **Change Password** (`changePasswordModal`) — newPassword + confirmPassword (match validator).
  - **Sport Block** (`sportBlockModal`), **Sport Limit** (`sportLimitModal`, Formly: Min Stake, Max Stake, Max Profit, Bet Delay, Market Volume, Max Market Exposure, Lay Diff — Lay Diff only on sportId 4/cricket), **Poker Block** (`pokerBlockModal`).
  - **My Share** (`myShareModal`), **Max Share** (`maxShareModal`), **User Count** (`userCountModal`).

### Sub-pages

- [user-dashboard.md](user-dashboard.md) — opens when **User Name** is clicked in any row. RouterLink: `['/', urlType, 'user-dashboard']` (in a Company login `urlType = company`), queryParams: `{ userId: d.usecode, userTypeId: d.usetype, parentId: d.parentId }`.
- **users-create** (separate page) — opens via the "Create {role}" button (`users-create`, queryParams `{ userId, userTypeId }`). _(This is the create-form page that is a peer in the same users folder.)_
- **account-statement** (separate page) — via the Account Statement icon in the Action column (`account-statement`, queryParams `{ id, type }`).

### Actions

- Create a new child user.
- Deposit / Withdraw chips (`saveCoins`).
- User lock/unlock (`lockUsers`), betting lock/unlock (`lockBetting`).
- Change password (`changeUserPassword`).
- Sport block (`blockedSports`), set sport limit (`sportLimits`), poker block (`blockedPoker`).
- View My Share / Max Share, edit commission (`updateComm`) and profile (`updateAccount`), casino limit increment (`poker/casinoLimitIncrement`).
- View user count (`getUserCount`), search / sort / status filter.
- Click a row to open that user's dashboard (`user-dashboard`).

### Data Source (Technical)

- **API:** `POST /masters` (list — category-wise if `category` is set, otherwise by `type`=userTypeId; paginated), `GET /users/{id}` (parent — `getParent`), `POST /saveCoins`, `POST /changeUserPassword`, `POST /updateAccount`, `POST /updateComm`, `POST /getPartnershipData`, `POST /lockUsers`, `POST /lockBetting`, `GET|POST /blockedSports`, `GET|POST /sportLimits`, `GET|POST /blockedPoker`, `POST /clearChip`, `GET /accountStatement`, `POST /getUserCount`, `GET /poker/getCompanyCasinoLimit`, `POST /poker/casinoLimitIncrement`.
- **Socket:** no socket events (fully REST based).

---


## Manage → Sub Admin (Users List)

> **Menu path:** Sidebar → Manage → Sub Admin
> **Route:** `/company/users`
> **Query params:** `userTypeId=9` (Sub Admin list), optional `userId`, `category`, `actionType`
> **Component:** `src/app/users/users.component.ts` (+ `.html`)
> **Parent page:** none (top-level Manage page)

### 📸 Screenshot

<!-- TODO: Place a live UI screenshot of this page here. Put the file in the screenshots/ folder. -->
![sub-admin-list](screenshots/sub-admin-list.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the **same Users list page as Admin**, just opened with `userTypeId=9` — that is, the list is filtered to the **Sub Admin** role. The UI, filters, columns, action buttons, modals, and APIs are exactly the same.

> For full detail (UI layout, columns, action buttons, modals, APIs, sub-pages) see: **[admin.md](admin.md)**. The only difference here: `userTypeId=9` (Sub Admin), and the Create button uses the "Create Sub Admin" type.

### Sub-pages

- [user-dashboard.md](user-dashboard.md) — opens when User Name is clicked in any row.

### Data Source (Technical)

- Same as [admin.md](admin.md) — list `POST /masters` (`type=9`).
- **Socket:** none.

---


## Manage → Super Stockist (Users List)

> **Menu path:** Sidebar → Manage → Super Stockist
> **Route:** `/company/users`
> **Query params:** `userTypeId=8` (Super Stockist list), optional `userId`, `category`, `actionType`
> **Component:** `src/app/users/users.component.ts` (+ `.html`)
> **Parent page:** none (top-level Manage page)

### 📸 Screenshot

<!-- TODO: Place a live UI screenshot of this page here. Put the file in the screenshots/ folder. -->
![super-stockist-list](screenshots/super-stockist-list.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the **same Users list page as Admin**, just opened with `userTypeId=8` — that is, the list is filtered to the **Super Stockist** role. The UI, filters, columns, action buttons, modals, and APIs are exactly the same.

> For full detail see: **[admin.md](admin.md)**. The only difference here: `userTypeId=8` (Super Stockist), and the Create button uses the "Create Super Stockist" type.

### Sub-pages

- [user-dashboard.md](user-dashboard.md) — opens when User Name is clicked in any row.

### Data Source (Technical)

- Same as [admin.md](admin.md) — list `POST /masters` (`type=8`).
- **Socket:** none.

---


## Manage → Stockist (Users List)

> **Menu path:** Sidebar → Manage → Stockist
> **Route:** `/company/users`
> **Query params:** `userTypeId=1` (Stockist list), optional `userId`, `category`, `actionType`
> **Component:** `src/app/users/users.component.ts` (+ `.html`)
> **Parent page:** none (top-level Manage page)

### 📸 Screenshot

<!-- TODO: Place a live UI screenshot of this page here. Put the file in the screenshots/ folder. -->
![stockist-list](screenshots/stockist-list.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the **same Users list page as Admin**, just opened with `userTypeId=1` — that is, the list is filtered to the **Stockist** role. The UI, filters, columns, action buttons, modals, and APIs are exactly the same.

> For full detail see: **[admin.md](admin.md)**. The only difference here: `userTypeId=1` (Stockist), and the Create button uses the "Create Stockist" type.

### Sub-pages

- [user-dashboard.md](user-dashboard.md) — opens when User Name is clicked in any row.

### Data Source (Technical)

- Same as [admin.md](admin.md) — list `POST /masters` (`type=1`).
- **Socket:** none.

---


## Manage → Agent (Users List)

> **Menu path:** Sidebar → Manage → Agent
> **Route:** `/company/users`
> **Query params:** `userTypeId=2` (Agent list), optional `userId`, `category`, `actionType`
> **Component:** `src/app/users/users.component.ts` (+ `.html`)
> **Parent page:** none (top-level Manage page)

### 📸 Screenshot

<!-- TODO: Place a live UI screenshot of this page here. Put the file in the screenshots/ folder. -->
![agent-list](screenshots/agent-list.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the **same Users list page as Admin**, just opened with `userTypeId=2` — that is, the list is filtered to the **Agent** role. The UI, filters, columns, action buttons, modals, and APIs are exactly the same.

> For full detail see: **[admin.md](admin.md)**. The only difference here: `userTypeId=2` (Agent), and the Create button uses the "Create Agent" type.

### Sub-pages

- [user-dashboard.md](user-dashboard.md) — opens when User Name is clicked in any row.

### Data Source (Technical)

- Same as [admin.md](admin.md) — list `POST /masters` (`type=2`).
- **Socket:** none.

---


## User Dashboard (Agent Match Dashboard)

> **Menu path:** Manage → (Admin / Sub Admin / Super Stockist / Stockist / Agent) → click User Name in a row
> **Route:** `/company/user-dashboard`
> **Query params:** `userId`, `userTypeId`, `parentId` (sometimes also `directRouteToCollectionReport`)
> **Component:** `src/app/user-dashboard/user-dashboard.component.ts` (+ `.html`)
> **Parent page:** [admin.md](admin.md) _(and the other Manage list pages: [sub-admin.md](sub-admin.md), [super-stockist.md](super-stockist.md), [stockist.md](stockist.md), [agent.md](agent.md))_

### 📸 Screenshot

<!-- TODO: Place a live UI screenshot of this page here. Put the file in the screenshots/ folder. -->
![user-dashboard](screenshots/user-dashboard.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

This is the dashboard for a single user/agent, opened by clicking a row in any Manage list (Admin/Sub Admin/Super Stockist/Stockist/Agent). At the top there are quick-action buttons for that user (cash receive/pay, ledgers, direct agents/clients, coin history), and below them the user's Coins (balance) and Rs. Exposure (settlementAmount) cards are shown. This is a **hub / navigation page** from which all the further user-specific pages open.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → SC → `{{ data?.mstrname }}`.
- **Box "Agent Match Dashboard"** (button row; all buttons navigate to a Company-prefixed route with that user's `userId`/`userTypeId`/`parentId` — in a Company login `urlType = company`):
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
  - **Rs. Exposure** — `data?.settlementAmount` (the `parsedSettlementAmount` getter derives it via `parseInt`).
  - **Coins Exposure** — present in the card code but `display:none` (hidden).
- **Buttons:** the action buttons listed above.
- **Table columns:** no table.
- **Modals / dialogs:** no modals (all routerLink navigation).

### Sub-pages

All go to `/company/`-prefixed routes (`urlType` becomes `company` from the logged-in Company user's usetype=11):

- [recieve-pay-cash.md](recieve-pay-cash.md) — via the "Recieve Cash" / "Pay Cash" buttons (cash collection / settlement page).
- [chip-history-user.md](chip-history-user.md) — via the "Ledger" and "Cash Ledger" buttons (chip/cash ledger page).
- [ledger-match-summary.md](ledger-match-summary.md) — via the "Match ledger" button (match-wise ledger summary).
- [coinHistory.md](coinHistory.md) — via the "Coin History" button (coin transaction history).
- [ledger-tables.md](ledger-tables.md) — ledger drill-down / detailed table view (table page opened from the ledger pages).
- [admin.md](admin.md) (`users` route) — via the "Direct Agents" (`category=agent`) and "Direct Client" (`category=client`) buttons — the same Users component, listing the agents/clients beneath that user.

### Actions

- Receive/pay cash for the selected user.
- View Ledger / Cash Ledger / Match ledger / Coin History.
- Navigate to that user's direct agents or direct clients list.
- View Coins (balance) and Rs. Exposure (read-only cards).

### Data Source (Technical)

- **API:** `GET /users/{userId}` (`getUserData` — loads that user's details into `data` on page load). All other data is loaded by the target sub-pages themselves.
- **Socket:** no socket events.

---


## Receive / Pay Cash

> **Menu path:** User Dashboard → Receive Cash / Pay Cash
> **Route:** `/company/recieve-pay-cash`
> **Query params:** `userId`, `userTypeId`, `componentType` (`receiveCash` or `payCash`), `agentName`, `agentId`, `settlementAmount`, `directRouteToCollectionReport` _(optional, `'true'`/`'false'`)_
> **Component:** `src/app/recieve-pay-cash/recieve-pay-cash.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

### Purpose

This page performs a cash settlement with a downline user (client/agent) — that is, either **receiving cash** from the user or **paying cash** to the user. The `componentType` query param decides whether the page opens in "Receive Cash From User" mode or "Pay Cash To User" mode. A chip-clearing entry is created against the settlement amount.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Matches" heading + breadcrumb (Dashboard → SC → `{agentName}` → "Receive Cash" / "Pay Cash").
- **Card title:** "Receive Cash From User" or "Pay Cash To User", depending on `componentType`.
- **Info rows (read-only):**
  - **Agent Name:** `{agentId} ({agentName})`.
  - **Rs. Exposure:** current `settlementAmount`.
- **Filters / inputs:**
  - **Update Ledger** — number input (`inputAmount`), shown only when `directRouteToCollectionReport === true`. This is where the amount to settle is entered (min 0, step 0.01).
  - **Note** — textarea.
    - If `directRouteToCollectionReport` is false → textarea is **readonly** with fixed text "Go to collection report for settlement".
    - If true → editable note (`note` field).
- **Buttons:**
  - **Save Changes** — visible only when `directRouteToCollectionReport === true`. On click it runs `clearChip()`. Disabled while the loader is active (`loaderBtn`).

### Sub-pages

None. _(When `directRouteToCollectionReport` is false the user is given guidance to go to the Collection Report, but there is no direct navigation from here.)_

### Actions

- **Enter amount + note** (in direct-route mode) and click **Save Changes**.
- `clearChip()`:
  - Validation: alerts if the amount is invalid. _(Note: the code condition is written as `inputAmount <= 0 && inputAmount > settlementAmount` — practically both cannot be true at the same time, so the validation is effectively skipped. Source quirk, noted here for documentation.)_
  - POSTs to `/clearChip` with `CrDr = 2` (receiveCash) or `1` (payCash), `Chips = inputAmount`, `discount = 0`, `IsFree = 2`, `Narration = note`.
  - After success, fetches the fresh `settlementAmount` via `getUserData()`, resets the input/note, and turns off the loader.

### Data Source (Technical)

- **API:**
  - `POST /clearChip` — creates the settlement/clear chip entry. Body: `userId`, `CrDr` (2=receive, 1=pay), `Chips`, `discount`, `IsFree`, `Narration`.
  - `GET /users/{userId}` — fetches the updated `settlementAmount` (`getUserData`).
- **Socket:** None.

---


## Client Ledger (Chip History User)

> **Menu path:** User Dashboard → Ledger / Cash Ledger
> **Route:** `/company/chip-history-user`
> **Query params:** `name` (username), `userid`, `parentId`, `typeId`, `matchId` _(optional)_, `filterType` _(optional, default `ALL`; values `Match` / `Single`)_
> **Component:** `src/app/chip-history-user/chip-history-user.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

### Purpose

Displays a specific user's **Client Ledger** (cash ledger) — date-wise narration along with Credit, Debit and running Balance. "Upper | Settlement" entries are smartly highlighted with a "Receive Cash" / "Pay Cash" label. Data is paginated and can be filtered match-wise.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Client Ledger" heading + breadcrumb (Dashboard → Client Ledger).
- **List header:** with the "List" title.
- **Filters / inputs:**
  - **Type dropdown** — shown only when the `matchId` query param is set. Options: **Match**, **Single** (`selectedType`). On change, the URL's `filterType` is updated and the data is refreshed.
- **Table columns:**
  - **Date** — `EDate` (medium format).
  - **Narration** — special handling:
    - If it starts with "Upper | Settlement" and `Credit > 0` → prefixed with "**Receive Cash |**" plus the formatted narration.
    - If it starts with "Upper | Settlement" and `Debit > 0` → prefixed with "**Pay Cash |**".
    - Otherwise plain narration.
  - **Credit** — `Credit`.
  - **Debit** — `Debit`.
  - **Balance** — `Balance` (running balance).
  - _(Note: in the source, the "Selection" / "action match-wise" columns are commented out — not active.)_
- **Buttons:** No action button is active (the match-wise button is commented out).
- **Pagination:** Material paginator (page size options 10/25/50/100, default 50).
- **Empty state:** "There is no data available." when there are no rows.

### Sub-pages

None. _(The `matchDetails()` method only updates the current page's `matchId`/`filterType` query params; it does not open a separate page. The match-wise navigation button is currently commented out.)_

### Actions

- **Change the Type filter** (Match/Single) when in a match context — `onTypeChange()` updates the URL + `fetchData()`.
- **Paginate** forward/backward — `fetchData(page, limit)`.

### Data Source (Technical)

- **API:**
  - `POST /chipHistoryID` — fetches ledger rows. Query params: `page`, `limit`. Body: `userId`, `parentId`, `matchId` (or `null`), `filterType`, `typeId` (number). Response: `data[]`, `meta.total`, `meta.perPage`.
- **Socket:** None.

---


## Ledger Match Wise (Match Summary)

> **Menu path:** User Dashboard → Ledger Match Wise
> **Route:** `/company/ledger-match-summary`
> **Query params:** `name` (username), `userid`, `parentId`
> **Component:** `src/app/ledger-match-summary/ledger-match-summary.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

### Purpose

Displays a user's **match-wise ledger summary** — the Credit and Debit totals against each match (narration), along with the date. This is essentially the same data as `/chipHistoryID`, but shown here in a match-summary view with a fixed `matchId: '1003'`.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Ledger Match Wise" heading + breadcrumb (Dashboard → Ledger Match Wise).
- **Section header:** "Match Summary".
- **Filters / inputs:** No active filter. _(The Type dropdown — ALL/Match/Single — is commented out in the source.)_
- **Table columns:**
  - **Date** — `EDate` (mediumDate format).
  - **Match Name** — `narration`.
  - **Credit** — `Credit` (number, 2 decimals).
  - **Debit** — `Debit` (number, 2 decimals).
- **Pagination:** Material paginator (page size 10/25/50/100, default 50).
- **Empty state:** "There is no data available."

### Sub-pages

None. _(The `openMatch()` method that opens the `ledger-match-wise` page on row click, and the clickable row, are commented out in the source — rows are not currently clickable.)_

### Actions

- **Paginate** — `fetchData(page, limit)`.
- _(The `onTypeChange()` method exists, but since the dropdown is commented out it is not triggered from the UI.)_

### Data Source (Technical)

- **API:**
  - `POST /chipHistoryID` — match summary rows. Query params: `page`, `limit`. Body: `userId`, `parentId`, `filterType` (`selectedType`, default `ALL`), `matchId: '1003'` (hardcoded). Response: `data[]`, `meta.total`, `meta.perPage`.
- **Socket:** None.

> _Tech note:_ The `getUrlType()` helper (usertype → route prefix mapping) is present in the component, but it currently existed only for the commented-out `openMatch()` navigation — it is not used in the active flow.

---


## Coin History

> **Menu path:** User Dashboard → Coin History
> **Route:** `/company/coinHistory`
> **Query params:** `userId`, `userTypeId`
> **Component:** `src/app/coin-history/coin-history.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

### Purpose

Displays a user's **coin/chip transaction history (account statement)** — the Credit, Debit and Balance for each date-wise deposit/withdraw/transaction. The footer shows the Opening Balance and the total Credit/Debit. This is based on the account statement for `accountType = '4'` (coin/changelog type).

### On-screen Layout (UI)

- **Title / breadcrumb:** "Coin History" heading + breadcrumb (Dashboard → CLIENTS → `{mstrname}` → Coin History).
- **Card title:** "`{mstrname}` Current User Changelog Details".
- **Filters / inputs:** No explicit filter controls are rendered in the UI. A default range is set internally — `fromDate` = today minus 10 days, `toDate` = today; `accountType = '4'`, `transactionType = 'all'`. _(The user-search/date-picker logic is present in the component but is not bound in this template.)_
- **Table columns:**
  - **#** — row index.
  - **Date** — `Sdate` (medium).
  - **User** — `mstrUserId`.
  - **Narration** — colour-coded: "deposit" → green, "withdraw" → red, otherwise dark.
  - **Credit** — green text.
  - **Debit** — red text.
  - **Balance** — `balance`.
- **Footer rows:**
  - **Opening Balance** — `openingBalance`.
  - **Total** — total Credit (green) and total Debit (red), calculated via `dataService.getTotal()`.
- **Row click:** If a row has a `matchId`, navigates to the `bet-history` page (query params: `matchId`, `marketId`, `userId`, `username`, `fancyId`).

### Sub-pages

- **bet-history** — on row click (when the row has a `matchId`), navigates to `{url}bet-history` with bet-related query params. _(This opens with the company panel's route prefix; a separate detailed doc exists for that page.)_

### Actions

- **Click a row** to view that match/market's bet-history (when `matchId` is available).
- **Search** — the `search` field (SearchPipe) filters the table data (the search input is bound in the template via the pipe).

### Data Source (Technical)

- **API:**
  - `GET /accountStatement` — main data. Params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type` (`all`), `type` (`4`), `limit`. Response: `data[]`, `meta.total`/`current_page`/`per_page`, `openingBalance`.
  - `GET /users/{userId}` — for `agentData` (mstrname etc.).
  - `GET /getChild?search=...` — child users search (debounced) for the user dropdown logic.
- **Socket:** None.

---


## Ledger Tables

> **Menu path:** User Dashboard → Ledger (Account Statement)
> **Route:** `/company/ledger-tables`
> **Query params:** `userId`, `userTypeId`
> **Component:** `src/app/ledger-tables/ledger-tables.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

### Purpose

Displays a user's **ledger / account statement** table — date-wise transaction Credit, Debit and Balance, along with Opening Balance and totals. The structure is the same as Coin History, but here the account statement for `accountType = '1'` (main/cash ledger type) is loaded.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Agent" heading + breadcrumb (Dashboard → SC → `{mstrname}` → Recieve Cash).
- **Top filter bar:**
  - Two **date inputs** (`type="date"`) and a **Search** button. _(Note: these date inputs and the Search button are currently not bound to any model/handler — static UI; the actual range is fixed internally.)_
- **Internal defaults:** `fromDate` = today minus 10 days, `toDate` = today, `accountType = '1'`, `transactionType = 'all'`.
- **List card:** "List" title.
- **Table columns:**
  - **#** — row index.
  - **Date** — `Sdate` (medium).
  - **User** — `mstrUserId`.
  - **Narration** — colour-coded: "deposit" → green, "withdraw" → red, otherwise dark.
  - **Credit** — green text.
  - **Debit** — red text.
  - **Balance** — `balance`.
- **Footer rows:**
  - **Opening Balance** — `openingBalance`.
  - **Total** — total Credit / total Debit (`dataService.getTotal()`).
- **Row click:** If a row has a `matchId`, navigates to `bet-history` (query params: `matchId`, `marketId`, `userId`, `username`, `fancyId`).

### Sub-pages

- **bet-history** — on row click (when the row has a `matchId`), navigates to `{url}bet-history` with bet-related query params.

### Actions

- **Click a row** to view the bet-history (when `matchId` is present).
- **Search** — the `search` field (SearchPipe) filters the table.
- _(The date filter inputs are visually present but are currently non-functional / unbound — source quirk.)_

### Data Source (Technical)

- **API:**
  - `GET /accountStatement` — main data. Params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type` (`all`), `type` (`1`), `limit`. Response: `data[]`, `meta.total`/`current_page`/`per_page`, `openingBalance`.
  - `GET /users/{userId}` — `agentData` (mstrname etc.).
  - `GET /getChild?search=...` — child users search (debounced).
- **Socket:** None.

---


## Live Matches

> **Menu path:** Sidebar → Live Matches
> **Route:** `/company/dashboard`
> **Query params:** None
> **Component:** `src/app/dashboard/dashboard.component.ts` (+ `.html`)
> **Role:** Company (usetype `11`)

![](screenshots/live-matches.png)

### Purpose

This page shows the list of live / upcoming matches sport-wise. From here the company (usetype `11`) can block/unblock an entire sport or an individual match, view a match's Live Report, and block users on a specific match. The data updates in real time through the socket. Clicking a match's **Title (name)** opens its "Agent Match Dashboard" (hub page).

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches.
- **Inplay / Upcoming buttons:** Two buttons ("Inplay", "Upcoming") at the top — currently UI-only buttons.
- **Sport tabs / buttons:** A grid of sport buttons (from the `sports` array). Clicking one loads that sport's matches (`getMatches`). Cricket (id 4) loads by default. Some sport ids are filtered out (`[1233,1234,1235,1236,4339,7,77,11,6]`); `7` and `4339` are treated as Horse-racing.
- **All-sport toggle:** Above the selected sport's table, a `mat-slide-toggle` "All {sport name}" — activates/deactivates the entire sport (`updateSport`, with a confirm prompt).
- **Table columns (normal sports — Cricket/Soccer/Tennis):**
  - `#` — match block toggle (`blockMatch`) + (when usetype is `0` or `11`; shown for company) a "Block Match" icon button (`person_off`) that opens the Block User panel.
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

- [Agent Match Dashboard](agent-match-dashboard.md) — opens on clicking the match's **Title (name) link** (hub page).
- [Live Report (My Markets)](live-report.md) — opens on clicking the row's **"LiveReport"** button (or also from the hub's "Live Report" button).

### Actions

- Select a sport to view that sport's matches.
- Activate/deactivate an entire sport (with a confirm prompt).
- Block/unblock an individual match (toggle, with a confirm prompt).
- Block/unblock specific users on a match (from the Block User dialog, with search + filter).
- Open a match's Agent Match Dashboard (Title link) or Live Report (LiveReport button).
- For horse racing, open My Markets / Bets per time slot.

### Data Source (Technical)

- **API:** `POST /dashboard` (`sport_id`), `PUT /sports/{id}` (active toggle), `POST /blockedMatches` (match block/unblock), `GET /blockedMatchUsers` / `POST /blockedMatchUsers`, `GET /blockedMarketUsers` / `POST /blockedMarketUsers`, `GET /allUsers` (user search).
- The sports list comes from `DataService.getSports()`. The route prefix is built from `DataService.url` (`/company/`).
- **Socket:** emit `room` (`DASHBOARD_UPDATE_ADMIN`), per-marketId `joinRoom` / `leaveRoom`. On `DASHBOARD_UPDATE_ADMIN` → matches refresh (`getMatches`), on `message` → live odds update (`updateData`).

---


## Agent Match Dashboard (Match name click)

> **Menu path:** Sidebar → Live Matches → click a match's **Title (name) link**
> **Route:** `/company/live-game-detials`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`, `matchStartDate`, `pageType` (here `'liveMatches'`)
> **Component:** `src/app/live-game-detials/live-game-detials.component.ts` (+ `.html`)
> **Parent page:** [Live Matches](live-matches.md)
> **Role:** Company (usetype `11`)

![](screenshots/agent-match-dashboard.png)

### Purpose

This is a small navigation / hub page ("Agent Match Dashboard"). It opens when you click a match name from Live Matches. No data table or odds are shown here — only buttons (links) to that match's related report / action pages. From here the user navigates onward to Bet Slips, Session Bet Slip, Live Report, Collection Report, etc. Each button forwards the same `matchId / marketId / sportId / matchName` query params. There is no API call or socket.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches". Breadcrumb: Dashboard → Matches → `{{ matchName }}`.
- **Header info bar:** An ibox panel with the large heading **"Agent Match Dashboard"**.
- **Tabs / sections:** No tabs. Only a center-aligned button group (`btn btn-primary btn-lg`).
- **Inputs / toggles / tables / modals:** None.

#### Buttons (each is a router link)

Entry from Live Matches always carries `pageType = 'liveMatches'`, which drives button visibility:

| Button | Route | Query params | Shown in `liveMatches`? |
|---|---|---|---|
| **Bet Slips** | `betslips-tables` | `matchId, marketId, sportId, matchName` | ✅ Yes |
| **Session Bet Slip** | `sessionbetslips` | `matchId, matchName` | ✅ Yes |
| **Live Report** | `my-markets` | `matchId, marketId, sportId, matchStartDate` | ✅ Yes |
| **Collection Report** | `collection-report` | `matchId, matchName` | ✅ Yes |
| Client Report | `client-report` | `matchId` | ❌ Hidden (only shown when `pageType != 'liveMatches'`) |
| Company Report | `company-report` | `matchId` | ❌ Hidden (`useType !== 0` AND `pageType != 'liveMatches'`) |
| Session Earning Report | `session-earning-report` | `matchId` | ❌ Hidden (only shown when `pageType != 'liveMatches'`) |

> **Note:** Because entry from Live Matches always carries `pageType = 'liveMatches'`, in this case for the company panel **only Bet Slips, Session Bet Slip, Live Report and Collection Report** are shown. Client Report, Company Report and Session Earning Report remain **hidden**.

### Sub-pages

Sub-pages of the buttons visible in `liveMatches` mode:

- [Bet Slips](bet-slips.md) — via the "Bet Slips" button.
- [Session Bet Slip](session-bet-slip.md) — via the "Session Bet Slip" button.
- [Live Report (My Markets)](live-report.md) — via the "Live Report" button.
- [Collection Report](collection-report.md) — via the "Collection Report" button.

### Actions

- View Bet Slips for the match.
- View Session Bet Slip.
- Open the Live Report (My Markets) page.
- View Collection Report.
- (Client / Company / Session Earning Report are only shown in non-liveMatches mode — not when arriving from Live Matches.)

### Data Source (Technical)

- **API endpoints:** None. This page only reads `ActivatedRoute.queryParams` and renders buttons.
- **Base URL:** The buttons build their routes by prefixing `dataService.url` (component variable `url`, `/company/` for company).
- **User type:** `useType` (`11`) is set from `authService.user.usetype` (only for button visibility).
- **Socket:** None.

---


## Bet Slips

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Bet Slips**
> **Route:** `/company/betslips-tables`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`
> **Component:** `src/app/betslips-tables/betslips-tables.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)
> **Role:** Company (usetype `11`)

![](screenshots/bet-slips.png)

### Purpose

This page shows all bets for a match's **match-odds type markets** (Match Odds, Bookmaker, Toss, Tied, Goals, etc.) in a market-wise tab layout. On each market tab you get that market's **Market Position** (runner-wise P/L) and a **Bet Slips table** (each bet's detail, runner-wise position, my-share and final plus/minus). User-wise filter and pagination are also available. (This is not for fancy/session bets — for those there is the Session Bet Slip page.)

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Bet Slips.
- **Top summary cards (4):** Total Bets, Settled Bets, Unsettled Bets, Reverted Bets (always 0). Values come from `counts` (the `/bets` response). (Inside the selected tab, these same 4 cards repeat with that market's `settled_bets_count` / `unsettled_bets_count`.)
- **Market tabs (nav-tabs):** `tabs` = the `market_name` of all markets. Clicking a tab loads that market's data (`selectTab`).
- **User filter:** "All User" dropdown — the unique `UserName` values from the selected market's bets (`onUserChange`).
- **Market Position table:** columns — RUNNER (`selectionName`), POSITION (`winValue + lossValue`). Data from `POST /plByMarket`.
- **Bet Slips table columns:** `#` (serial), Date (`MstDate`), Market Title (`marketName`), Rate (`Odds`), Amount (`Stack`), Mode (Lay → KHAI / else LAGAI), Runner Name (`selectionName`), user (`UserName (mstrname)`), **per-runner Position columns** (`Position{n}` — runner-wise value via `getRunnerValue`), My Share (`myShare %`), **per-runner Share columns** (`Share{n}` — via `getMyShare`), status (Settled → Declared badge / else Pending), plusMinus (final share of settled bets). The footer shows Amount total, runner totals, share totals, and the settled plus/minus total.
- **Pagination:** `mat-paginator`, page sizes 10/25/50/100.
- **Modals / dialogs:** None.

### Sub-pages

No sub-pages.

### Actions

- Switch between market tabs to view each market's bets.
- Filter bets user-wise.
- View market position, runner-wise position and my-share.
- View settled/unsettled status and plus-minus.
- Load more bets via pagination.

### Data Source (Technical)

- **API:** `GET /matches/{matchId}/markets` (markets + tabs + runner_json), `POST /plByMarket` (`matchId`, `MarketId[]`) — market position, `GET /bets` (params: `matchId, marketId, page, search, afterResult=yes, limit`) — bets + `counts` + pagination `meta`.
- My-share is calculated client-side (`getMyShare`) based on the logged-in user (company, `mstrid`) and the bet's share hierarchy (Company/Admin/SAdmin/SMaster/Master/Dealer).
- **Socket:** None.

---


## Session Bet Slip

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Session Bet Slip**
> **Route:** `/company/sessionbetslips`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/sessionbetslips/sessionbetslips.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)
> **Role:** Company (usetype `11`)

![](screenshots/session-bet-slip.png)

### Purpose

This page shows all of a match's **Fancy / Session bets** in a single table. Each session bet's detail — session title (selectionName), runs (Odds), amount, No/Yes mode, No/Yes position, my-share and final plus/minus — is shown. User-wise and Fancy(session)-wise filters and pagination are available. (For match-odds type bets there is a separate [Bet Slips](bet-slips.md) page.)

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Session Bet Slips.
- **Top summary cards (4):** Total Bets, Settled Bets, Unsettled Bets, Reverted Bets (always 0). Values come from `counts` (the `/bets` response).
- **Filters (2 dropdowns):**
  - **All User** — unique `UserName` values (`onUserChange`).
  - **All Fancy** — unique session names `selectionName` (`onFancyChange`).
- **Bet Slips table columns:** `#` (serial), betId (`MstCode`), Date (`MstDate`), user (`UserName (mstrname)`), sessionTitle (`selectionName`), runs (`Odds`), amount (`Stack`), mode (Lay → No / else Yes), no (`-getNoValue`), yes (`getNoValue`), My Share (`myShare %`), noPosition, yesPosition (via `getMyShare` per Lay/Back), status (Settled → Declared / else Pending), plusMinus (result-based win/loss share of settled session bets).
- **Footer totals:** Total label, Total Amount (`Stack`), Total No, Total Yes, Total Share No/Yes, and the settled plus/minus total.
- **Pagination:** `mat-paginator`, page sizes 10/25/50/100.
- **Modals / dialogs:** None.

### Sub-pages

No sub-pages.

### Actions

- View session/fancy bets.
- Filter user-wise and Fancy(session)-wise.
- View No/Yes position, my-share and settled plus/minus.
- Load more bets via pagination.

### Data Source (Technical)

- **API:** `GET /bets` (params: `matchId, page, search, afterResult=yes, limit, type=fancy`) — fancy bets + `counts` + pagination `meta`.
- Plus/minus and position calculation is client-side: `getNoValue`, `getMyShare`, `getTotalPlusMinus` (win/loss is decided from the result `tblresult_result` vs the bet `Odds`, combined with Lay/Back). My-share is based on the company (`mstrid`).
- **Socket:** None.

---


## Live Report (My Markets)

> **Menu path:** Sidebar → Live Matches → row's **"LiveReport"** button **OR** match Title → Agent Match Dashboard → **Live Report**
> **Route:** `/company/my-markets`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchStartDate`
> **Component:** `src/app/my-markets/my-markets.component.ts` (+ `.html`) — sub-panels: `src/app/my-markets/fancies/fancies.component.*` and `src/app/my-markets/line/line.component.*`
> **Parent page:** [Live Matches](live-matches.md) (also opens from [Agent Match Dashboard](agent-match-dashboard.md))
> **Role:** Company (usetype `11`)

![](screenshots/live-report.png)

### Purpose

This is the match's main **live management / monitoring dashboard**. All of a single match's markets (Match Odds, Bookmaker, Toss, Goals, manual markets) are shown with real-time odds, plus Fancy and Line sessions in cricket. From here you can view live odds, block markets/users, and browse bets of every category. The data updates live over the socket and bets refresh every 5 seconds.

> Note: This is the same page that opens both from the "LiveReport" button on the Live Matches list and from the "Live Report" button on the Agent Match Dashboard.
>
> **Role note (Company, usetype 11):** Many management controls are gated for `usetype == 0` (super-duper-admin) — the match name card and its action icons (match active toggle, in-play, manual market controls, Add Market, Declare Result, and several others) are not shown for the company role. For the company role, the mainly relevant controls are **Block user** (`person_off`, usetype `0/11`) and **Company-level Fancy settings** (usetype `11`), plus read-only monitoring of all odds/positions/bets.

### On-screen Layout (UI)

#### Title / breadcrumb
- Heading **"LIVE MATCH REPORT"**. Breadcrumb: Dashboard → Matches → Live Report.

#### Header info / match info bar
- **Score board iframe** (top): `scoreUrl` (based on `matchId`), height ~145.
- **Live TV** toggle: clicking the TV icon opens/closes the live TV iframe (`getLiveTv()` / `closeTv()`), source `matchData.tvUrl`.
- **Match name card** (only for `usetype == 0` — not shown for the company role): match name + date and match-level action icons (match active toggle, in-play, Fancy/Toss/Bookmaker on-off, Goals market, Match Settings, Add Market). For company, the `person_off` **Block user** icon remains visible (usetype `0/11`).

#### Markets cards (one panel per market)
- **Toolbar:** market_name + (Min/Max stack if set).
- **Manual market controls** (only usetype 0, is_manual==1 — not for company role): Ball Running, Suspend, diff value, In-play alarm, multiplier buttons.
- **Right side buttons:** market active toggle, **Declare Result** trophy icon, Market Settings — these are mostly for usetype 0; for company the relevant ones are **Block user** and the **Book** icon (user position modal, `getUserPositionModal`).
- **Odds table columns:** RUNNER, LAGAI (back0), KHAI (lay0; 0 in Toss), POSITION (`odds.pl`). Suspend/Lock overlay when the runner/market is not ACTIVE.

#### Fancy panel (`app-fancies`) — only SportID 4, 6, or 11
- "Fancy" toolbar + tabs All / Session(Line) / Result Waiting (usetype 0), diff value, **Company settings (usetype 11 — visible for the company role)**, Add Fancy (+, usetype 0).
- **Columns:** SESSION (HeadName + liability + controls), No (lay), Yes (back), Pos NO, Pos Yes, Action (POSITION button).

#### Line panel (`app-line`)
- Cricket line/session markets panel (`app-line`), with a fancy-like No/Yes structure.

#### Tables
- **Declared Sessions** — SESSION / Result / Status (PnL) + Total footer + paginator.
- **Declared Toss** (when toss is declared) — MARKET / Result / POSITION + total.
- **Current User Position** — Account (drill-down) / TeamA / TeamB / The Draw (when there are 3 runners).

#### Bets section
- **Bet type tabs** (usetype != 55): All (disabled), Bookmaker Bets, Fancy Bets (sportId 4), Toss Bets, Tied Bets, Match Bets, Goal Bets, + (for usetype 0) Delete BM Bets / Delete Fncy Bets.
- **Search** input (debounced).
- **Bets table columns:** Action (Delete / Revoke — mostly usetype 0), Username (→ parents), BetFor, Odds, Stack, PL, Date, Address (ip). Paginator.

#### Modals / dialogs
- Current User Position, Parents, Block User, Settings (match + market formly), Add Bet (manual), Declare Result, Add Market. The Fancy panel also has its own modals (Add Bet, Fancy Bets, Score Position, Result, Add Fancy, Block User, Settings, Parents). For the company role, the mainly relevant ones are Block User, Current User Position, Parents and (Fancy) Company Settings.

### Sub-pages

No separate route-level sub-page. Internally, the `app-fancies` and `app-line` child components are embedded, along with several modals/dialogs (listed above).

### Actions

- View the live score board and live TV.
- Monitor per-market odds, position and bets of every category.
- Block/unblock users at the match/market/fancy level (Block User).
- View/update Company-level settings on the Fancy panel (usetype 11).
- View account-wise user position and parents; view Declared Sessions/Toss/Fancy positions.
- (Admin-only controls like match/market/result declare, manual market, add market are for usetype 0 only — hidden for the company role.)

### Data Source (Technical)

#### my-markets endpoints
- `GET /matches/{matchId}` (+ marketId) — match detail; `GET /matches/{matchId}/markets` — markets + runners.
- `GET /getBetLock`, `GET /declaredResults/toss`.
- Bets (tab-wise): `GET /bookmakerBets`, `/fancyBets`, `/tossBets`, `/tiedMatchBets`, `/matchOddsBets`, `/goalsBets`, `/bookmakerDeletedBets`, `/fancyDeletedBets`.
- `POST /plByMarket` (positions), `POST /profitLossByMatch` (declared sessions), `POST /removeBet`, `POST /revokeBet`, `POST /getParents`.
- Block: `GET/POST /blockedMatchUsers`, `GET/POST /blockedMarketUsers`; `POST /blockedMatches`.
- (Admin-only, usetype 0) `POST /toggleManualActivation`, `PUT /matches/{MstCode}`, `PUT /markets/{marketId}` (settings), `POST /manualMarketBet`, `POST /addBookmaker`, `POST /removeBookmaker`, `POST /activateFancy`, `POST /deActivateFancy`, `POST /results`, `POST /manualMarket`, `POST /addGoalMarkets`, `POST /setBetLock`, `GET /allUsers`.

#### Fancy panel (fancies.component)
- `GET /matches/{matchId}/fancies`, `POST /fancyLiability`, `GET /fancyBets`, `GET /allUsers`, block `GET/POST`, `POST /toggleManualActivation`, `PUT` settings, fancy result `POST`, `POST /addManualFancy`, manual fancy bet `POST`. (For the company role, mainly read + block + company settings.)

#### Socket events
- **emit:** `UPDATE_MARKETS`, `room` (`MARKET_UPDATE_DATA:{matchId}`, `BETS_UPDATE_DATA:{mstrid}_{matchId}`), `MANUAL_DATA`.
- **on:** `UPDATE_MARKETS{matchId}`, `BETS_UPDATE_DATA:{mstrid}_{matchId}`, `MARKET_UPDATE_DATA:{matchId}`, `message` (live odds stream).
- **Line/Fancy:** emit `UPDATE_FANCY`, `room` (`FANCY{matchId}`), `MANUAL_FANCY_DATA`; on `UPDATE_FANCY{matchId}`, `message`, `LINE_BOOK_UPDATE:{mstrid}:{matchId}`.
- **Polling:** `getBets()` every 5 seconds.

---


## Collection Report

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Collection Report**
> **Route:** `/company/collection-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/collection-report/collection-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)
> **Role:** Company (usetype `11`)

![](screenshots/collection-report.png)

### Purpose

This page shows a **specific match's** chip summary in two columns — which client you have **to receive money from** (Payment Receiving From) and which client you have **to pay money to** (Payment Paid To). Each column is a table containing the client's name and current balance, plus a total in the footer. (The "Own", "Cash" and "Own Commission" rows are filtered out.)

> Note: This is the logged-in user's (company, `mstrid`) chip summary for that match. (The sidebar "Collection Report" — route `collection-report-all` — is a separate page that shows the entire account's balance in three groups.)

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Collection Report.
- **Two columns (ibox cards):**
  - **PAYMENT RECEIVING FROM (To Receive)** — data `minusData`.
  - **PAYMENT PAID TO (To Pay)** — data `plusData`.
- **Table columns (each card):** Client Name (`mstruserid (mstrname)`), Current Balance (left: `Musum`, right: `PUsum`). Footer shows "Total" + amount (`DataService.getTotal`).
- **Inputs / filters / buttons:** None — data loads on page load itself.
- **Modals / dialogs:** None.

### Sub-pages

No sub-pages.

### Actions

- View match-wise which client to receive from and which to pay.
- View each column's total balance.

### Data Source (Technical)

- **API:** `POST /chipSummary` (`mstrid` = logged-in user / company, `matchId`) — response `data.minusData` (To Receive) and `data.plusData` (To Pay). Client-side filter: `Own`, `Cash`, `Own  Commission` rows are removed.
- **Socket:** None.

---


## Completed Matches

> **Menu path:** Sidebar → Completed Matches
> **Route:** `/company/completedMatchesList`
> **Query params:** none
> **Component:** `src/app/completed-matches-list/completed-matches-list.component.ts` (+ `.html`)

![completed-matches](screenshots/completed-matches.png)

### Purpose

This page shows the profit/loss report for matches that have been settled (completed), filtered by date range and sport. Each match row can be expanded to view its market-wise PL/Comm, and the bet history can also be opened from there. Clicking the title of a cricket match (sport_id == 4) opens its **Agent Match Dashboard** (the settled-match hub).

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches" — breadcrumb: Dashboard → Matches.
- **Filters / inputs:**
  - `From Date` — date picker (default: 10 days before today / `dayjs().add(-10,'days')`).
  - `To Date` — date picker (default: today).
- **Buttons:**
  - `Load` — reloads the data for the selected date range (`getTypeData(1)`).
  - Sport tabs (`All` + the name of each sport) — sport-wise filter; clicking a tab reloads the data. Default sport `currentSportId = 4` (cricket).
  - Expand button (`add` / `remove` icon) — expands the row and fetches market-wise detail (`innercollapse`).
- **Table columns (outer):** `DATE/TIME` (settle_date), `Match Id` (matchId), `Match Title` (EventName — clickable link only for cricket `sport_id == 4` → `live-game-detials`), `Won By` (declaredResult.selectionName), `PL` (PnL, green/red), `Comm` (green/red). Footer row: `Total` + TotalPL + TotalComm.
- **Inner (expanded) table columns:** `Market Name`, `PL`, `Comm`, `CreatedOn` (MstDate), `Action` (`Show Bet` button → `bet-history`).
- **Loader:** `mat-spinner` while data is loading.
- **Modals / dialogs:** None — only inline expandable rows.

> ℹ️ Note: A "Ledger" button exists in the code but has been **commented out** (`ledger-match-wise` link). In the Company panel the `ledger-match-wise` route is **registered** (see ledger-match-wise.md), but this particular button on the list page is currently commented, meaning it cannot be opened by clicking the Ledger button from this page until it is uncommented.

### Sub-pages

- [Agent Match Dashboard](agent-match-dashboard.md) — opens when a cricket match title is clicked (settled-match hub with all report buttons).
- [Bet History](bet-history.md) — opens from the `Show Bet` button in the expanded inner table.
- [Ledger (match-wise)](ledger-match-wise.md) — the route is registered in the Company panel (working page); the direct button on this list is currently commented out.

### Actions

- Select From/To dates and pull the report with `Load`.
- Filter sport-wise (or All) using the sport tabs.
- Expand a match to view market-wise PL/Comm detail.
- Click a cricket match title to open the Agent Match Dashboard.
- Click `Show Bet` from an expanded row to view a user's bet history.
- View total PL and total Comm in the footer.

### Data Source (Technical)

- **API:**
  - `POST /profitLoss` (body `{ userId, fromDate, toDate, page, sportId, limit }`) — completed-matches PL list (paginated; `meta` contains total/current_page/per_page).
  - `POST /profitLossByMatch` (body `{ sportId, userId, matchId, fromDate, toDate }`) — market-wise detail on expand.
  - The sports list comes from `dataService.getSports()`.
- **Socket:** none.

---


## Agent Match Dashboard (Settled Match Hub)

> **Menu path:** Sidebar → Completed Matches → (click cricket match title)
> **Route:** `/company/live-game-detials`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`, `matchStartDate` _(NOTE: **`pageType` is NOT passed** from here → which is why it opens in "settled match" mode)_
> **Component:** `src/app/live-game-detials/live-game-detials.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

![agent-match-dashboard](screenshots/agent-match-dashboard.png)

### Purpose

This is a **hub / launcher page** containing large buttons for all the reports and bet-slip pages of a particular match. The same component is also used in the Live Matches section, but **when arriving from completed matches the `pageType` query param is not sent**, so here all the report buttons (Client Report, Company Report, Session Earning Report) are also shown — in the Live Matches version these are hidden.

### Difference from the Live Matches version (IMPORTANT)

In `live-game-detials.component.html` the buttons are shown conditionally (the logged-in user's `useType = authService.user.usetype`):

| Button | Condition | Completed Matches (no pageType) | Live Matches (pageType = 'liveMatches') |
|---|---|---|---|
| Bet Slips | always | ✅ | ✅ |
| Session Bet Slip | always | ✅ | ✅ |
| Live Report | always | ✅ | ✅ |
| Client Report | `pageType != 'liveMatches'` | ✅ | ❌ |
| Collection Report | always | ✅ | ✅ |
| Company Report | `useType !== 0 && pageType != 'liveMatches'` | ✅ (if useType ≠ 0) | ❌ |
| Session Earning Report | `pageType != 'liveMatches'` | ✅ | ❌ |

> So when arriving from Completed Matches the **full button set** is shown (Company Report only when the logged-in user's `useType !== 0`). In the Company panel (role 11) useType is normally ≠ 0, so the Company Report button is also shown and its route is registered too.

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
- [Client Report](client-report.md) — agent-hierarchy-wise PL/commission.
- [Collection Report](collection-report.md) — collection (receiving/paying) summary.
- [Company Report](company-report.md) — company-level report (route registered in the Company panel — working page).
- [Session Earning Report](session-earning-report.md) — session earning report.

### Actions

- Navigate to any report / bet-slip page of the match (button click).

### Data Source (Technical)

- **API:** This page makes no API call itself — it only reads the match params from `ActivatedRoute.queryParams` and builds the base route (`/company/`) from `dataService.url`. Each destination page fetches its own data.
- **Socket:** none.

---


## Bet Slips

> **Menu path:** Agent Match Dashboard → Bet Slips
> **Route:** `/company/betslips-tables`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchName`
> **Component:** `src/app/betslips-tables/betslips-tables.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

![bet-slips](screenshots/bet-slips.png)

> ℹ️ **The detail is the same as the Live Matches version — see [../live-matches/bet-slips.md](../live-matches/bet-slips.md).**

### Purpose

Shows the bets of all the match markets (odds / bookmaker / toss / tied) tab-wise, calculating the runner-wise position and "my share" for each bet. Bets are fetched even on a settled match (`afterResult=yes`).

### On-screen Layout (UI)

- **Market tabs:** the name of each market (from `/matches/{matchId}/markets`).
- **PL by market** mini table (runner / position).
- **Bet slip table columns:** `serialNo`, `date`, `marketTitle`, `rate`, `amount`, `mode`, `runnerName`, `user`, dynamic `Position{n}`, `myShare`, dynamic `Share{n}`, `status`, `plusMinus`.
- **User filter** dropdown.
- **Paginator.**

### Sub-pages
No sub-pages.

### Data Source (Technical)

- **API:** `GET /matches/{matchId}/markets`, `GET /bets?...&afterResult=yes`, `POST /plByMarket`.
- **Socket:** none.

---


## Session Bet Slip

> **Menu path:** Agent Match Dashboard → Session Bet Slip
> **Route:** `/company/sessionbetslips`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/sessionbetslips/sessionbetslips.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

![session-bet-slip](screenshots/session-bet-slip.png)

> ℹ️ **The detail is the same as the Live Matches version — see [../live-matches/session-bet-slip.md](../live-matches/session-bet-slip.md).**

### Purpose

Shows the **fancy / session bets** of the match, calculating the yes/no position, my-share and settled plus/minus for each bet. Data is fetched even on a settled match (`afterResult=yes`, `type=fancy`).

### On-screen Layout (UI)

- **Fancy table columns:** `serialNo`, `betId`, `date`, `user`, `sessionTitle`, `runs`, `amount`, `mode`, `no`, `yes`, `myShare`, `noPosition`, `yesPosition`, `status`, `plusMinus`.
- **Filters:** User dropdown (`All User`), Fancy dropdown (`All Fancy`).
- **Paginator** + loader.

### Sub-pages
No sub-pages.

### Data Source (Technical)

- **API:** `GET /bets?matchId=...&type=fancy&afterResult=yes&page=...&limit=...`.
- **Socket:** none.

---


## Live Report (My Markets)

> **Menu path:** Agent Match Dashboard → Live Report
> **Route:** `/company/my-markets`
> **Query params:** `matchId`, `marketId`, `sportId`, `matchStartDate`
> **Component:** `src/app/my-markets/my-markets.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

![live-report](screenshots/live-report.png)

> ℹ️ **The detail is the same as the Live Matches version — see [../live-matches/my-markets.md](../live-matches/my-markets.md).**

### Purpose

Shows the match's market-wise live report (`my-markets`) — with runners, positions and exposure. When opened from a completed match the same component is used (live odds after settlement).

### On-screen Layout (UI)

- Market / runner wise report tables (detail in the Live Matches doc).
- Match param-based heading.

### Sub-pages
No sub-pages.

### Data Source (Technical)

- **API:** the `my-markets` component endpoints (detail: ../live-matches/my-markets.md).
- **Socket:** socket for live data (detail in the Live Matches doc).

---


## Collection Report

> **Menu path:** Agent Match Dashboard → Collection Report
> **Route:** `/company/collection-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/collection-report/collection-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

![collection-report](screenshots/collection-report.png)

> ℹ️ **The detail is the same as the Live Matches version — see [../live-matches/collection-report.md](../live-matches/collection-report.md).**

### Purpose

After a match, shows the collection summary of which client to **receive money from (Plus / Receiving)** and which to **pay (Minus / Paying)**. Internal entries such as `Own`, `Cash`, `Own Commission` are filtered out and removed.

### On-screen Layout (UI)

- **Receiving (Plus) table columns:** `clientName`, `currentBalance`.
- **Paying (Minus) table columns:** `clientName`, `currentBalance`.
- **Modals / dialogs:** none.

### Sub-pages
No sub-pages.

### Data Source (Technical)

- **API:** `POST /chipSummary` (body `{ mstrid, matchId }`) → `res.data` (`plusData` / `minusData`).
- **Socket:** none.

---


## Client Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Client Report
> **Route:** `/company/client-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/client-report/client-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

![client-report](screenshots/client-report.png)

### Purpose

For a single match, this page shows the profit/loss, commission and share report **by agent hierarchy (client, dealer, master, super master, sub admin, admin)**. A separate table is built for each level below the logged-in user (company, mstrid).

### On-screen Layout (UI)

- **Title / breadcrumb:** Match-name-based heading.
- **Tables (built by filtering on usetype):**
  - User/Client list (`usetype == 3`)
  - Dealer list (`usetype == 2`)
  - Master list (`usetype == 1`)
  - Super Master list (`usetype == 8`)
  - Sub Admin list (`usetype == 9`)
  - Admin list (`usetype == 10`)
- **Table columns (same for all tables):** `UserNm`, `MatchPlusMinus`, `SessionPlusMinus`, `TotalPlusMinus`, `MatchCommission`, `SessionCommission`, `TotalCommission`, `Net`, `AgentShare`, `FinalShare`.
- **Modals / dialogs:** none.

### Sub-pages

No sub-pages.

### Actions

- View the PL / commission / share of each agent level for the match (read-only report).

### Data Source (Technical)

- **API:** `GET /agentReport?userId={mstrid}&matchId={matchId}` → response `res.agentData` (array). The component filters it by `usetype` to build the separate lists.
- **Socket:** none.

---


## Company Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Company Report
> **Route:** `/company/company-report`
> **Query params:** `matchId` (the component also reads `matchName`)
> **Component:** `src/app/company-report/company-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

![company-report](screenshots/company-report.png)

> ✅ **This route is registered in the Company panel** — the `company-report` path is properly configured in `company-routing.module.ts` (`CompanyReportComponent`). Clicking the Agent Match Dashboard button (`*ngIf="useType !== 0 && pageType != 'liveMatches'"`) opens this page normally. (Note: the opposite of the super-duper-admin panel — there this route is not registered.)

### Purpose

For a single match, this page shows the **company-level** profit/loss, commission and share breakup (match + session combined, system PL, my share, company share).

### On-screen Layout (UI)

- **Top header row (grouped):** `blank`, `PlusMinus`, `COMMISSION`, `OTHERS`.
- **Company table columns:** `cName`, `matchPlusMinus`, `sessionPlusMinus`, `total`, `sesStake`, `matchCommission`, `sessionCommission`, `totalCommission`, `systemPlusMinus`, `share`, `myShare`, `companyShare`.
- **Modals / dialogs:** none.

### Sub-pages

No sub-pages.

### Actions

- View the company-level financial summary of the match (read-only).

### Data Source (Technical)

- **API:** `GET /companyReport?userId={mstrid}&useType={useType}&matchId={matchId}` → response `res.data`. (`userId` and `useType` come from the logged-in user's `authService.user.mstrid` / `usetype`.)
- **Socket:** none.

---


## Session Earning Report

> **Menu path:** Sidebar → Completed Matches → (match title) → Agent Match Dashboard → Session Earning Report
> **Route:** `/company/session-earning-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/session-earning-report/session-earning-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)

![session-earning-report](screenshots/session-earning-report.png)

### Purpose

For a single match, this page shows the agent-wise report of the **session (fancy) earnings** — session PL, session commission, net total, share amount and final.

> ℹ️ Note: The component has old commented code that used `GET /sessionEarningReport` and built separate tables by usetype 11/10/9/8/1/2/3. The **active code** now fetches data from `GET /agentReport` (the same endpoint as Client Report), currently using the raw `data` array.

### On-screen Layout (UI)

- **Table columns (`column1`):** `UserNm`, `Session`, `CommSession`, `netTotal`, `shrAmt`, `final`.
- **Modals / dialogs:** none.

### Sub-pages

No sub-pages.

### Actions

- View the agent-wise breakup of the match's session/fancy earnings (read-only).

### Data Source (Technical)

- **API:** `GET /agentReport?userId={mstrid}&matchId={matchId}` → response `res.agentData` (`this.data`).
  - _(Legacy/commented: `GET /sessionEarningReport` → `res.sessionEarningData`.)_
- **Socket:** none.

---


## Ledger (Match-wise)

> **Menu path:** Sidebar → Completed Matches → (row) → Ledger button
> **Route:** `/company/ledger-match-wise`
> **Query params:** `name`, `matchId`, `userid`, `parentId`
> **Component:** `src/app/ledger-match-wise/ledger-match-wise.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

![ledger-match-wise](screenshots/ledger-match-wise.png)

> ✅ **This route is registered in the Company panel** — the `ledger-match-wise` path is properly configured in `company-routing.module.ts` (`LedgerMatchWiseComponent`), so it is a working page. (Note: the "Ledger" button on the completed-matches list page that navigated to this route is **commented out** in the HTML, so it cannot currently be opened by clicking the button directly from the list until it is uncommented — but the route itself works and can be opened via other flows / a direct link. The `ledger-match-summary` and `ledger-tables` routes are also registered.)

### Purpose

This page shows a user's match-wise (or overall, if matchId is blank) **chip/ledger history** — credit/debit entries with narration.

### On-screen Layout (UI)

- **Title:** username (from the `name` param).
- **Table columns (`columns`):** `Date`, `narration`, `Credit`, `Debit`.
- **Paginator:** MatPaginator (client-side `MatTableDataSource`).
- **Modals / dialogs:** none.

### Sub-pages

No sub-pages.

### Actions

- View and paginate the user's ledger entries (credit/debit) (read-only).

### Data Source (Technical)

- **API:** `POST /chipHistoryID` (body `{ userId: params.userid, parentId: params.parentId, matchId }` — sends `null` if `matchId` is blank) → `res.data`.
- **Socket:** none.

---


## Bet History (Show Bet)

> **Menu path:** Sidebar → Completed Matches → (expand match row) → Show Bet button
> **Route:** `/company/bet-history`
> **Query params:** `matchId`, `marketId`, `userId`, `username`, `fancyId`
> **Component:** `src/app/bet-history/bet-history.component.ts` (+ `.html`)
> **Parent page:** [Completed Matches](completed-matches.md)

![bet-history](screenshots/bet-history.png)

### Purpose

This page shows the bet history of a user (and the agents below them) on a market/fancy, along with the chip distribution of the **Plus Account** and **Minus Account**. In the Plus/Minus tables you can click an agent to drill down to the agents below them.

### On-screen Layout (UI)

- **Title / breadcrumb:** `data[0].Description` (market/match description) — breadcrumb: Dashboard → {Description}.
- **Plus Account table** (green toolbar): columns `User`, `Account` (mstrname), `Chip` (PUsum) + footer Total. If the viewing user is not themselves, an `undo`/reset button.
- **Minus Account table:** columns `User`, `Account` (mstrname), `Chip` (Musum) + footer Total.
- **Bet list table** (`column3`): `#`, `UserName`, `selectionName`, `Odds`, `Stack`, `PL`, `Date`, `ip`, `STATUS`.
- **Drill-down:** click an agent name in the Plus/Minus table → that agent's plus/minus (`initPlusMinus`).
- **Modals / dialogs:** none.

### Sub-pages

No sub-pages (drill-down happens inline).

### Actions

- View all bets of the market/fancy (odds, stack, PL, status, IP).
- Click an agent in the Plus/Minus account to view the distribution below them.
- Use Reset (`undo`) to return to the original user.

### Data Source (Technical)

- **API:**
  - `POST /showBet` (body `{ matchId, MarketId, fancyId, userId }`) → `value.data` (bet list).
  - `POST /adjustAc` (body `{ userId, matchId, MarketId, fancyId }`) → `data.plusData` / `data.minusData`.
- **Socket:** none.

---


## Aura GGR

> **Menu path:** Sidebar → Aura GGR
> **Route:** `/company/royal-casino`
> **Component:** `src/app/royal-casino/royal-casino.component.ts` (+ `.html`)

![](screenshots/aura-ggr.png)

### Purpose

This page shows the Royal Casino (Aura) GGR / profit-loss summary report for a selected date range. The overall total (GGR) is shown at the top, with a date-wise summary table below it. When the page opens (in the constructor), the report loads once without any filter applied.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches" — breadcrumb: Dashboard → Royal Casino Report.
- **Filters / inputs:**
  - `From Date:` — date input (`type=date`, `fromDate`).
  - `To Date:` — date input (`type=date`, `toDate`).
- **Buttons:**
  - `Search` — fetches the report for the selected date range (`royalCasinoReport()`).
- **Summary card:** A card titled "Summary" showing `Total` followed by the overall total value (`total`).
- **Report table columns (`column1`):** `Title` (`Label`), `Date` (`SummaryDate`), `Declared` (always hardcoded "Yes"), `Profit/Loss` (`NetChips`). A footer row is also rendered (with blank cells).
- **Modals / dialogs:** None.

### Sub-pages

None.

### Actions

- Select a From/To date and run the Royal Casino report via `Search`.
- View the overall total (GGR).
- View the date-wise profit/loss (NetChips) in the summary table.

### Data Source (Technical)

- **API:** `GET /royalCasinoReport` (params: `fromDate`, `toDate` — sent only when a value is set). The response arrives in `res.royalCasinoReportData`.
  - The `total` (GGR) is derived from the row where `Label === 'Overall Total'`.
  - The remaining rows (other than Overall Total) are shown in the table.
- **Socket:** None.

---


## Block Market

> **Menu path:** Sidebar → Block Market
> **Route:** `/company/sports`
> **Component:** `src/app/sports/sports.component.ts` (+ `.html`)

![](screenshots/block-market.png)

### Purpose

This page shows the full list of sports and lets you turn each sport on/off (block/unblock). It is a simple table where the toggle instantly changes a sport's status and refreshes the list.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Sports Block" — breadcrumb: Dashboard → Sports Block.
- **Section card:** A card titled "Block Sports" containing the sports table.
- **Filters / inputs:** No search/filter input.
- **Buttons / controls:**
  - Per-row slide-toggle (Action column) — turns that sport on/off. `[checked]` is set based on `d.active == 1`.
- **Table columns (`columns`):**
  - `So.` — serial number (`index + 1`).
  - `Name` — sport name (`d.name`).
  - `Status` — "{name} is ON/Off" (ON if `d.active == 1`, otherwise Off).
  - `Action` — slide-toggle.
- **Loader:** A `mat-spinner` is shown while the list is loading (`isLoading`).
- **Modals / dialogs:** None.

### Sub-pages

None.

### Actions

- View the list of sports and their current status (ON/Off).
- Block/unblock a sport via its Action toggle. The update happens as soon as the toggle is pressed, and the list reloads.

### Data Source (Technical)

- **API:**
  - The sports list is loaded via `dataService.getSports()` (promise).
  - `PUT /sports/:id` — body `{ active: sport.active ? 0 : 1 }` — toggles the sport's status. After success, the list refreshes via `init()`.
- **Socket:** None.

---


## User

> **Menu path:** Sidebar → Manage Clients → User
> **Route:** `/company/users?userTypeId=3`
> **Query params:** `userTypeId=3` (end-users / clients filter), optional `userId`, `category` (when `category=CLIENT`, the client-only table block is rendered)
> **Component:** `src/app/users/users.component.ts` (+ `.html`)

![](screenshots/user.png)

### Purpose

This is the Users (Manage Clients) page filtered to end-users (clients, `userTypeId=3` / `usetype 3`). The Company role (`usetype 11`) views the list of clients in its downline here — for each client it shows PL, exposure, balance, and share, plus actions available in modals such as deposit/withdraw, account/commission/partnership edit, sport block, sport limit, and poker block. When the query params (`userId`, `userTypeId`, `category`) change, the data reloads.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Manage Clients" — breadcrumb: Dashboard → Manage Clients.
- **Section card:** "All Users". (The client block is shown when `category === 'CLIENT'`; otherwise the role-wise full table block is rendered.)
- **Filters / inputs:**
  - Status dropdown (`userGroup`) — All (`2`) / Active (`1`) / In Active (`0`). Page-level default is `1`.
  - **Search** input (`type=search`, `search`) — debounced (`DelayInputDirective`); calls `init()` on every change.
- **Client table columns (`userColumns`):**
  - `User Name` — `mstruserid` + `(mstrname)`. **Row link** → `user-dashboard` page (`[routerLink]="['/', urlType, 'user-dashboard']"`, queryParams `userId`, `userTypeId`, `parentId`). _(See [../manage/user-dashboard.md](../manage/user-dashboard.md).)_
  - `PL` — `P_L`
  - `New PL` — `pl`
  - `Exposure` — `settlementAmount`
  - `Balance` — `balance`
  - `Agent Type` — `agent_type` ("Client" for a client)
  - `My Share` — "My Share" button (`myShare(d)`) → My Share modal
  - `Agent share` — "Agent share" button (`maxShare(d)`) → Max Share modal
- **Locked rows:** Rows where `mstrlock === 0` get the `locked-row` class.
- **Modals / dialogs (ng-template, defined in the page):** A/C Chips In/Out (deposit/withdraw), Account of {user} (Profile / Commission / Partnership tabs + change password), Sport Block, Sport Limit (Formly repeat: Min/Max Stake, Max Profit, Bet Delay, Market Volume, Max Market Exposure, Lay Diff), Poker Block, My Share, Agent (Max) Share, User Count, Expo (client bets).

### Sub-pages

- **User Dashboard** — opens when clicking a client's row (User Name link) (`/company/user-dashboard`). This is a separate page, not a modal. See [../manage/user-dashboard.md](../manage/user-dashboard.md).
- All other tasks (deposit/withdraw, edit, sport/poker block, limits, share) happen in this page's modals/dialogs — there is no route-based sub-page.

### Actions

- View the client list; search / sort / filter by status (All/Active/In Active).
- Open a client's **User Dashboard** (row link).
- Deposit / Withdraw chips (A/C Chips In/Out modal, `saveCoins`).
- Edit account / commission / partnership / profile; change password (Account modal).
- View My Share and Agent share.
- Set sport block, sport limit, poker block (modals).
- Lock/unlock a user (`lockUnlockUser`) and lock/unlock betting (`lockUnlockBetting`) with a confirm prompt; clear profit/loss (`clearChip`).

### Data Source (Technical)

- **API:**
  - `POST /masters` (list — body `userid`, `type` = userTypeId (3) or `category`, `page`; params `search`/`sort`/`order`/`limit`). The client table is filtered from `data.data` (`usetype === 3`).
  - `GET /users/{id}` (parent details, decides title/role).
  - `POST /saveCoins` (deposit/withdraw, `CrDr`), `POST /updateAccount`, `POST /updateComm`, `POST /getPartnershipData`.
  - `POST /lockUsers`, `POST /lockBetting`, `POST /clearChip`, `POST /changeUserPassword`.
  - `GET/POST /blockedSports`, `GET/POST /sportLimits`, `GET/POST /blockedPoker`, `GET /accountStatement`, `POST /getUserCount`.
- **Note:** The client table data (`clientTableData`) is built from users where `usetype === 3`. `urlType` = `getUrlType(user.usetype)` (`company` for the company role).
- **Socket:** None (all REST based).

---


## Blocked Clients

> **Menu path:** Sidebar → Manage Clients → Blocked Clients
> **Route:** `/company/blocked-user`
> **Component:** `src/app/blocked-user/blocked-user.component.ts` (+ `.html`)

![](screenshots/blocked-clients.png)

### Purpose

This page shows the list of blocked users who have been locked/bet-locked. From here you can view each blocked user's commission details, go to the edit page to block/unblock them (agent lock / bet lock), and change their password.

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Blocked Clients. Section title "Blocked Users".
- **Buttons / tools:** CSV button, PDF button (export — UI only, no action wired yet), and a **Search...** input (UI present, not yet wired via `ngModel` — in code, search runs through `blockedUserSearch`).
- **Table columns (`blockedUserColumns`):**
  - `ID` — `mstruserid`
  - `User Name` — `(mstrname)` (with brackets)
  - `Match Comm.` — `Commission`
  - `Ssn Comm.` — `SessionComm`
  - `Share` — (empty cell)
  - `Actions` — **Edit** link (`[routerLink]="['../edit-blocked-user', d.mstruserid]"`) + **Change Password** button (`changePassword(d)`)
- **Modals / dialogs (defined in the parent page, ng-template):**
  - **Edit SC** (`#editBlockModal`) — fields: User Id (disabled), Name, Current Limit (disabled), My Match Share (disabled), Match Share (disabled), Match Commission (disabled), Session Commission (disabled), Agent Blocked (toggle), Bets Blocked (toggle); Cancel + Save Change buttons. _(Note: in the list, Edit now navigates to the child page via routerLink; the old `openEditBlock()` dialog code still exists in the component but the Edit link does not use it.)_
  - **Change Password SC** (`#changePasswordModal`) — New Password, Confirm Password fields (with `matchPassword` validator on confirm) + Change button.

### Sub-pages

- [Edit Blocked Client](edit-blocked-client.md) — opens when **Edit** is pressed in a blocked user's row (route `/company/edit-blocked-user/:id`).

### Actions

- View the blocked users list (search is supported in code via `blockedUserSearch`).
- Edit a user — go to the child page and set the Agent Blocked / Bets Blocked toggles.
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
> **Route:** `/company/edit-blocked-user/:id`
> **Component:** `src/app/blocked-user/edit-blocked-user/edit-blocked-user.component.ts` (+ `.html`)
> **Parent page:** [Blocked Clients](blocked-clients.md)

![](screenshots/edit-blocked-client.png)

### Purpose

This page is for editing the details of a single blocked user. From here, the user is turned on/off via the **Agent Blocked** (agent lock) and **Bets Blocked** (bet lock) toggles. The remaining commission/share fields are view-only (disabled). The page opens via the **Edit** button on the Blocked Clients list.

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
  - **Cancel** — back to the Blocked Clients list (`[routerLink]="['/', urlType, 'blocked-user']"`, `urlType = company` for the company role).
  - **Save Changes** — `onSaveChangeClicked()`.
- **Modals / dialogs:** None in page mode. (The component is dual-mode — see below.)

### Dual mode (technical note)

The component can run in two ways:
- **Page mode** (default): the user is fetched from the route param `:id`, and after Save it navigates to the list.
- **Dialog mode**: if data arrives via `MAT_DIALOG_DATA`, the form is populated from it, and Save/Cancel call `dialogRef.close()`. (Here, the blocked-user page uses page mode for editing.)

### Sub-pages

None.

### Actions

- View the user's block details (disabled commission/share fields).
- Edit the Name.
- Set agent lock/unlock via the **Agent Blocked** toggle.
- Set bet lock/unlock via the **Bets Blocked** toggle.
- Save Changes to update, or Cancel to return to the list.

### Data Source (Technical)

- **API:**
  - `GET /getBlockUsers` (param `search` = id) — in page mode, fetches the user data; the form is populated by matching `mstruserid === id || mstrid === id` from the response `users`.
  - `POST /setBlockedUsers` (`name`, `userId`, `mstrLock` = agentBlocked ? 0 : 1, `betLock` = betsBlocked ? 0 : 1) — save.
- `urlType` is derived from `dataService.getUrlType(authService.user.usetype)` (for Cancel/navigation; company role = `company`).
- **Socket:** None.

---


## Commission & Limits

> **Menu path:** Sidebar → Manage Clients → Commission & Limits
> **Route:** `/company/commission-limit`
> **Query params:** `userId=<self mstrid>` (the logged-in company's own mstrid), `userTypeId=11` (company role view). Changing `userId` allows drilling down into a child's downline.
> **Component:** `src/app/commission-limit/commission-limit.component.ts` (+ `.html`)

![](screenshots/commission-limits.png)

### Purpose

This page shows downline users' commission (Bookmaker & Session) and balances in a role-wise table, plus an overall Summary (My Balance, Downline Balance, Exposure). From here you manage deposit/withdraw, account/commission/partnership edit, sport block, sport limit, poker block, downline balance, and a client's exposure (Expo / bets list). For the company role, the route passes `userId` (own mstrid) and `userTypeId=11`; when `userId` changes, the data reloads (drill-down into a child's downline).

### On-screen Layout (UI)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Commission & Limits.
- **Filters / inputs (in each table block):**
  - Status dropdown — `userGroup`: All (`2`) / Active (`0`) / In Active (`1`). (Default `2`.)
  - **Search** input (`type=search`, `search`) — debounced (`DelayInputDirective`).
- **Role-wise table blocks (data is filtered by `userTypeId`):** Super Admin (`usetype 10`), Sub Admin (`9`), Super Master (`8`), Master (`1`), Dealer (`2`), Client/User (`3`). For the company role, the relevant blocks of its downline are shown.
- **Table columns (`superAdminColumns` etc.):**
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

There is no separate route-based sub-page. The User Name link goes to `user-dashboard` (a separate page). All other tasks happen in this page's modals/dialogs. _(Note: this page has no link to "Agent Offers" (`agent-offers`) or `offers-settings` — no such route was found in the component/template.)_

### Actions

- View downline users' commission and balance role-wise; search / sort / filter by status.
- Deposit / Withdraw chips (A/C Chips In/Out).
- Edit account / commission / partnership / profile; change password.
- Set sport block, sport limit, poker block.
- Lock/unlock a user (`lockUsers`) and lock/unlock betting (`lockBetting`) — viewAccount modal toggles, with a confirm prompt.
- View downline balance (Down Bal), view a client's exposure/bets (Expo).
- Clear profit/loss (`clearChip`), refresh the summary exposure.

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
> **Route:** `/company/change-password`
> **Component:** `src/app/change-password/change-password.component.ts` (+ `.html`)

### Screenshot

![manage-password](screenshots/manage-password.png)

### Purpose

This page lets the logged-in **company (role 11)** user change their own login password. If the user is a **helper (usetype 55)**, they must first verify a **Security Question**; only after that does the Change Password form appear. For all other users (including company), the Change Password form is shown directly.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Change Password" when `isVerified` is true, otherwise "Security Question". Breadcrumb: Dashboard → (Change Password / Security Question).
- **Security Question section** (when `isVerified == false`, i.e. helper usetype 55):
  - Question text (`user.question`)
  - **Enter Answer** input (`answer`)
  - **Submit** button (`verifyAnswer`, disabled when the answer is empty)
- **Change Password section** (when `isVerified == true`):
  - **OLD PASSWORD** — `oldpass` (type=password)
  - **NEW PASSWORD** — `newpass` (type=password)
  - **CONFIRM PASSWORD** — `renewpass` (type=password, validated via `checkPass()` on input)
  - Error message line (red, centered) — `errorMsg` (shown when a field is missing or new ≠ confirm)
  - **Save Changes** button — enabled only when `enableSubmit == true` (i.e. new == confirm).
- **Modals / dialogs:** none.
- **Table columns:** no table.

### Sub-pages

None.

### Actions

- (Helper) Verify by answering the security question (`verifyAnswer`).
- Fill Old / New / Confirm password; Save is enabled only when new == confirm.
- **Save Changes** — changes the password. On success:
  - If `authService.user.password_changed == 0`, then `DataService.logout()` (force re-login).
  - Otherwise redirect to the role-wise dashboard based on the user's `usetype`. A company user has `usetype == 11`, so they are redirected to `/company`. (Others: 0→super-duper-admin, 10→super-admin, 9→sub-admin, 8→super-master, 1→master, 2→dealer, 55→helper.)

### Data Source (Technical)

- **API:** `POST /verifyAnswer` (verify security question), `POST /changePassword` (body: `old_password`, `newpassword`, `Renewpassword`).
- User info comes from `AuthService.user`; on success, role-wise router navigation or `DataService.logout()`.
- **Socket:** none.

---


## Search Logs User

> **Menu path:** Sidebar → Search Logs User
> **Route:** `/company/search-logs-user`
> **Component:** `src/app/search-logs-user/search-logs-user.component.ts` (+ `.html`)

### Screenshot

![search-logs-user](screenshots/search-logs-user.png)

### Purpose

On this page you can enter a **User ID** and view its **parent hierarchy** (the full chain from Super Duper Admin down to the User). If logs exist for that user, the "User Logs Statement" button is enabled, which opens a detail page with the user's full betting/balance/liability logs.

### On-screen Layout (UI)

- **Title / breadcrumb:** heading "DASHBOARD", breadcrumb: Dashboard → Search User.
- **Filters / inputs:**
  - **Enter User Id** — text input (`selectedUserId`).
  - "User doesn't exist" error text (red) — shown when `inputbox_lable == false` (i.e. no logs found).
- **Buttons:**
  - **Submit** (`getUserDetails`) — checks the user's logs and fetches the parents.
  - **User Logs Statement** (shown only when `showLogsBtn == true`) — navigates to the child detail page (`../logs-user-details/<mstruserid>`).
- **Table columns (Search User Details):** two-column table — **Role** (`roleLabels`: Super duper Admin, Company, AD (super-admin), SC (sub-admin), SST (super-master), SS (master), SA (dealer), Sp (user)) and, next to it, the parent for that role: `mstruserid (mstrname) partner_cricket%`. Shows "-" when there is no parent.
- **Modals / dialogs:** none.

> Note: the constructor runs `init()`, which fetches the masters list via `POST /masters` (under the current logged-in company user's `mstrid`; for data preparation only — this list is not directly rendered in the current UI).

### Sub-pages

- [User Logs Statement (Log User Details)](log-user-details.md) — opens when the "User Logs Statement" button is clicked (route `logs-user-details/:id`).

### Actions

- Enter a User ID and press **Submit** — the parent hierarchy and logs are checked.
- When logs are found, open the **User Logs Statement** page.

### Data Source (Technical)

- **API:**
  - `POST /masters` (body: `userid` = company user's `mstrid`, `page`) — masters/users list (constructor `init()`).
  - `GET /getLogsByUsername` (params: `page`, `username`) — logs for the username; the button is enabled when total > 0.
  - `POST /getParents` (body: `userId`) — parent hierarchy (`viewParent`).
- **Socket:** none.

---


## Log User Details (User Logs Statement)

> **Menu path:** Sidebar → Search Logs User → (User Logs Statement button)
> **Route:** `/company/logs-user-details/:id`
> **Component:** `src/app/search-logs-user/logs-user-details/logs-user-details.component.ts` (+ `.html`)
> **Parent page:** [Search Logs User](search-logs-user.md)

### Screenshot

![log-user-details](screenshots/log-user-details.png)

### Purpose

This page shows the full **logs statement** for a selected user — for each bet/transaction it shows the match, market, selection, side, price, log type, type, date, and the before/after values of balance and liability. The User ID comes from the route's `:id` param. This data can also be downloaded as a PDF on the page.

### On-screen Layout (UI)

- **Title / breadcrumb:** heading "DASHBOARD", breadcrumb: Dashboard → Search User.
- **Section card:** "Block Sports" (the heading text is exactly this in the code).
- **Buttons:** **Download PDF** (`downloadPDF`) — builds a landscape PDF using jsPDF + autoTable (filename `user_log_statement<timestamp>.pdf`).
- **Table columns:** #, Match Name, Market Name, Selection Name, Side (`betType`), Price (`volume`), Log Type, Type, Date, Balance, Before Balance, After Balance, Liability, Before Liability, After Liability.
- **Pagination:** mat-paginator — page size options 10/25/50/100, default 50.
- **Modals / dialogs:** none.

> Note: the PDF table does not include the Side/Price columns (only 12 columns: Match/Market/Selection Name, Log Type, Type, Date, Balance, Before/After Balance, Liability, Before/After Liability).

### Sub-pages

None.

### Actions

- View the logs statement table (read-only).
- Change page and page size via pagination (`getLogs`).
- Save the full statement as a PDF via **Download PDF**.

### Data Source (Technical)

- **API:** `GET /getLogsByUsername` (params: `page`, `limit`, `username` — uppercased from the route's `:id`). Response: `data`, `meta.total`, `meta.perPage`.
- **Socket:** none.

---


## Collection Report

> **Menu path:** Sidebar → Manage Ledgers → Collection Report
> **Route:** `/company/collection-report-all`
> **Component:** `src/app/collection-report-all/collection-report-all.component.ts` (+ `.html`)

### Screenshot

![collection-report](screenshots/collection-report.png)

### Purpose

This page shows users' balance position in **three groups** — Minus (to receive), Plus (to pay) and Zero (cleared). Each group is a table with the user's name and amount, and clicking a user navigates to their dashboard.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Collection Report" heading, breadcrumb: Dashboard → Collection Report.
- **Three sections (ibox cards), each with one table:**
  - **Minus Users (LENA HAI / TO RECEIVE)** — `balanceType: 'minus'`
  - **Plus Users (DENA HAI / TO PAY)** — `balanceType: 'plus'`
  - **Zero Users (CLEAR HAI / CLEARED)** — `balanceType: 'zero'`
- **Table columns (each section):**
  - **Name** — `username (name)`, clickable link.
  - **Amount** — 2 decimals (`number:'1.2-2'`).
  - **Total** amount in the footer (`dataService.getTotal`).
- **No data:** row shows "No data".
- No filter/search input or button (data loads on page load).
- **Modals / dialogs:** none.

### Sub-pages

There is no separate-route sub-page doc, but **clicking a Name link** navigates to that user's **User Dashboard**:
`[url]/user-dashboard` with query params — `userId`, `userTypeId` (= `usetype`), `directRouteToCollectionReport: true`, `parentId`. Here `url` is the company panel base (`dataService.url`, i.e. `/company`). This is for drilling down into that user's ledger.

### Actions

- View the users and their amounts in all three groups (Minus/Plus/Zero).
- Click a user name to go to their User Dashboard (collection report context).
- View the Total amount for each section.

### Data Source (Technical)

- **API:** `GET /collectionReport` — `minusUsers` / `plusUsers` / `zeroUsers` data. The response either returns these keys directly, or filters by the `balanceType` field within the `_users_balance` (or `data`) array (`getSectionData`).
- **Socket:** none.

---


## My Statement (Account Statement)

> **Menu path:** Sidebar → Manage Ledgers → My Stmt
> **Route:** `/company/report`
> **Query params:** `id=3`, `accTypeId=4` (Credit Limit account type pre-selected)
> **Component:** `src/app/report/report.component.ts` (+ `.html`)

### Screenshot

![my-statement](screenshots/my-statement.png)

### Single shared component

`report/report.component` is a single shared component that shows different reports based on the URL's `id` query param (`selectedBetType = id`). For **My Stmt**, **`id=3`** (Account Statement) is used, and this menu also passes `accTypeId=4` (Credit Limit), which is set into `accountType` in the component. Other id values: **1=Bet History, 2=Profit & Loss, 4=Login History, 5=Deleted Bet History, 6=Password History.**

### Purpose

This page shows the **account statement** (ledger/credit-limit transactions) of the selected user (default "self" — i.e. the logged-in company user) for a date range — each entry shows date, narration, credit, debit and balance.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (client-side table filter) + Filter icon button (collapse/expand the filter panel).
- **Report type dropdown (heading):** disabled mat-select showing "Account Statements List".
- **Filter panel fields:**
  - **Select User** — searchable dropdown (`getChild` API, default "self").
  - **Type** — dropdown to change the report type.
  - **Transaction Type** — All / Debit (DR) / Credit (CR). _(only for id=3)_
  - **Account Type** — All / Ledger (1) / Commission (2) / Settlement (3) / Credit Limit (4). _(only for id=3; from My Stmt the default is Credit Limit = `accTypeId=4`)_
  - **From Date** (default 10 days ago), **To Date** (default today).
- **Buttons:** **Load** — fetch data with the filters.
- **Table columns (id=3):** #, Date, User (`mstrUserId`), Description (Narration — deposit=green, withdraw=red; "loan" → "Open Account"), Cr (Credit, green), Dbt (Debit, red), Balance. Footer shows total Credit and total Debit.
- **Loading:** spinner; **Pagination:** mat-paginator (10/25/50/100); **No data:** "There is no data available."
- **Modals / dialogs:** none.

### Sub-pages

No separate sub-page (in the Account Statement variant no row navigation is active).

### Actions

- Set User, Type, Transaction Type, Account Type, From/To date and fetch data via **Load**.
- Filter the table via the search box.
- Change page/page-size via pagination.

### Data Source (Technical)

- **API:** `GET /accountStatement` (params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type`, `type` (=accountType), `limit`). Response: `data`, `meta`, `openingBalance`.
- **Select User:** `GET /getChild` (search-based child list).
- **Socket:** none.

---


## Profit & Loss

> **Menu path:** Sidebar → Manage Ledgers → Profit & Loss
> **Route:** `/company/report`
> **Query params:** `id=2`
> **Component:** `src/app/report/report.component.ts` (+ `.html`)

### Screenshot

![profit-loss](screenshots/profit-loss.png)

### Single shared component

`report/report.component` is a single shared component that shows different reports based on the URL's `id` query param (`selectedBetType = id`). For **Profit & Loss**, **`id=2`** is used. Other id values: **1=Bet History, 3=Account Statement (My Stmt), 4=Login History, 5=Deleted Bet History, 6=Password History.**

### Purpose

This page shows the selected user's (default "self" — the logged-in company user) **match-wise Profit & Loss** for a date range. There are sport-wise tabs at the top, and each match row can be expanded to see its **market-wise breakup**.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (client-side filter) + Filter icon button (collapse/expand the filter panel).
- **Report type dropdown (heading):** disabled mat-select showing "Profit & Loss List".
- **Filter panel fields:** Select User (`getChild`, default "self"), Type dropdown, From Date (default 10 days ago), To Date (default today).
- **Buttons:** **Load** — fetch data with the filters.
- **Sport tabs:** "All" + each sport (`dataService.getSports()`). On tab change, `currentSportId` is set and the P&L reloads.
- **Table columns (id=2):** DATE/TIME (`settle_date`), Match Id, Match Title (`EventName`), PL (`PnL`, color coded), Comm (color coded), and **Action** (expand +/-). Footer shows total PL and total Comm.
- **Row expand (inner table):** Market Name, PL, Comm, CreatedOn, and a **Show Bet** button — redirects to the bet-history page (query: matchId, marketId, userId, username, fancyId).
- **Loading:** spinner; **Pagination:** mat-paginator (10/25/50/100); **No data:** "There is no data available."
- **Modals / dialogs:** none.

### Sub-pages

- **Bet History** — opens via the "Show Bet" button in the inner table (`[url]bet-history`, with query params; here `url` = `/company`). It shows the bet list for that match/market.

### Actions

- Set User and From/To date and fetch data via **Load**.
- Change the sport tab (All / specific sport).
- Expand a match row (+) to see the market-wise PL/Comm breakup.
- Go to that market's bet history via **Show Bet**.
- Filter via the search box, change page/page-size via pagination.

### Data Source (Technical)

- **API:**
  - `POST /profitLoss` (body: `userId`, `fromDate`, `toDate`, `page`, `sportId`, `limit`) — match-wise P&L list.
  - `POST /profitLossByMatch` (body: `sportId`, `userId`, `matchId`, `fromDate`, `toDate`) — market-wise inner data on row expand.
  - `GET /getChild` — searchable child list for Select User.
- **Sports list:** `dataService.getSports()` (for the tabs).
- **Socket:** none.

---


## Company Len Den

> **Menu path:** Sidebar → Manage Ledgers → Company Len Den
> **Route:** `/company/company-lenden`
> **Query params:** `name` (parent/company name, shown in the heading), `filterType` (merged into the URL from the Transaction-type select)
> **Component:** `src/app/company-lenden/company-lenden.component.ts` (+ `.html`)

### Screenshot

![company-lenden](screenshots/company-lenden.png)

> **Note:** This page is a **new page for the company panel (role 11)** — it has no base in the super-duper-admin docs. This doc was written directly from the source code.

### Purpose

This page shows the company user's **transactions (chip / ledger statement) with their parent** — i.e. the list of transactions between the company and its parent (the level above it). Each entry shows date, narration/particular, credit, debit and the running balance. The dropdown at the top changes the transaction view type (Transaction-wise, Match-wise, Settlement).

### On-screen Layout (UI)

- **Title / breadcrumb:** "Company Len Den" heading, breadcrumb: Dashboard → Company Len Den.
- **Section card heading:** "List" + a **type dropdown** alongside it.
- **Filter (dropdown — `selectedType`):**
  - **Transaction wise** (`ALL`) — default.
  - **Match wise** (`Single`).
  - **Settlement** (`Settlement`).
  - On type change, `onTypeChange()` runs: columns are updated and `filterType` is merged into the URL query param.
- **Table columns (dynamic, depend on `selectedType`):**
  - **Transaction wise (ALL):** Date, Particular (`narration`), Credit, Debit, **Balance**.
  - **Match wise / Settlement:** Date, Particular (`narration`), Credit, Debit (here the **Balance column is removed**).
  - _(The HTML also defines a column template for `Selection` (`SelectionName`), but it only renders when it is in the `columns` array — with the current logic it does not appear in the columns list for any type.)_
  - The Date field comes from `EDate` (`date: 'medium'` format); the others (`Credit` / `Debit` / `Balance`) come directly from their fields.
- **Pagination:** mat-paginator — page size options 10/25/50/100, default 50.
- **No data:** "There is no data available."
- **Modals / dialogs:** none.

### Sub-pages

None.

### Actions

- View the len-den statement table (read-only).
- Change the view via the **Type dropdown** (Transaction wise / Match wise / Settlement) — columns + URL `filterType` are updated and data is fetched again.
- Change page and page size via pagination (`fetchData`).

### Data Source (Technical)

- **API:** `POST /chipHistoryParentID`
  - **Body:** `userId` (= the logged-in company user's `mstrid`), `parentId` (= `authService.user.parentId`), `filterType` (= `selectedType`: `ALL` / `Single` / `Settlement`).
  - **Query params:** `page`, `limit`.
  - **Response:** `data` (rows), `meta.total`, `meta.perPage`.
- Data loads as soon as the page opens, triggered in the `queryParams` subscription (the `name` param sets `username`, then `fetchData()` runs).
- **Socket:** none.

---


## My Statement / Account Statement (Report id=3)

> **Menu path:** Sidebar → All Reports → My Stmt (Account Statements)
> **Route:** `/company/report?id=3`
> **Query params:** `id=3` (required), `userTypeId` _(optional)_, `accTypeId` _(optional, pre-selects the Account Type)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same shared `report` component with `id=3` (Account Statement / My Stmt). Inside the component `selectedBetType = '3'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified against current source.)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![my-statement](screenshots/my-statement.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Shows the selected user's account ledger / statement — date-wise credit/debit entries with narration and running balance. The Transaction Type and Account Type filters narrow down the entries. This is the `id=3` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button (collapse/expand the filter panel).
- **Report type label:** disabled dropdown "Account Statements List".
- **Filters / inputs (extra filters for id=3):**
  - **Select User** — searchable dropdown (`getChild` API; defaults to "self").
  - **Type** — report type dropdown (Account Statements selected here).
  - **Transaction Type** — All / Debit (DR) / Credit (CR). _(Shown only for id=3.)_
  - **Account Type** — All / Ledger (1) / Commission (2) / Settlement (3) / Credit Limit (4). _(Only for id=3; can be pre-selected via the `accTypeId` query param.)_
  - **From Date** (defaults to 10 days before today), **To Date** (defaults to today), **Load** button.
- **Table columns:** #, Date (Sdate), User (mstrUserId), Description (Narration — "deposit"=green, "withdraw"=red, others dark; the word "loan" is displayed replaced with "Open Account"), Cr (Credit, green), Dbt (Debit, red), Balance.
- **Footer:** "Total" row shows Total Credit (green) and Total Debit (red).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

### Sub-pages

None.

### Actions

- Set User, From/To date, Transaction Type and Account Type, then click "Load".
- Filter entries via the search box (client-side).
- Change page / page size via pagination.
- Switch to another report via the Type dropdown.

### Data Source (Technical)

- **API:** `GET /accountStatement` — query params: `user_id`, `from_date`, `to_date`, `page`, `transaction_type` (all/DR/CR), `type` (= accountType all/1/2/3/4), `limit`. The response also includes `openingBalance`.
- `GET /getChild` — Select User searchable list (debounced search).
- **Socket:** None.

---


## Profit & Loss (Report id=2)

> **Menu path:** Sidebar → All Reports → Profit & Loss
> **Route:** `/company/report?id=2`
> **Query params:** `id=2` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same shared `report` component with `id=2` (Profit & Loss). Inside the component `selectedBetType = '2'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified against current source.)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![profit-loss](screenshots/profit-loss.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Shows the selected user's match-wise Profit & Loss and Commission summary. There are tabs per sport, and each match row can be expanded to view its market-wise breakup. This is the `id=2` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Profit & Loss List".
- **Filters / inputs:** Select User, Type dropdown, From Date, To Date, Load button. (Transaction Type / Account Type / Match Status are not shown here.)
- **Sport tabs:** a nav bar above the table — "All" + a tab for each sport. Changing the tab sets `currentSportId` and reloads the data.
- **Table columns:** DATE/TIME (settle_date), Match Id, Match Title (EventName), PL (PnL, color coded), Comm (color coded), Action (expand +/- button).
- **Expand (inner table):** expanding a row shows a market-wise table — Market Name, PL, Comm, CreatedOn (MstDate), Action ("Show Bet" button that redirects to the `/company/bet-history` page with matchId/marketId/userId/username/fancyId query params).
- **Footer:** Total PL and Total Comm (color coded).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

### Sub-pages

- [Bet History](bet-history.md) — opened via the "Show Bet" button in the inner table (to view the specific bets for that match/market; route `/company/bet-history`).

### Actions

- Set User / date range, then click "Load".
- Change the sport tab.
- Expand a match row (+) to view market-wise PL/Comm.
- Use "Show Bet" to view the bet history for that market.
- Use search and pagination.

### Data Source (Technical)

- **API:** `POST /profitLoss` — body: `userId`, `fromDate`, `toDate`, `page`, `sportId` (= currentSportId), `limit`.
- `POST /profitLossByMatch` — market-wise data on row expand (body: `sportId`, `userId`, `matchId`, `fromDate`, `toDate`).
- `GET /getChild` — Select User list. Sports list comes from `dataService.getSports()` (for the tabs).
- **Socket:** None.

---


## Chips Summary

> **Menu path:** Sidebar → All Reports → Chips Summary
> **Route:** `/company/chip-summary`
> **Query params:** None.
> **Component:** `src/app/chip-summary/chip-summary.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is a separate standalone component (not the `report` component) — `ChipSummaryComponent` loads on the `chip-summary` route. (Company panel, role=11 — verified against current source.)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![chips-summary](screenshots/chips-summary.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Shows the chip (cash) settlement summary in two columns — on one side the downline users you need to "Give" money to (Plus), and on the other side those you need to "Take" money from (Minus). From here the user can review downline balances and perform a Part Settlement (P/S) or Full Settlement (F/S), and can also drill down into any child.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Chips Summary" heading, breadcrumb: Dashboard → Chips Summary.
- **Sport filter:** a Sport dropdown in the top toolbar (All + each sport) — reloads data on change (`changeSport`).
- **Two cards (side by side):**
  - **Left card — "<user> ( + ) Give"** — plus users (to be given). Columns: Role (badge "c"), Name (mstrname (mstruserid)), Balance (PUsum, 2-decimal), Action. The tfoot below shows the Total (sum of PUsum).
  - **Right card — "<user> ( - ) Take"** — minus users (to be taken). Columns: Role, Name, Balance (Musum, 2-decimal), Action. The tfoot below shows the Total (sum of Musum).
- Each card has a "Search" input at the top, and if a drill-down has been performed (the current user type differs from your own type), an **undo** icon button (to go back to your own level).
- **Name column:** if a row is a child and its usetype is not 3, the name is clickable (`init(UserID, usetype)` drills down into that child).
- **Action column buttons (per row, depending on conditions):**
  - **P/S** — Part Settlement; opens the settlement chip modal.
  - **F/S** — Full Settlement; `clearChip`. If the current user is `usetype 0` and the row is `usetype 8` (and the popup flag is true), a discount modal opens; otherwise a direct confirm ("Are you sure?").
  - **H** — History; navigates to the `/company/chip-history-user` page (query params: userid, name, parentId).
  - P/S and F/S are shown only when `canSettle(d)` is true and the row is a child. (`canSettle` depends on project / `allow_deposit_withdraw` / usetype-2 conditions.)
- **Modals / dialogs:**
  - **settlementChipModal** (P/S) — fields: Amount (Chips, number, required, min 1), Current Balance (display), Remark (Narration). "Save".
  - **settlementChipDiscountModal** (F/S discount case) — fields: Cash Discount (discount, number 1–5, required), Remark (Narration). "Save".

### Sub-pages

- **Chip History (User)** — the `H` button navigates to the `/company/chip-history-user` page (selected user's chip history).

### Actions

- Refresh the summary by changing the Sport filter.
- View users and the Total in both the Plus and Minus lists.
- Click a child user's name to drill down into its downline.
- Use the undo button to return to your own level.
- Use P/S for a part settlement (enter amount + remark and Save).
- Use F/S for a full settlement (discount + remark in the discount case, otherwise a direct confirm).
- Use the H button to view chip history.

### Data Source (Technical)

- **API:**
  - `POST /chipSummary` — balance summary of plus/minus users (body: `mstrid`, `typeId`, `sportId`). Response `data.plusData` / `data.minusData`.
  - `POST /clearChip` — saves the settlement (P/S, F/S and discount all use this endpoint; body includes `userId`, `CrDr`, `Chips`, `discount`, `IsFree`, `Narration`).
  - Sports list comes from `dataService.getSports()`.
- **Socket:** None.

---


## Bet History (Report id=1)

> **Menu path:** Sidebar → All Reports → Bet History
> **Route:** `/company/report?id=1`
> **Query params:** `id=1` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_. When arriving from Profit & Loss "Show Bet", extra params: `matchId`, `marketId`, `userId`, `username`, `fancyId`.
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is a single shared `report` component that shows 6 different reports based on the `id` query param. On this page `id=1` (Bet History). Inside the component `selectedBetType = '1'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified against current source.)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![bet-history](screenshots/bet-history.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Shows a list of all (active) bets placed by the selected user within the date range — on which market/selection, at what odds and stake the bet was placed, and what its P/L was. This is the `id=1` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** "Search..." input (client-side filter on the table data) + Filter icon button (collapse/expand the filter panel).
- **Report type label (heading):** disabled dropdown showing "Bet History List".
- **Filters / inputs:**
  - **Select User** — searchable dropdown (`getChild` API; defaults to "self").
  - **Type** — dropdown to change the report type (Bet History selected here).
  - **From Date** — date picker (defaults to 10 days before today).
  - **To Date** — date picker (defaults to today).
  - **Match Status** — shown only for `id=1` (and `id=5`): Matched (M) / Unmatched (U) / Past (P). Defaults to Matched.
- **Buttons:** "Load" — fetches data with the selected filters.
- **Table columns:** #, UserName, BetFor (Description badge + selection/market name + Bet ID + "Matched"), Odds, Stack, PL (positive=green / negative=red), Date, Address (ip), Status. Back/Lay rows have different colors (`lay0`/`back0`).
- **Footer:** "Total" row shows the total P_L of all visible rows (color coded).
- **Loading:** spinner on the table while data is loading.
- **Pagination:** mat-paginator (page size 10/25/50/100).
- **No data:** "There is no data available." message.

### Sub-pages

None. (Changing only the `id` makes this same component show a different report variant.)

### Actions

- Select a user, set From/To date, choose Match Status (M/U/P).
- Fetch data via "Load".
- Filter results via the search box.
- Change page / page size via pagination.
- Switch to another report via the Type dropdown.

### Data Source (Technical)

- **API:** `POST /betHistory` — body: `user_id`, `from_date`, `to_date`, `type: 1` (for id=1), `page_no`, `sport_id: '0'`, `bet_type` (= matchStatus M/U/P), `limit`.
- `GET /getChild` — searchable child list for the Select User dropdown.
- **Socket:** None.

---


## Settlement (Settlement Report)

> **Menu path:** Sidebar → All Reports → Settlement
> **Route:** `/company/chip-history?type=3`
> **Query params:** `type=3` (pre-selects Settlement). If `type` is absent, it defaults to `1` (Ledger).
> **Component:** `src/app/chip-history/chip-history.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the standalone `ChipHistoryComponent` (not the `report` component). The "Settlement" menu item in the Company panel (role=11) opens this component with the `type=3` query param. In `ngOnInit` the component reads `queryParams['type']` and uses it to set the filter form's `type` field — `3` means the **Settlement** ledger view. (Verified against current source.)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![settlement](screenshots/settlement.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Shows the coin / chip ledger date-wise according to a selectable "type" — with Credit, Debit and Balance. When arriving from the Settlement menu, `type=3` (Settlement) is pre-selected, i.e. only the ledger of settlement entries. The user can switch between Ledger / Commission / Settlement / Credit Limit via the dropdown, and can view their own (Own) ledger or that of a Super Master (User).

### What the `type` query param does

- The `type` value is set in `filterForm.type` and is sent to the API as `selectType` (Number).
- Mapping (Select dropdown): **1 = Ledger**, **2 = Commission**, **3 = Settlement**, **4 = Credit Limit**.
- The Settlement menu link sends `type=3`, so as soon as the page opens "Settlement" is selected and its ledger loads.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Settlement Report" heading, breadcrumb: Dashboard → Settlement Report.
- **Sub-heading:** "List".
- **Filters / inputs (filterForm):**
  - **Select** — dropdown: Ledger (1) / Commission (2) / Settlement (3) / Credit Limit (4). Pre-selected via the `type` query param.
  - **From Date** — date picker (defaults to 10 days before today).
  - **To Date** — date picker (defaults to today).
  - **Own / User** — radio group. "Own" = your own ledger; "User" = a Super Master's ledger.
  - **Select Super Master** — dropdown (`mstrname (mstruserid)`), enabled only when "User" is selected. List comes from the `/masters` API.
- **Buttons:** "Search" (fetches data via `init(true)`), "Reset" (UI button — currently no handler bound).
- **Table columns:** #, Date (EDate), Particular (narration), Credit (green), Debit (red), Balance, Revoke (Balance value; red when `< 0.01`, otherwise green).
- **Loading:** spinner on the table. **No data:** the table stays empty (no separate "no data" message).
- _(Note: there is no pagination here — the full result comes at once.)_

### Sub-pages

None.

### Actions

- Choose Ledger / Commission / Settlement / Credit Limit via the Select (type) dropdown.
- Set From/To date.
- Choose Own or User (Super Master); in the User case, select a Super Master.
- Fetch the ledger via "Search".

### Data Source (Technical)

- **API:** `POST /coinLedger` — body: `userId` (self mstrid for Own, otherwise the selected Super Master), `usertype` (corresponding usetype), `selectType` (= filter type 1-4, here 3=Settlement), `fromDate`, `toDate`, `filterType: 'ALL'`. On Search, extra `fromDate1` / `ToDate1` are also sent. Response `res.data`.
- `POST /masters` — body: `{ userid: <self mstrid> }`. List for the "Select Super Master" dropdown (`value.data`).
- **Socket:** None.

---


## Login History (Report id=4)

> **Menu path:** Sidebar → All Reports → Login History
> **Route:** `/company/report?id=4`
> **Query params:** `id=4` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same shared `report` component with `id=4` (Login History). Inside the component `selectedBetType = '4'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified against current source.)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![login-history](screenshots/login-history.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Shows the selected user's login records — when, and from which IP/device/browser and location (city/region/org) the login occurred. This is the `id=4` variant of the `report` component.

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

- Set User and date range, then click "Load".
- Filter results via the search box (client-side).
- Change page / page size via pagination.

### Data Source (Technical)

- **API:** `GET /loginHistory` — query params: `page`, `userId`, `from_date`, `to_date`, `limit`.
- `GET /getChild` — Select User list.
- **Socket:** None.

---


## Deleted Bet History (Report id=5)

> **Menu path:** Sidebar → All Reports → Deleted Bet History
> **Route:** `/company/report?id=5`
> **Query params:** `id=5` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same shared `report` component with `id=5` (Deleted Bet History). Inside the component `selectedBetType = '5'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified against current source.)
>
> **Access:** The "Delete Bet History" option in the Type dropdown is shown only when `userTypeId === 0` or `userTypeId === 11`. The Company role is **11**, so this report is available in the company panel.

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![deleted-bet-history](screenshots/deleted-bet-history.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Shows a list of the selected user's deleted/voided bets. The layout is exactly like Bet History (id=1); only `type=0` is sent to the backend (id=1 sends `type=1`) — so this fetches the deleted bets. This is the `id=5` variant of the `report` component.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Delete Bet History List".
- **Filters / inputs:**
  - **Select User**, **Type** dropdown, **From Date**, **To Date**, **Load** button.
  - **Match Status** — shown for `id=5` (and `id=1`): Matched (M) / Unmatched (U) / Past (P).
- **Table columns:** #, UserName, BetFor (Description badge + selection/market + Bet ID + "Matched"), Odds, Stack, PL (color coded), Date, Address (ip), Status. (Same as Bet History.)
- **Footer:** "Total" row shows total P_L (color coded).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

### Sub-pages

None.

### Actions

- Set User, date range and Match Status, then click "Load".
- Filter results via the search box.
- Change page / page size via pagination.

### Data Source (Technical)

- **API:** `POST /betHistory` — the same endpoint Bet History uses, but with `type: 0` (deleted) sent. Body: `user_id`, `from_date`, `to_date`, `type: 0`, `page_no`, `sport_id: '0'`, `bet_type` (= matchStatus), `limit`.
- `GET /getChild` — Select User list.
- **Socket:** None.

---


## Password History (Report id=6)

> **Menu path:** Sidebar → All Reports → Password History
> **Route:** `/company/report?id=6`
> **Query params:** `id=6` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** This is the same shared `report` component with `id=6` (Password History). Inside the component `selectedBetType = '6'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified against current source.)

### Screenshot

<!-- TODO: Add a live UI screenshot of this page here. Place the file in the screenshots/ folder. -->
![password-history](screenshots/password-history.png)

> _Screenshot pending — placeholder. Take a screenshot from the live site and replace the image above._

### Purpose

Shows the selected user's password change history — whose password was changed, when, and by whom (changer), and from which IP. This is the `id=6` variant of the `report` component.

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

- Set User and date range, then click "Load".
- Change page / page size via pagination.
- _(Note: the client-side search box does not apply to the id=6 table — the table binds directly to `data`.)_

### Data Source (Technical)

- **API:** `GET /passwordHistory` — query params: `page`, `userId`, `from_date`, `to_date`, `limit`. (Response comes in `res.data.data` + `res.data.meta` structure.)
- `GET /getChild` — Select User list.
- **Socket:** None.

---


## Bet List Live

> **Menu path:** Sidebar → Bet List Live
> **Route:** `/company/current-bets`
> **Query params:** `sportId`, `matchId`, `marketId` _(optional — may arrive via deep-link)_
> **Component:** `src/app/current-bets/current-bets.component.ts` (+ `.html`)

![](screenshots/bet-list-live.png)

### Purpose

This page displays all **live (current) bets** in real time. The list refreshes automatically whenever a socket event arrives. Company-role (usetype `11`) users who have `allow_bet_delete` can also delete bets and export the full data to Excel.

### Access (Who Sees What)

- The **Action (Delete) column** is shown only when usetype is `0`, **or** when usetype is `11` (company) and `allow_bet_delete` is true.
- All other users see the list as **read-only**.
- The **Bulk Delete Bets form** (inside the filter panel) is shown only to usetype `0` — not to company users.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Current Bets" heading; breadcrumb: Dashboard → Current Bets.
- **Top bar:**
  - "Search..." input — fetches data on typing (with a delay) via `appDelayInput`.
  - **Filter** icon button — collapses/expands the filter panel below.
  - **Export** (download) icon button — Excel download.
- **Section card:** "All Live Bets".
- **Filter panel (collapsible):**
  - **Sport** — dropdown (All + each sport). Reloads the list on change.
  - **Delete Bets form (usetype `0` only):** Formly repeat form — Select Match (searchable, filtered by sport), From Date (datetime-local), To Date (datetime-local), and a "Delete Bets" button.
- **Table columns:** `#`, `ID` (MstCode), `Sports`, `Match`, `Market`, `User`, `Selection`, `Type` (Back/Lay), `Odds`, `Stake`, `PL`, `Date`, `IP`, and (only for usetype `0` or usetype `11` with `allow_bet_delete`) `Action` (delete button).
  - **Type logic:** when `isBack == 1` it shows "Lay", otherwise "Back". The row color also depends on this (`lay0` / `back0` class).
- **Loader:** spinner while bets are being fetched.
- **Pagination:** `mat-paginator` — page size options 10 / 25 / 50 / 100 (default 50).

### Sub-pages

None. (This is a standalone listing page.)

### Actions

- Filter bets using the search box.
- Change the sport filter.
- Export/download data to Excel (`.xlsx`).
- Delete a single bet (Action delete button — password `prompt()` + confirm, authorized users only).
- Bulk-delete bets by time/match range (Delete Bets form — password `prompt()` + confirm, usetype `0` only).
- Change page and page size via pagination.

### Data Source (Technical)

- `GET /bets` — current bets list (params: `page`, `sportId`, `matchId`, `search`, `limit`; and `marketId` as well when `sportId == 7`).
- `GET /getMatchesForBets` — match dropdown for the Delete Bets form (filtered by sport).
- `POST /removeBet` — single bet delete (`marketId`, `betId`, `userId`, `matchId`, `password`).
- `POST /removeBetByTime` — bulk delete by time/match range (form fields + `password`).
- `POST /exportData` — Excel export (blob, params: `sportId`).
- **Socket event:** `ALL_BETS_UPDATE_DATA:<mstrid>` — auto-refreshes the list when a new update arrives. The room is managed via `dataService.manageRoom(...)` and joined via `socket.emit('room', ...)`.

---


## Results

> **Menu path:** Sidebar → Results
> **Route:** `/company/match-result`
> **Component:** `src/app/match-result/match-result.component.ts` (+ `match-result.component.html`)

![](screenshots/results.png)

### Purpose

On this page an authorized company user **declares the result of match markets** and views the list of results that have already been declared. A result declared by mistake can also be **Revoked (rolled back)**. The **Declare Result** section is shown only to certain authorized users.

### Menu Visibility (IMPORTANT — company-specific gating)

The "Results" menu item is **not shown to every company user** in the sidebar. The company panel (`company.component.ts`) removes this item from the menu unless the user matches one of the following conditions:

- `usetype == 11 && mstrid == 4957`, **OR**
- `usetype == 11 && mstrid == 2 && mstrname == 'Ccompany'`.

If neither of these matches, "Results" (and "Set Fancy BetLimit") is spliced out of the menu. In addition, if `allow_result_declare == 0`, the result-declare access is also withheld (the related item is removed from the sidebar).

> Note: This is only menu/visibility gating. Within the component, the same condition shows/hides sections (see "Access" below).

### Access (Who Sees What)

- The **Declare Result form** is shown only when the user is `usetype == 0`, **or** `allow_result_declare` is true, **or** the user is one of the specific company users (`usetype == 11` and `mstrid == 4957`; or `usetype == 11`, `mstrid == 2`, `mstrname == 'Ccompany'`).
- The **Action (Revoke) column** is added only when `usetype == 0`, `usetype == 55`, or the same specific `usetype == 11` company users (mstrid 4957 / Ccompany).
- All other users see only the **Match Result list** (read-only).

### On-screen Layout (UI)

- **Declare Result section (conditional):**
  - "Declare Result" heading; breadcrumb Dashboard → Declare Result.
  - 4 cascading dropdowns (each step loads the next): **Select Sport** → **Select Match** → **Select Market** → **Select Selection**.
  - **Declare** button (enabled only when the form is valid).
  - Note: If there is more than one market in the markets list, the "Match Odds" market is removed. In the selections list, an extra **"Abandoned"** option is added (selectionId 0).
- **Match Result section:**
  - "Match Result" heading; breadcrumb Dashboard → Match Result.
  - **Filters (collapsible, toggled via the `filter_alt` icon):**
    - **Sport** (mat-select, All + sports).
    - **Select Match** (searchable mat-select, `ngx-mat-select-search`).
    - **Market** (mat-select, unique `MarketName`).
    - **Result Date** (date picker).
  - **Table columns:** `#`, Match (`MatchName`), Market (`MarketName`), Sport (`sportName`), Selection (`SelectionName`), Result (`result`), **Declared By** (`UserID`), Date, and for authorized users an **Action** (Revoke button).
  - **Loader:** spinner (`isLoading`).
  - **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.

### Sub-pages

None. Both Declare and the list are sections on the same page; Revoke uses a `confirm()` dialog (no separate modal).

### Actions

- **Declare a result:** choose Sport → Match → Market → Selection and click Declare (`declareResult`). "Abandoned" can also be chosen.
- **Filter** the result list by Sport / Match (search) / Market / Date.
- **Revoke** a declared result (`rollback`, with `confirm`) — separate endpoints for fancy and market results.
- Browse results via pagination.

### Data Source (Technical)

- `GET /results` (params: `page`, `sport_id`, `match_id`, `date`, `limit`) — result list.
- `GET /getMatchesForResult?sportId=` — matches for declaring.
- `POST /getMatchMarketList` (body: `sportsId`, `matchId`) — the match's markets ("Match Odds" is filtered out).
- `GET /querySelection?marketId=` — the market's selections ("Abandoned" is added).
- `POST /results` — declare result (Sport_id, series_id, match_id, market_id, selectionId, isFancy=0, names...).
- `POST /rollbackMarketResult` — revoke market result (isFancy != 1).
- `POST /rollbackFancyResult` — revoke fancy result (isFancy == 1).
- `GET /getMatchesBySport` (params: `sport_id`, `search`) — searchable matches for the filter.
- `DataService.getSports()` — sports list (filter: `is_betfair`).
- **Socket:** none.

---


## Set Fancy BetLimit

> **Menu path:** Sidebar → Set Fancy BetLimit
> **Route:** `/company/manage-fancy`
> **Component:** `src/app/super-duper-admin/manage-fancy/manage-fancy.component.ts` (+ `.html`) _(reuses the super-duper-admin component)_

![](screenshots/set-fancy-betlimit.png)

### Purpose

On this page an admin manages the fancy markets of a match — setting bet limits (min/max stake, exposure), message and status, showing/hiding fancies, and declaring or abandoning a fancy result. Some limit/status columns are hidden for specific company users.

### Menu Visibility (IMPORTANT — company-specific gating)

The "Set Fancy BetLimit" menu item is also **not shown to every company user** in the sidebar — the gating is exactly like "Results". The company panel (`company.component.ts`) removes this item from the menu unless the user matches one of the following conditions:

- `usetype == 11 && mstrid == 4957`, **OR**
- `usetype == 11 && mstrid == 2 && mstrname == 'Ccompany'`.

If there is no match, both "Set Fancy BetLimit" (and "Results") are spliced out of the menu.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Manage Fancy Markets" heading; breadcrumb Dashboard → Fancy Markets. Card title "List".
- **Filters / inputs (toolbar row):**
  - `Select match` (mat-select, match list — reloads the list on selection)
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
- **Conditional hide (in-component):** For these specific company users, the `Min Stake`, `Max Stake`, `Max Exposure`, `Max Bet Exposure`, `Message`, and `Status` columns plus the "Update Stake & Message" button are hidden. Condition: (`usetype == 11 && mstrid == 4957`) or (`usetype == 11 && mstrid == 2 && mstrname == 'Ccompany'`). In other words, these company users get only the show/hide + result declare/abandon controls.
- **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.
- **Empty / not-found states:** "There is no data available." (data 0 and search blank) / "Not found." (search with 0 results).
- **Loader:** spinner (isLoading) + global loader (`dataService.loading`).

### Sub-pages

None.

### Actions

- Filter the fancy list by selecting a match + type and searching.
- Show/hide a fancy via the slide-toggle (`hide()` → active 1 ↔ 9).
- Set Active / In Active / Suspend / Hide via the Status dropdown (`updateStatus()`).
- Edit Min/Max stake, exposure, message and save via "Update Stake & Message" (`updateFancyStake()`) — _this button is hidden for the gated company users_.
- Enter a Result value and declare the fancy result via "Declare" (`declareResult()`, with confirm).
- Abandon a fancy via "Abandoned" (`abandonedFancy()`, with confirm).
- Browse fancy markets via pagination.

### Data Source (Technical)

- **API:**
  - `GET /fancies` (params: `page`, `type`, `matchId`, `search`, `limit`) — fancy list (`data`), matches dropdown (`matches`), selected `matchId`, `meta`.
  - `PUT /fancies/{ID}` (body: `active`) — status update / show-hide.
  - `PUT /updateFancyStake/{ID}` (body: the whole row `d`, blank message → `null`) — stake/exposure/message update.
  - `POST /declareFancyResult` (body: `sportId`, `fancy_Id`, `matchId`, `result`, `selectionId = mFancyId`) — declare fancy result.
  - `POST /abandonedFancy` (body: `sportId`, `fancy_Id`, `matchId`) — abandon fancy.
- **Socket:** none.

---


## Banners

> **Menu path:** Sidebar → Banners
> **Route:** `/company/banners`
> **Component:** `src/app/banners/banners.component.ts` (+ `banners.component.html`)

![](screenshots/banners.png)

### Purpose

On this page a company user manages the **homepage banners/sliders** — adding a new banner image, editing the image of an existing banner, and deleting a banner. These banners are displayed on the front site (client side) based on the domain.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Banners" heading; breadcrumb Dashboard → Banners.
- **Card title:** "List", with an **Add** icon button (`domain_add` icon) on the right side — opens the modal for creating a new banner.
- **Table columns:**
  - `Image` — banner preview thumbnail (`<img>`, width ~80px, source `d.image`).
  - `Domain` — which domain the banner belongs to (`domain`).
  - `Edit` (header "Action") — edit icon button (modal to update the banner's image).
  - `Delete` — delete icon button (warn color).
- **Loader:** spinner while banners are being fetched (`isLoading`).

### Add / Edit Modal (manageModal)

- Toolbar title: **Create Banner** (new) or **Edit Banner** (when `model.id` is present).
- **Form field:** `Image` — file input (Formly `type: 'file'`, `accept="image/*"`).
  - **Create mode:** Image is **required**.
  - **Edit mode:** Image is optional (if no new file is chosen, it sends a blank image with just the id, so the old image remains).
- **Save** button — enabled only when the form is valid.
- The Close (X) button closes the modal.

### Sub-pages

None. Add/Edit is an in-page `MatDialog` modal; Delete uses a `confirm()` dialog.

### Actions

- **Add a new banner** — Add button → modal → choose image → Save (`manage()` + `save()` → `POST /banner`).
- **Edit a banner** — Edit icon → modal → choose a new image (optional) → Save (`PUT /banner/{id}`).
- **Delete a banner** — Delete icon → confirm → delete (`remove()` → `DELETE /banner/{id}`).

### Data Source (Technical)

- **API:**
  - `GET /banner` — list of all banners.
  - `POST /banner` (multipart `FormData`: `image`) — create a new banner.
  - `PUT /banner/{id}` (multipart `FormData`: `id`, `image` — if string/blank, the image is skipped) — update banner.
  - `DELETE /banner/{id}` — delete banner.
- **Upload:** Sends via `FormData` (image file upload). The global loader `dataService.loading` stays active during save/delete.
- **Socket:** none.

---


## Concurrent Users

> **Menu path:** Sidebar → Concurrent Users
> **Route:** `/company/concurrent-users`
> **Component:** `src/app/concurrent-users/concurrent-users.component.ts` (+ `.html`)

![](screenshots/concurrent-users.png)

### Purpose

This page shows sport-wise active or completed (result) matches, and a live count of how many users placed how many bets on a match can be viewed in a modal. Active matches keep updating live via socket.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Concurrent Users" heading; breadcrumb Dashboard → Concurrent Users.
- **Top filters:**
  - `Select Sport` — dropdown (sports list; default Cricket = id 4. Some sport ids are filtered out: 1233, 1234, 1235, 1236, 4339, 7, 77, 11, 6).
  - `Type` — dropdown: Active (`true`) / Result (`false`).
  - "Search" button.
  - `From Date` / `To Date` (date pickers) + "Load" button — shown only in Result mode (`completedMatchesLoaded`) (default range: from -10 days ago to today).
- **List card ("List"):** Both Active and Result modes use the same column set, only the field names differ:
  - `Sports` (SportID/sport_id → CRICKET/Soccer/Tennis)
  - `Match Id`
  - `Market Id` (active: marketId / result: MarketId)
  - `Match Name` (active: matchName / result: EventName)
  - `DATE` (active: date / result: settle_date, `medium`)
  - `Action` — "Get Users" button (per-user bet count modal)
- **Modal (userModal):** header "Total Users - X / Total Bets - Y"; table with S.No, User ID (username), Total Bets; "Close" button.

### Sub-pages

None (only the in-page Get Users modal).

### Actions

- Select a Sport and Type (Active/Result) and click "Search".
- In Result mode, provide a From/To date range and click "Load".
- View the per-user bet count modal for a match via "Get Users" (`getCountUser()` — merges normal + fancy bets).
- Live active matches refresh automatically via socket updates.

### Data Source (Technical)

- **API:**
  - `POST /dashboard` (body: `sport_id`) — active matches list. Adds/removes rooms + joins/leaves per `marketId`.
  - `GET /bets/countPerUser/` (param: `matchId`) — per-user bet counts for the match (`normalBets`, `fancyBets`).
  - `POST /profitLoss` (body: `userId`, `fromDate`, `toDate`, `page`, `sportId`, `limit`) — completed/result matches data.
  - Sports list: `DataService.getSports()`.
- **Socket:** `connect`; emit `room` { name: 'DASHBOARD_UPDATE_ADMIN' }; `DASHBOARD_UPDATE_ADMIN` (matches refresh); `message` (live market data update via `updateData`); per-`marketId` join/leave room. Rooms are cleaned up in `ngOnDestroy`.

---


## Settings (Domain Settings)

> **Menu path:** Top-bar (header) dropdown → Settings
> **Route:** `/company/settings`
> **Query params:** None
> **Component:** `src/app/company/settings/settings.component.ts` (+ `.html`)
> **Parent page:** Top-bar (header) dropdown (`src/app/company/company.component.html`)

### Screenshot

![settings](screenshots/settings.png)

### Purpose

This page manages the company/domain branding settings — such as the login page headline, alternate URL, and login banner image. Whatever is set here appears on your domain (white-label site). This is the settings page of the COMPANY panel (the super-duper-admin one is separate).

### On-screen Layout (UI)

- **Title / breadcrumb:** "Domain Settings" (breadcrumb: Dashboard → Domain Settings)
- **Card:** a "Summary" ibox containing a form (generated via Formly).
- **Form fields (default, when `project != 2`):**
  - **Headline** — text input. Headline of the site/login page.
  - **User Headline** — text input. User-facing headline.
  - **Alternate URL** — text input (e.g. `https://xyz.com`).
  - **Login Banner** — file upload (images only, `accept="image/*"`).
- **Form fields (when `project == 2`):** the field set changes slightly:
  - **Mobile Number** — text input.
  - **Headline** — text input.
  - **Alternate URL** — text input (e.g. `https://xyz.com`).
  - **Login Banner** — file upload (images only).
- **Buttons:** **Save** (raised, primary). Remains disabled until the form is valid.

> Note: Inside the component, extra fields such as `mobile / facebook / instagram / telegram / email` are commented out — they do not currently appear in the UI.

### Sub-pages

No sub-pages. This is a single-form settings page.

### Actions

- Edit Headline / User Headline / Alternate URL / (Mobile in project 2).
- Upload a login banner image.
- Click **Save** to store the settings on the server. A loading spinner runs during save (`dataService.loading`).

### Data Source (Technical)

- **Load:** The form's initial data comes from `authService.domain` (set in the model). The `project` value comes from `authService.project`.
- **Save API (PUT):**
  - Default (`project != 2`): `PUT /domainSettings/{domainId}`
  - Project 2: `PUT /domains/{domainId}`
  - `domainId` = `authService.user.domainId`.
- **Payload:** `FormData` (multipart) — because a banner file is uploaded. If `login_banner` is a string or empty, it is sent as blank (so the existing image is not overwritten).
- **Socket:** None.

---


## Offers Settings (Agents Offers Setting)

> **Menu path:** Top-bar (header) dropdown → Offers Settings
> **Route:** `/company/offers-settings`
> **Query params:** None
> **Component:** `src/app/company/agent-offers-form/agent-offers-form.component.ts` (+ `.html`)
> **Parent page:** Top-bar (header) dropdown (`src/app/company/company.component.html`)

### Screenshot

![offers-settings](screenshots/offers-settings.png)

### Purpose

This page is the admin form for creating/updating an **offer for the company's agents**. From here you set the offer's heading, details, terms, and a banner image. This is the same offer that agents see read-only on the **Agent Offers** page (`agent-offers`).

### On-screen Layout (UI)

- **Title / breadcrumb:** "Agents Offers Setting" (breadcrumb: Dashboard → Offers Setting)
- **Card:** a "List" ibox containing the offer form.
- **Form fields (all required where noted):**
  - **Heading** — textarea (4 rows). Multi-line allowed (each line becomes a separate heading on the offer page). Required.
  - **Offer Details** — textarea (4 rows). Multi-line; each line becomes a list item. Required.
  - **Offer Terms** — textarea (4 rows). Multi-line; each line becomes a term. Required.
  - **Upload Banner Image** — file input. The offer banner.
- **Buttons:** **Save Offer** (primary). Disabled until the form is valid.

> Note: `submitOffer()` runs only when the form is valid **and** an image has been selected. On load, existing offer values pre-fill (heading/details/terms), but the image must be re-selected in order to save.

### Sub-pages

No sub-page is navigated to directly from this page. However, the offer set by this page is displayed on the **Agent Offers** page:

- [Agent Offers](agent-offers.md) — the offer set here (heading/details/terms/banner) is shown read-only to agents. Both read the same data from `GET /getOffer`.

### Actions

- Write Heading / Offer Details / Offer Terms (multi-line).
- Upload a banner image.
- Click **Save Offer** to save the offer.

### Data Source (Technical)

- **Load API (GET):** `GET /getOffer` — the current offer is fetched as soon as the page opens, and heading/offerDetails/offerTerms are patched into the form (`fetchOffer()`).
- **Save API (POST):** `POST /saveOffer` — sends `FormData` (multipart) with: `heading`, `offerDetails`, `offerTerms`, `image` (selected file).
- **Loading:** A `dataService.loading` spinner on both save and fetch.
- **Socket:** None.

---


## Agent Offers

> **Menu path:** Top-bar (header) → blinking "Agent Offer" badge button (in the sidebar header, shown when `user.usetype != 0`)
> **Route:** `/company/agent-offers`
> **Query params:** None
> **Component:** `src/app/agent-offers/agent-offers.component.ts` (+ `.html`)
> **Parent page:** Top-bar (header) — `src/app/_components/sidebar/sidebar.component.html`

### Screenshot

![agent-offers](screenshots/agent-offers.png)

### Purpose

This page shows agents the company's current **offer** read-only — banner image, heading(s), offer details, and offer terms. It is purely a display page; nothing is edited/created here. The actual offer setting is done from the [Offers Settings](offers-settings.md) page.

### On-screen Layout (UI)

- **Title / breadcrumb:** "Agents" (breadcrumb: Dashboard → Offers). The page renders only when the `offer` data is available (`*ngIf="offer"`).
- **Banner:** full-width offer banner image (`offer.imageUrl`).
- **Heading block:** center-aligned `<h4>` lines — `offer.heading` is split on newlines so each line becomes a separate heading.
- **Offer Details:** under the "Offer Details:" heading, a numbered list (`<ol>`), each line an item.
- **Offer Terms:** under the "Offer Terms:" heading, a numbered list (`<ol>`), each line a term.
- **Buttons / actions:** None — purely read-only.

### Sub-pages

No sub-pages.

### Entry point (where this page opens from)

- It opens from the **blinking "Agent Offer" badge button in the sidebar header**. This button exists in two places (mobile/desktop variants) and both use `routerLink="agent-offers"`, conditioned on `user.usetype != 0`. Reference: `src/app/_components/sidebar/sidebar.component.html` (lines ~16 and ~33).
- The route is registered in the routing module of every major panel (company, dealer, master, sub-admin, super-master, super-admin, super-duper-admin), so it opens from whichever panel the logged-in user is in.
- The header dropdown (`company.component.html`) has no direct link to it — there you only get Change Password / Settings / Offers Settings. The Agent Offer link comes from the blinking badge in the sidebar/top header.

### Actions

- The agent can only read the offer (banner, heading, details, terms). There is no edit/save action.

### Data Source (Technical)

- **Load API (GET):** `GET /getOffer` — `fetchOffer()` is called as soon as the page opens. The response contains `imageUrl`, `heading`, `offerDetails`, `offerTerms`.
- **Processing:** `heading`, `offerDetails`, `offerTerms` are split on `\n` and, after filtering out empty lines, turned into arrays (`offerheadingList`, `offerDetailsList`, `offerTermsList`).
- **Loading:** A `dataService.loading` spinner during fetch.
- **Socket:** None.

> Note: This is the same `GET /getOffer` data that is set by [Offers Settings](offers-settings.md) (`POST /saveOffer`).

---


