# User

> **Menu path:** Sidebar → Manage Clients → User
> **Route:** `/company/users?userTypeId=3`
> **Query params:** `userTypeId=3` (end-users / clients filter), optional `userId`, `category` (jab `category=CLIENT` ho to client-only table block render hota hai)
> **Component:** `src/app/users/users.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![user](screenshots/user.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh wahi Users (Manage Clients) page hai jo end-users (clients, `userTypeId=3` / `usetype 3`) par filter hota hai. Company role (`usetype 11`) apni downline ke clients ki list yahan dekhta hai — har client ka PL, exposure, balance, share, plus deposit/withdraw, account/commission/partnership edit, sport block, sport limit, poker block jaise actions modals me milte hain. Query params (`userId`, `userTypeId`, `category`) change hone par data dobara load hota hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Manage Clients" — breadcrumb: Dashboard → Manage Clients.
- **Section card:** "All Users". (Client block tab dikhta hai jab `category === 'CLIENT'`; warna role-wise full table block render hota hai.)
- **Filters / inputs:**
  - Status dropdown (`userGroup`) — All (`2`) / Active (`1`) / In Active (`0`). Default page-level `1`.
  - **Search** input (`type=search`, `search`) — debounced (`DelayInputDirective`), har change par `init()` call hota hai.
- **Client table columns (`userColumns`):**
  - `User Name` — `mstruserid` + `(mstrname)`. **Row link** → `user-dashboard` page (`[routerLink]="['/', urlType, 'user-dashboard']"`, queryParams `userId`, `userTypeId`, `parentId`). _(See [../manage/user-dashboard.md](../manage/user-dashboard.md).)_
  - `PL` — `P_L`
  - `New PL` — `pl`
  - `Exposure` — `settlementAmount`
  - `Balance` — `balance`
  - `Agent Type` — `agent_type` (client ke liye "Client")
  - `My Share` — "My Share" button (`myShare(d)`) → My Share modal
  - `Agent share` — "Agent share" button (`maxShare(d)`) → Max Share modal
- **Locked rows:** `mstrlock === 0` wali row par `locked-row` class lag jaati hai.
- **Modals / dialogs (ng-template, page me defined):** A/C Chips In/Out (deposit/withdraw), Account of {user} (Profile / Commission / Partnership tabs + change password), Sport Block, Sport Limit (Formly repeat: Min/Max Stake, Max Profit, Bet Delay, Market Volume, Max Market Exposure, Lay Diff), Poker Block, My Share, Agent (Max) Share, User Count, Expo (client bets).

## Sub-pages (is page ke andar khulne wale pages)

- **User Dashboard** — kisi client ki row (User Name link) par click karke khulta hai (`/company/user-dashboard`). Yeh alag page hai, modal nahi. Dekhein [../manage/user-dashboard.md](../manage/user-dashboard.md).
- Baaki sab kaam (deposit/withdraw, edit, sport/poker block, limits, share) isi page ke modals/dialogs me hota hai — koi route-based sub-page nahi.

## Actions (User kya kar sakta hai)

- Clients ki list dekhna; search / sort / status-filter (All/Active/In Active).
- Kisi client ka **User Dashboard** kholna (row link).
- Deposit / Withdraw chips (A/C Chips In/Out modal, `saveCoins`).
- Account / commission / partnership / profile edit; password change (Account modal).
- My Share aur Agent share dekhna.
- Sport block, sport limit set, poker block (modals).
- User lock/unlock (`lockUnlockUser`) aur betting lock/unlock (`lockUnlockBetting`) confirm prompt ke saath; profit/loss clear (`clearChip`).

## Data source (technical)

- **API:**
  - `POST /masters` (list — body `userid`, `type` = userTypeId (3) ya `category`, `page`; params `search`/`sort`/`order`/`limit`). Response `data.data` se client table (`usetype === 3`) filter hoti hai.
  - `GET /users/{id}` (parent details, title/role decide).
  - `POST /saveCoins` (deposit/withdraw, `CrDr`), `POST /updateAccount`, `POST /updateComm`, `POST /getPartnershipData`.
  - `POST /lockUsers`, `POST /lockBetting`, `POST /clearChip`, `POST /changeUserPassword`.
  - `GET/POST /blockedSports`, `GET/POST /sportLimits`, `GET/POST /blockedPoker`, `GET /accountStatement`, `POST /getUserCount`.
- **Note:** Client table data `clientTableData` me `usetype === 3` wale users se banti hai. `urlType` = `getUrlType(user.usetype)` (company role me `company`).
- **Socket:** Koi nahi (sab REST based).
