# Company — Page-wise Documentation (Nested)

Yeh documentation **bsf2020-admin-ui** project ke `company` panel (role = 11) ke har page ko cover karti hai — **page-wise** aur **nested** structure me. Jis page ke andar aur pages khulte hain (jaise **Live Matches** → match click → Bet Slips / Session Bet Slip / Live Report / Collection Report), unke docs us page ke **apne folder ke andar** rakhe gaye hain.

- **Live URL:** `http://localhost:4200/company/home-dashboard`
- **Login level:** Company (role 11)
- **Source code (read-only):** `d:\2024\bsf2020-admin-ui\src\app`
- **Yeh docs project ke BAHAR hain:** `d:\2024\bsf2020-admin-docs\company\` (project/app me koi change nahi kiya gaya)

> 📸 **Screenshots:** Har page ki doc me screenshot ke liye **placeholder** (TODO) laga hai. Live site se screenshot lekar `screenshots/` folder me daalein — detail: [screenshots/README.md](screenshots/README.md). Har page format ke liye: [_TEMPLATE.md](_TEMPLATE.md).
>
> Bahut saare pages **super-duper-admin** panel ke saath shared hain (same Angular components) — un docs ko base banakar company-specific (route prefix `/company/`, menu, query params, role 11) adapt kiya gaya hai. English full version: [COMPANY-FULL-DOCUMENTATION-EN.md](COMPANY-FULL-DOCUMENTATION-EN.md).

---

## Folder structure (nested tree)

```
company/
├── README.md                         ← yeh file (index)
├── _TEMPLATE.md                      ← har page doc ka format
├── screenshots/                      ← screenshot placeholder folder
│
├── dashboard.md                      [Dashboard] home-dashboard (landing page)
│
├── manage/                           [Manage]  role-wise user lists (sab `users` component)
│   ├── admin.md                      users?userTypeId=10  (full detail master doc)
│   ├── sub-admin.md                  users?userTypeId=9
│   ├── super-stockist.md             users?userTypeId=8
│   ├── stockist.md                   users?userTypeId=1
│   ├── agent.md                      users?userTypeId=2
│   ├── user-dashboard.md             ↳ user row click → user-dashboard (hub)
│   ├── recieve-pay-cash.md           ↳ hub → Receive/Pay cash
│   ├── chip-history-user.md          ↳ hub → Client Ledger / Cash Ledger
│   ├── ledger-match-summary.md       ↳ hub → match-wise ledger summary
│   ├── coin-history.md               ↳ hub → coin/chip history
│   └── ledger-tables.md              ↳ ledger/account-statement table
│
├── live-matches/                     [Live Matches]  ⭐ nested section
│   ├── live-matches.md               dashboard (live matches list)
│   ├── agent-match-dashboard.md      ↳ match click → live-game-detials (hub)
│   ├── bet-slips.md                  ↳ betslips-tables
│   ├── session-bet-slip.md           ↳ sessionbetslips
│   ├── live-report.md                ↳ my-markets (LiveReport)
│   └── collection-report.md          ↳ collection-report
│
├── completed-matches/                [Completed Matches]  (settled match — full hub)
│   ├── completed-matches.md          completedMatchesList
│   ├── agent-match-dashboard.md      ↳ match click → live-game-detials (FULL buttons)
│   ├── bet-slips.md                  ↳ betslips-tables
│   ├── session-bet-slip.md           ↳ sessionbetslips
│   ├── live-report.md                ↳ my-markets
│   ├── collection-report.md          ↳ collection-report
│   ├── client-report.md              ↳ client-report
│   ├── company-report.md             ↳ company-report  ✅ route registered
│   ├── session-earning-report.md     ↳ session-earning-report
│   ├── ledger-match-wise.md          ↳ ledger-match-wise  ✅ route registered
│   └── bet-history.md                ↳ bet-history (Show Bet)
│
├── aura-ggr.md                       [Aura GGR] royal-casino
├── block-market.md                   [Block Market] sports
│
├── manage-clients/                   [Manage Clients]
│   ├── user.md                       User → users?userTypeId=3
│   ├── blocked-clients.md            blocked-user
│   ├── edit-blocked-client.md        ↳ edit-blocked-user/:id
│   └── commission-limits.md          commission-limit?userId=<self>&userTypeId=11
│
├── manage-password.md                [Manage Password] change-password
│
├── search-logs-user/                 [Search Logs User]
│   ├── search-logs-user.md           search-logs-user
│   └── log-user-details.md           ↳ logs-user-details/:id
│
├── manage-ledgers/                   [Manage Ledgers]
│   ├── collection-report.md          collection-report-all
│   ├── my-statement.md               report?id=3&accTypeId=4
│   ├── profit-loss.md                report?id=2
│   └── company-lenden.md             company-lenden  ⭐ company-specific
│
├── all-reports/                      [All Reports]
│   ├── my-statement.md               report?id=3
│   ├── profit-loss.md                report?id=2
│   ├── chips-summary.md              chip-summary
│   ├── bet-history.md                report?id=1
│   ├── settlement.md                 chip-history?type=3  ⭐ company-specific
│   ├── login-history.md              report?id=4
│   ├── deleted-bet-history.md        report?id=5
│   └── password-history.md           report?id=6
│
├── bet-list-live.md                  [Bet List Live] current-bets
├── results.md                        [Results] match-result  (conditional menu)
├── set-fancy-betlimit.md            [Set Fancy BetLimit] manage-fancy  (conditional menu)
├── banners.md                        [Banners] banners  ⭐ company-specific
├── concurrent-users.md               [Concurrent Users] concurrent-users
│
└── header-actions/                   [Top-bar dropdown — sidebar me nahi]
    ├── settings.md                   Settings → settings (company settings)
    ├── offers-settings.md            Offers Settings → offers-settings (agent-offers-form)
    └── agent-offers.md               agent-offers (sidebar header "Agent Offer" badge se)
