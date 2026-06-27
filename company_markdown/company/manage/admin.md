# Manage → Admin (Users List)

> **Menu path:** Sidebar → Manage → Admin
> **Route:** `/company/users`
> **Query params:** `userTypeId=10` (Admin list), optional `userId`, `category` (`agent`/`client`), `actionType`
> **Component:** `src/app/users/users.component.ts` (+ `.html`)
> **Parent page:** koi nahi (top-level Manage page)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![admin-list](screenshots/admin-list.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh wahi common **Users** page hai jo Company panel ki "Manage" submenu ki saari 5 list (Admin, Sub Admin, Super Stockist, Stockist, Agent) ke liye use hota hai — sirf `userTypeId` query param badalta hai. Is page par `userTypeId=10` aane se list **Admin** role ke users par filter ho jaati hai. Yahan se naye child user create, deposit/withdraw chips, lock/unlock, password change, sport block/limit, poker block, aur share/commission/profile edit kar sakte hain.

> Note: Baaki 4 list pages (Sub Admin, Super Stockist, Stockist, Agent) bhi **isi** component ko alag `userTypeId` ke saath khalte hain — un docs me sirf farak (userTypeId) likha hai aur full detail ke liye yahin par link kiya gaya hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Manage Clients", breadcrumb: Dashboard → Manage Clients.
- **Top bar (All Users box):** Refresh icon (`init`), User Count icon (`getUserCount`), aur **Create {role}** buttons — yeh `users-create` page par le jaate hain `[queryParams]="{ userId, userTypeId }"` ke saath. Role visibility `usersTypeList` aur parent ke usetype ke hisaab se.
- **Filters / search (har table block me):**
  - Status dropdown — All (`2`) / Active (`1`) / In Active (`0`) — `userGroup` (`applyUserGroupFilter` se `mstrlock` par filter).
  - **Search** input (type=search) — `search`, delayed input par `init` chalta hai.
- **Tables (role-wise alag ibox, `userTypeId`/`category` ke hisaab se):** `data` ko usetype par split karke alag tables banti hain — `superAdminTableData` (10), `subAdminTableData` (9), `superMasterTableData` (8), `masterTableData` (1), `dealerTableData` (2), `clientTableData` (3). `userTypeId=10` par Admin (super-admin) table dikhti hai.
- **Table columns (`columns`):** `User Name` (mstruserid + mstrname — **link to `user-dashboard`**), `Phone` (project != 1 par; betpro ke alawa), `PL` (`P_L`), `New PL` (`pl`, sirf usetype 0 par), `Exposure/Liability` (`settlementAmount`), `Balance`, `Agent Type` (`getRole`), `My/Agent share`, `Action`. Child role-wise tables (`companyColumns`, `superAdminColumns`, etc.) me: `#/User Name/PL/New PL/Exposure/Balance/Agent Type/My Share/Agent share`.
- **Action column buttons:** `D` Deposit, `W` Withdraw, `Edit` (viewAccount), `SB` Sport Block, `SL` Sport Limit, `PB` Poker Block, User Lock/Unlock (slide toggle), Bet Lock/Unlock (slide toggle), `PWD` Change Password, Account Statement icon (`account-statement` page).
- **Modals / dialogs (MatDialog):**
  - **A/C Chips In/Out** (`accountChipInOutModal`) — Deposit/Withdraw tabs; fields: Parent Chips (disabled), User Chips/Balance (disabled), **Amount** (Chips), **Remark** (RefID). Deposit/Withdraw button par spinner (`chipLoading`).
  - **Account of {user}** (`viewAccountModal`) — tabs: Casino Limit (usetype 11 par), Edit Profile; Profile/Additional info, Partnership Information (`getPartnershipData`), aur Commission edit form.
  - **Change Password** (`changePasswordModal`) — newPassword + confirmPassword (match validator).
  - **Sport Block** (`sportBlockModal`), **Sport Limit** (`sportLimitModal`, Formly: Min Stake, Max Stake, Max Profit, Bet Delay, Market Volume, Max Market Exposure, Lay Diff — Lay Diff sirf sportId 4/cricket par), **Poker Block** (`pokerBlockModal`).
  - **My Share** (`myShareModal`), **Max Share** (`maxShareModal`), **User Count** (`userCountModal`).

## Sub-pages (is page ke andar khulne wale pages)

- [user-dashboard.md](user-dashboard.md) — kisi bhi row me **User Name** par click karne se khulta hai. RouterLink: `['/', urlType, 'user-dashboard']` (Company login me `urlType = company`), queryParams: `{ userId: d.usecode, userTypeId: d.usetype, parentId: d.parentId }`.
- **users-create** (alag page) — "Create {role}" button se khulta hai (`users-create`, queryParams `{ userId, userTypeId }`). _(Yeh same users folder ka peer create-form page hai.)_
- **account-statement** (alag page) — Action column ke Account Statement icon se (`account-statement`, queryParams `{ id, type }`).

## Actions (User kya kar sakta hai)

- Naya child user create karna.
- Deposit / Withdraw chips (`saveCoins`).
- User lock/unlock (`lockUsers`), betting lock/unlock (`lockBetting`).
- Change password (`changeUserPassword`).
- Sport block (`blockedSports`), sport limit set (`sportLimits`), poker block (`blockedPoker`).
- My Share / Max Share dekhna, commission (`updateComm`) aur profile (`updateAccount`) edit, casino limit increment (`poker/casinoLimitIncrement`).
- User count dekhna (`getUserCount`), search / sort / status filter.
- Row par click karke us user ka dashboard (`user-dashboard`) kholna.

## Data source (technical)

- **API:** `POST /masters` (list — `category` ho to category-wise, warna `type`=userTypeId-wise; paginated), `GET /users/{id}` (parent — `getParent`), `POST /saveCoins`, `POST /changeUserPassword`, `POST /updateAccount`, `POST /updateComm`, `POST /getPartnershipData`, `POST /lockUsers`, `POST /lockBetting`, `GET|POST /blockedSports`, `GET|POST /sportLimits`, `GET|POST /blockedPoker`, `POST /clearChip`, `GET /accountStatement`, `POST /getUserCount`, `GET /poker/getCompanyCasinoLimit`, `POST /poker/casinoLimitIncrement`.
- **Socket:** koi socket event nahi (pura REST based).
