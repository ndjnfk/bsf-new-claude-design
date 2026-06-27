# BSF2020 — Betting Exchange Platform

A scalable, real-time betting exchange built as a **Go modular monolith** (Fiber + WebSocket)
with a **React + TypeScript** admin UI and polyglot persistence across **MySQL**, **MongoDB**
and **Redis**. One deployable, cleanly separated modules, designed to scale horizontally to
50K+ concurrent users.

> **Status: Phase 11.** The matching engine can now run as a dedicated **Rust** service
> ([`engine-rs/`](engine-rs)) — set `ENGINE_URL` and the Go app routes order matching to it through
> the same `MatchingEngine` interface (empty = in-process Go engine, the default). Phase 10
> completed helper management: parents can reset a helper's password and
> edit its permissions, the sidebar hides global items a helper lacks permission for, and a real
> Super Duper Admin is now required (helpers excluded) for non-delegable global config. Phase 9
> added helper login: a helper's token acts in its parent's context and carries a permission set,
> and the documented helper actions (declare result, fancy activation/result, match on/off, manage
> series/activate) are gated by those permissions. Phase 8 added role-based access control:
> platform-global features (settings,
> domains, casino, news, queries, IP surveillance, catalog mutations) are locked to the Super
> Duper Admin on both the API and the sidebar; downline-scoped features stay open to every
> management tier. Phase 7 completed the full Super Duper Admin spec (all 32 sections), including
> the detail/drill-down pages — Live Game Details (§4), Live Report / My Markets (§5, live order
> book + manual bet + positions), Collection Report (§13), Log Detail (§14), Chips Summary (§16).
> **Lower role tiers are now live:** the Manage Clients page and `/api/users/children` are
> generic, so logging in as any tier (Company, Admin, … Dealer) lets that user create and manage
> its own downline — the rule (each role creates only the next) is enforced server-side.
>
> Earlier phases delivered ~29 pages covering the rest of the spec:
> Dashboard (§1), Manage → Company (§2), Commission & Limits (§10), Manage Series (§18),
> Activate Matches (§19), Live Matches (§3), Completed/Old Match Results (§6, §25), Block Market
> (§8), Blocked Clients (§9), Bet List Live (§17), Results (§22), Set Fancy BetLimit (§27),
> Aura GGR (§7), Agent Bank DP/WD (§20), Deduct Dealer (§21), All Reports (§15), Settlements
> (§26), Add Worker (§24), Search Logs User (§12), Ip Surveillance (§30), Concurrent Users (§31),
> News (§29), Queries (§28), Website Setting (§23), Market Setting (§32), Manage Password (§11).
> Enforces **"Super Duper Admin creates Company only"**. Modules: identity, wallet, sports,
> fancy, requests, casino, domains, settings, helpers, audit, betting + matching **engine**,
> reporting, news, queries, realtime. See [ARCHITECTURE.md](ARCHITECTURE.md) and the spec in
> [SUPER-DUPER-ADMIN-FULL-DOCUMENTATION.md](SUPER-DUPER-ADMIN-FULL-DOCUMENTATION.md).

## Layout

```
backend/
  cmd/server/        single entrypoint (the monolith)
  internal/
    app/             composition root — wires modules + routes
    identity/        auth, JWT, RBAC, user hierarchy, Company creation   (MySQL)
    wallet/          chips in/out, ledger                                (MySQL)
    sports/          sports / matches catalog                            (MySQL)
    betting/         bets → matching engine, live publish                (Mongo + Redis)
    reporting/       read-only reports                                   (MySQL + Mongo)
    realtime/        WebSocket hub, Redis pub/sub fan-out                (Redis)
    engine/          back/lay matching + exposure (Rust-ready boundary)  (in-memory)
  pkg/               shared libs (config, database, auth, middleware, events, server)
  migrations/mysql/  schema (auto-applied by the mysql container)
frontend/            React + TypeScript (Vite + MUI) admin UI
engine-rs/           Rust matching engine (optional out-of-process; see ENGINE_URL)
docker-compose.yml   MySQL 8, MongoDB 7, Redis 7 (+ optional `app` profile w/ engine)
```

## Prerequisites
Docker + Docker Compose, Go 1.22+, Node 20+.

## Quick start

### 1. Datastores
```bash
cp .env.example .env
docker compose up -d mysql mongo redis
```
MySQL auto-applies `backend/migrations/mysql/*.sql` on first init (roles, users, domains,
ledger, sports, matches). Reset with `docker compose down -v`.