```

---

## Sidebar Menu — Page Index (UI order)

| # | Menu Item | Sub / Andar ke pages | Route | Doc |
|---|-----------|----------------------|-------|-----|
| 1 | **Dashboard** | — | `home-dashboard` | [dashboard.md](dashboard.md) |
| 2 | **Manage → Admin** | user click → User Dashboard | `users?userTypeId=10` | [manage/admin.md](manage/admin.md) |
| 2 | **Manage → Sub Admin** | — | `users?userTypeId=9` | [manage/sub-admin.md](manage/sub-admin.md) |
| 2 | **Manage → Super Stockist** | — | `users?userTypeId=8` | [manage/super-stockist.md](manage/super-stockist.md) |
| 2 | **Manage → Stockist** | — | `users?userTypeId=1` | [manage/stockist.md](manage/stockist.md) |
| 2 | **Manage → Agent** | — | `users?userTypeId=2` | [manage/agent.md](manage/agent.md) |
| 3 | **Live Matches** ⭐ | Agent Match Dashboard → Bet Slips, Session Bet Slip, Live Report, Collection Report | `dashboard` | [live-matches/live-matches.md](live-matches/live-matches.md) |
| 4 | **Completed Matches** | Agent Match Dashboard (full) → Bet Slips, Session Bet Slip, Live Report, Client/Company/Session Earning/Collection Report, Ledger, Show Bet | `completedMatchesList` | [completed-matches/completed-matches.md](completed-matches/completed-matches.md) |
| 5 | **Aura GGR** | — | `royal-casino` | [aura-ggr.md](aura-ggr.md) |
| 6 | **Block Market** | — | `sports` | [block-market.md](block-market.md) |
| 7 | **Manage Clients → User** | user click → User Dashboard | `users?userTypeId=3` | [manage-clients/user.md](manage-clients/user.md) |
| 7 | **Manage Clients → Blocked Clients** | Edit Blocked Client | `blocked-user` | [manage-clients/blocked-clients.md](manage-clients/blocked-clients.md) |
| 7 | **Manage Clients → Commission & Limits** | — | `commission-limit` | [manage-clients/commission-limits.md](manage-clients/commission-limits.md) |
| 8 | **Manage Password** | — | `change-password` | [manage-password.md](manage-password.md) |
| 9 | **Search Logs User** | Log User Details | `search-logs-user` | [search-logs-user/search-logs-user.md](search-logs-user/search-logs-user.md) |
| 10 | **Manage Ledgers → Collection Report** | user drill-down | `collection-report-all` | [manage-ledgers/collection-report.md](manage-ledgers/collection-report.md) |
| 10 | **Manage Ledgers → My Stmt. / P&L** | — | `report?id=3` / `report?id=2` | [manage-ledgers/my-statement.md](manage-ledgers/my-statement.md) · [manage-ledgers/profit-loss.md](manage-ledgers/profit-loss.md) |
| 10 | **Manage Ledgers → Company Len Den** ⭐ | — | `company-lenden` | [manage-ledgers/company-lenden.md](manage-ledgers/company-lenden.md) |
| 11 | **All Reports** | My Stmt / P&L / Chips Summary / Bet History / Settlement / Login / Deleted Bet / Password History | `report?id=1..6`, `chip-summary`, `chip-history` | [all-reports/](all-reports/) |
| 12 | **Bet List Live** | — | `current-bets` | [bet-list-live.md](bet-list-live.md) |
| 13 | **Results** _(conditional)_ | — | `match-result` | [results.md](results.md) |
| 14 | **Set Fancy BetLimit** _(conditional)_ | — | `manage-fancy` | [set-fancy-betlimit.md](set-fancy-betlimit.md) |
| 15 | **Banners** ⭐ | — | `banners` | [banners.md](banners.md) |
| 16 | **Concurrent Users** | — | `concurrent-users` | [concurrent-users.md](concurrent-users.md) |

---

## Top-bar (Header) Dropdown — pages

Left sidebar ke alawa har page ke top-right dropdown me (component `company.component`):

- **Change Password** → `change-password` (same as Manage Password)
- **Settings** → `settings` ([header-actions/settings.md](header-actions/settings.md))
- **Offers Settings** → `offers-settings` ([header-actions/offers-settings.md](header-actions/offers-settings.md))
- Mobile par Balance / PL / Log out bhi isi dropdown me.
- **Agent Offer** badge (blinking) sidebar header me → `agent-offers` ([header-actions/agent-offers.md](header-actions/agent-offers.md)), condition `usetype != 0`.

---

## ⚠️ Important notes (code padhte waqt mile)

1. **Company-specific naye pages** (super-duper-admin me nahi the): **Company Len Den** (`company-lenden`), **Banners** (`banners`), **Settlement** (`chip-history?type=3`), aur header me **Settings** + **Offers Settings**.
2. **`company-report` aur `ledger-match-wise` routes company module me REGISTERED hain** (super-duper-admin ke ulat, jahan ye registered nahi the) — yahan ye working pages hain.
3. **Role-wise Manage lists** (Admin / Sub Admin / Super Stockist / Stockist / Agent / User) sab **ek hi `users` component** hain, sirf `userTypeId` query param alag — full detail [manage/admin.md](manage/admin.md) me.
4. **`report` component ek hi hai** jo `id` query param (1–6) se alag report dikhata hai: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History.
5. **Results aur Set Fancy BetLimit menu conditional hain** — sirf `(usetype==11 && mstrid==4957)` ya `(usetype==11 && mstrid==2 && mstrname=='Ccompany')` users ko dikhte hain (declare access `allow_result_declare` par). Detail [results.md](results.md).
6. **Live Matches vs Completed Matches hub:** dono `live-game-detials` (Agent Match Dashboard) kholte hain. Live Matches me `pageType='liveMatches'` → sirf Bet Slips / Session Bet Slip / Live Report / Collection Report; Completed (settled) me pageType nahi → Client Report, Company Report, Session Earning Report bhi dikhte hain.
