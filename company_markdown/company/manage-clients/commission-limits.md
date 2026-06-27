# Commission & Limits

> **Menu path:** Sidebar → Manage Clients → Commission & Limits
> **Route:** `/company/commission-limit`
> **Query params:** `userId=<self mstrid>` (logged-in company ka apna mstrid), `userTypeId=11` (company role view). `userId` change karke kisi child ki downline drill-down ho sakti hai.
> **Component:** `src/app/commission-limit/commission-limit.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![commission-limits](screenshots/commission-limits.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page downline users ke commission (Bookmaker & Session) aur balances ko role-wise table me dikhata hai, plus ek overall Summary (My Balance, Downline Balance, Exposure). Yahan se deposit/withdraw, account/commission/partnership edit, sport block, sport limit, poker block, downline balance, aur client ka exposure (Expo / bets list) sab manage hota hai. Company role ke liye route par `userId` (apna mstrid) aur `userTypeId=11` pass hote hain; `userId` change hone par data dobara load hota hai (kisi child ki downline drill-down).

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Commission & Limits.
- **Filters / inputs (har table block me):**
  - Status dropdown — `userGroup`: All (`2`) / Active (`0`) / In Active (`1`). (Default `2`.)
  - **Search** input (`type=search`, `search`) — debounced (`DelayInputDirective`).
- **Role-wise table blocks (`userTypeId` ke hisaab se data filter hota hai):** Super Admin (`usetype 10`), Sub Admin (`9`), Super Master (`8`), Master (`1`), Dealer (`2`), Client/User (`3`). Company role me uski downline ke relevant blocks dikhte hain.
- **Table columns (`superAdminColumns` etc.):**
  - `So.` — serial number (`#`, index)
  - `User Name` — `mstruserid` + `mstrname` (user-dashboard ka link)
  - `BM. Comm` — `rolling_commission` (Bookmaker commission)
  - `SES. Comm` — `fancy_rolling_commission` (Session commission)
  - `Balance` — `balance`
  - `Down Bal` — "Down Bal" button (`getDownlineBalance`); Client table me yeh **Expo** button (`expoModals`) ban jaata hai
  - `Action` — `D` Deposit, `W` Withdraw, `Edit` (viewAccount), `SB` Sport Block, `SL` Sport Limit (usetype 0/11), `PB` Poker Block
- **Summary card (bottom):** Refresh icon (`refreshExposure`); table me **My Balance** (`user.balance`), **Down Line Balance** (`totalDownlineBalance`), **Rs. Exposure** (`exposureData`).
- **Modals / dialogs (ng-template):**
  - **A/C Chips In/Out** (`#accountChipInOutModal`) — Deposit/Withdraw tabs; fields: Parent Chips (disabled), User Chips/Balance (disabled), **Amount** (`Chips`), **Remark** (`RefID`).
  - **Account of {user}** (`#viewAccountModal`) — Edit Profile / Commission / Partnership tabs; profile (Name, remarks, create_no_of_child), commission (oddsComm, sessionComm, otherComm), partnership (cricket/soccer/tennis/casino/dream/binary/election/virtual_game role-wise shares), aur change password.
  - **Sport Block** (`#sportBlockModal`) — sports list toggles (`/blockedSports`).
  - **Sport Limit** (`#sportLimitModal`) — Formly repeat form per market/fancy/bookmaker: Min Stake, Max Stake, Max Profit, Bet Delay, Market Volume, Max Market Exposure.
  - **Poker Block** (`#pokerBlockModal`) — poker games toggles (`/blockedPoker`).
  - **Downline Balance** (`#downlineBalanceModal`) — selected user ka downline_balance.
  - **Expo** (`#expoModal`) — client ke open bets list (`/bets`), `expocolumns`.
  - **User Count** (`#userCountModal`) — date-range wise user count (`/getUserCount`).

## Sub-pages (is page ke andar khulne wale pages)

Koi alag route-based sub-page nahi. User Name link `user-dashboard` par jaata hai (alag page). Baaki sab kaam isi page ke modals/dialogs me hota hai. _(Note: is page se "Agent Offers" (`agent-offers`) ya `offers-settings` ka koi link nahi hai — component/template me aisa koi route nahi mila.)_

## Actions (User kya kar sakta hai)

- Downline users ke commission aur balance role-wise dekhna; search / sort / status-filter.
- Deposit / Withdraw chips (A/C Chips In/Out).
- Account / commission / partnership / profile edit; password change.
- Sport block, sport limit set, poker block.
- Lock/unlock user (`lockUsers`) aur betting lock/unlock (`lockBetting`) — viewAccount modal toggles, confirm prompt ke saath.
- Downline balance dekhna (Down Bal), client ka exposure/bets dekhna (Expo).
- Profit/Loss clear karna (`clearChip`), summary exposure refresh karna.

## Data source (technical)

- **API:**
  - `POST /masters` (list, body `userid`+`page`, params `search`/`sort`/`order`/`user_lock`/`limit`)
  - `GET /users/{id}` (parent details, role/title decide karta hai)
  - `POST /chipSummary` (Summary exposure — `exposureData = data.plusData[0].PUsum`)
  - `GET /masters/downlineBalance` (param `parentId`) — Down Bal
  - `GET /bets` (Expo — client ke bets)
  - `POST /saveCoins` (deposit/withdraw, `CrDr`)
  - `POST /updateAccount`, `POST /updateComm`, `POST /getPartnershipData`
  - `POST /lockUsers`, `POST /lockBetting`
  - `GET /blockedSports` / `POST /blockedSports`, `GET /sportLimits` / `POST /sportLimits`, `GET /blockedPoker` / `POST /blockedPoker`
  - `POST /clearChip`, `GET /accountStatement`, `POST /changeUserPassword`, `POST /getUserCount`
- **Note:** `totalDownlineBalance` client-side calculate hota hai — `downline_balance + balance` ka sum (string values ko `+()` se number me convert karke).
- **Socket:** Koi nahi (sab REST based).