### 2. Backend (host)
```bash
cd backend
go mod tidy
go run ./cmd/server
```
On first start it bootstraps the Super Duper Admin from `SDA_USERNAME` / `SDA_PASSWORD`
(defaults `bsf` / `Bsf@12345`). Verify the stack:
```bash
curl localhost:8080/health/ready
# {"status":"ready","checks":{"mysql":"ok","mongo":"ok","redis":"ok"}}
```
> All-in-Docker alternative: `docker compose --profile app up --build`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:4200  (proxies /api + /ws to :8080)
```
Open http://localhost:4200, sign in as **bsf / Bsf@12345**, view the Dashboard, then go to
**Manage → Company** to create and list Companies.

## Key API endpoints

| Method | Path                          | Purpose                              |
|-------:|-------------------------------|--------------------------------------|
| POST   | `/api/auth/login`             | Login → JWT + user                    |
| GET    | `/api/auth/me`                | Current user                          |
| POST   | `/api/auth/change-password`   | Change own password (§11)             |
| GET    | `/api/dashboard`              | Home summary (§1)                     |
| POST   | `/api/users/company`          | Create Company — SDA only (§2)        |
| GET    | `/api/users/company`          | List Companies (§2)                   |
| POST   | `/api/users/:id/lock`         | Lock/unlock a user                    |
| POST   | `/api/wallet/transactions`    | Deposit/withdraw chips                 |
| GET    | `/api/wallet/statement`       | Ledger statement                      |
| GET    | `/api/sports`                 | Sports list (§8)                      |
| PUT    | `/api/sports/:id`             | Block/unblock a sport (§8)            |
| GET    | `/api/sports/matches`         | Matches by sport (§3)                 |
| PUT    | `/api/sports/matches/:id/block`| Block/unblock a match (§3)           |
| GET    | `/api/domains` · POST · PUT   | Website settings (§23)                |
| POST   | `/api/betting/bets`           | Place a bet (routed to the engine)    |
| GET    | `/api/betting/bets`           | Current bets (§17)                    |
| GET    | `/api/betting/book`           | Order-book depth for a market         |
| GET    | `/api/reports/bet-history`    | Bet history (§15)                     |
| GET    | `/api/reports/statement`      | Account statement (§15)               |
| GET    | `/api/reports/profit-loss`    | Profit & loss by market (§15)         |
| GET    | `/api/sports/matches/completed`| Completed/settled matches (§6)       |
| GET    | `/api/sports/results`         | Declared results (§22)                |
| POST   | `/api/sports/results`         | Declare a result → settles match (§22)|
| POST   | `/api/sports/results/:id/revoke`| Revoke a result (§22)               |
| GET/PUT| `/api/settings` · `/:key`     | Market settings (§32)                 |
| GET/POST/DELETE | `/api/news`          | News/blogs (§29)                      |
| GET/POST/PUT | `/api/queries`          | User queries (§28)                    |
| GET    | `/api/users/blocked`          | Locked clients (§9)                   |
| GET    | `/api/users/parents`          | User hierarchy chain (§12)            |
| GET/POST/DELETE | `/api/settlements`   | Settlement entries (§26)              |
| GET/POST/DELETE | `/api/helpers`       | Worker/helper accounts (§24)          |
| GET    | `/api/betting/count-per-user` | Per-user bet counts (§31)             |
| PUT    | `/api/users/:id/commission`   | Update commission/share/limits (§10)  |
| GET    | `/api/users/summary`          | Balance / downline / exposure (§10)   |
| GET/POST/PUT | `/api/sports/series`    | Series catalog (§18)                  |
| POST   | `/api/sports/matches`         | Create a manual match (§18)           |
| PUT    | `/api/sports/matches/:id/activate`| Activate/deactivate a match (§19) |
| GET    | `/api/login-history/today`    | Today's logins grouped by IP (§30)    |
| GET/PUT| `/api/fancy` · `/:id/...`     | Fancy markets + limits/status (§27)   |
| GET/POST/PUT | `/api/requests`         | Bank deposit/withdraw requests (§20)  |
| GET    | `/api/casino/ggr`             | Aura casino GGR report (§7)           |
| GET    | `/api/users/children`         | List downline (any tier)              |
| POST   | `/api/users/children`         | Create next-tier downline user        |
| GET    | `/api/collection-report`      | Minus/Plus/Zero balances (§13, §16)   |
| GET    | `/api/betting/book`           | Live order-book depth (§5)            |
| WS     | `/ws`                         | Live updates (`{action:"join",room}`) |

## Matching engine (Go or Rust)
The exchange matches opposing back (LAGAI) / lay (KHAI) orders behind the `MatchingEngine`
interface. By default it runs **in-process in Go**. To run the dedicated **Rust** engine instead,
start it and point the app at it:
```bash
cd engine-rs && cargo run --release        # listens on :9090
# then, from backend/:
ENGINE_URL=http://localhost:9090 go run ./cmd/server
```
Or `docker compose --profile app up --build`, which starts the engine and wires `ENGINE_URL`
automatically. The betting module is identical either way — see [engine-rs/README.md](engine-rs/README.md).

## Scale & real-time
Run multiple instances behind a load balancer. The WebSocket hub fans out through Redis
pub/sub, so any instance serves any socket — no sticky sessions. Details in
[ARCHITECTURE.md](ARCHITECTURE.md) §6.

## Next
Flesh out the remaining SDA pages (doc §3–§32), then lower role tiers, then extract the
matching engine to Rust if/when load demands it.
