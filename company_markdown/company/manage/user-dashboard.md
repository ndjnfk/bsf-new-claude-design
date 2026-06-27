# User Dashboard (Agent Match Dashboard)

> **Menu path:** Manage → (Admin / Sub Admin / Super Stockist / Stockist / Agent) → row me User Name par click
> **Route:** `/company/user-dashboard`
> **Query params:** `userId`, `userTypeId`, `parentId` (kabhi `directRouteToCollectionReport` bhi)
> **Component:** `src/app/user-dashboard/user-dashboard.component.ts` (+ `.html`)
> **Parent page:** [admin.md](admin.md) _(aur baaki Manage list pages: [sub-admin.md](sub-admin.md), [super-stockist.md](super-stockist.md), [stockist.md](stockist.md), [agent.md](agent.md))_

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![user-dashboard](screenshots/user-dashboard.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh ek single user/agent ka dashboard hai jo kisi bhi Manage list (Admin/Sub Admin/Super Stockist/Stockist/Agent) me row par click karne se khulta hai. Top par us user ke liye quick-action buttons (cash receive/pay, ledgers, direct agents/clients, coin history) hote hain, aur niche us user ke Coins (balance) aur Rs. Exposure (settlementAmount) cards dikhte hain. Yeh ek **hub / navigation page** hai jahan se aage ke saare user-specific pages khulte hain.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → SC → `{{ data?.mstrname }}`.
- **Box "Agent Match Dashboard"** (button row, sab buttons us user ke `userId`/`userTypeId`/`parentId` ke saath Company-prefixed route par navigate karte hain — Company login me `urlType = company`):
  - **Recieve Cash** — `recieve-pay-cash` (componentType `receiveCash`).
  - **Pay Cash** — `recieve-pay-cash` (componentType `payCash`).
  - **Ledger** — `chip-history-user`.
  - **Cash Ledger** — `chip-history-user` (`filterCash: 'All', typeId: 50`).
  - **Match ledger** — `ledger-match-summary`.
  - **Direct Agents** — `users` (`category: 'agent', actionType: 'd'`) — sirf jab `usetype != 2 && usetype != 3`.
  - **Direct Client** — `users` (`category: 'client'`) — sirf jab `usetype != 3`.
  - **Coin History** — `coinHistory`.
- **Cards row (niche):**
  - **Coins** — `data?.balance`.
  - **Rs. Exposure** — `data?.settlementAmount` (`parsedSettlementAmount` getter `parseInt` karke nikalta hai).
  - **Coins Exposure** — card code me hai par `display:none` (hidden).
- **Buttons:** upar diye action buttons hi hain.
- **Table columns:** koi table nahi.
- **Modals / dialogs:** koi modal nahi (sab routerLink navigation).

## Sub-pages (is page ke andar khulne wale pages)

Saare `/company/`-prefixed routes par jaate hain (`urlType` logged-in Company user ke usetype=11 se `company` banta hai):

- [recieve-pay-cash.md](recieve-pay-cash.md) — "Recieve Cash" / "Pay Cash" buttons se (cash collection / settlement page).
- [chip-history-user.md](chip-history-user.md) — "Ledger" aur "Cash Ledger" buttons se (chip/cash ledger page).
- [ledger-match-summary.md](ledger-match-summary.md) — "Match ledger" button se (match-wise ledger summary).
- [coinHistory.md](coinHistory.md) — "Coin History" button se (coin transaction history).
- [ledger-tables.md](ledger-tables.md) — ledger drill-down / detailed table view (ledger pages se khulne wala table page).
- [admin.md](admin.md) (`users` route) — "Direct Agents" (`category=agent`) aur "Direct Client" (`category=client`) buttons se — same Users component, us user ke neeche ke agents/clients list.

## Actions (User kya kar sakta hai)

- Selected user ke liye cash receive/pay karna.
- Ledger / Cash Ledger / Match ledger / Coin History dekhna.
- Us user ke direct agents ya direct clients ki list par jaana.
- Coins (balance) aur Rs. Exposure dekhna (read-only cards).

## Data source (technical)

- **API:** `GET /users/{userId}` (`getUserData` — page load par us user ki details `data` me load karta hai). Baaki saara data target sub-pages khud load karte hain.
- **Socket:** koi socket event nahi.
