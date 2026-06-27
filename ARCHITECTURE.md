# BSF2020 — Betting Exchange Platform Architecture

> Scalable, real-time betting exchange built as a **Go modular monolith** with a
> React + TypeScript admin UI and polyglot persistence (MySQL, MongoDB, Redis).
> One deployable, cleanly separated modules, designed to scale horizontally to
> 50K+ concurrent users.

---

## 1. Why a modular monolith (not microservices)

One Go process, but internally split into **modules** that each own their data and
talk to each other only through **Go interfaces** — never concrete types or network
calls. This gives:

- **Simplicity & speed** — one build, one deploy, one log stream, in-process calls
  (no network hops, no serialization tax on the hot path).
- **Clean seams** — because callers depend on interfaces, any module can later be
  extracted into its own service without touching its callers. The boundaries are
  already drawn.
- **Horizontal scale** — run N identical instances behind a load balancer. Shared
  state lives in MySQL/Mongo/Redis; the real-time plane fans out through Redis
  pub/sub, so no instance is special and no sticky sessions are needed.

---

## 2. Role hierarchy

8-level tree; each role creates only the role directly below it. `usetype` keeps the
legacy numeric codes for data compatibility.

| Level | Role                  | `usetype` | Creates       |
|------:|-----------------------|----------:|---------------|
| 0     | **Super Duper Admin** |        0  | Company **only** |
| 1     | Company               |       11  | Admin         |
| 2     | Admin                 |       10  | Sub Admin     |
| 3     | Sub Admin             |        9  | Super Master  |
| 4     | Super Master          |        8  | Master        |
| 5     | Master                |        1  | Dealer        |
| 6     | Dealer                |        2  | Player        |
| 7     | End User (Player)     |        3  | —             |

Helper/worker = `usetype 55`. The rule is encoded once in
[`pkg/domain/roles.go`](backend/pkg/domain/roles.go) (`CanCreate`) and enforced both at
the route (role middleware) and in the service layer.

---

## 3. Modules

```
cmd/server/main.go              # single entrypoint
internal/
  app/        # composition root: builds every module, registers routes
  identity/   # auth, JWT, RBAC, the user tree, Company creation   → MySQL
  wallet/     # chips in/out, ledger (account statements)          → MySQL
  sports/     # sports / matches / markets catalog                 → MySQL
  betting/    # bets, routes orders to the engine, live publish    → MongoDB + Redis
  reporting/  # read-only reports across stores                    → MySQL + MongoDB
  realtime/   # WebSocket hub, Redis pub/sub fan-out               → Redis
  engine/     # back/lay matching + risk/exposure (the hot path)   → in-memory
pkg/          # shared libs: config, database, auth, httpx, middleware,
              # events (Publisher interface), server, domain
```

### Cross-module contracts (the seams)
- **`engine.MatchingEngine`** — betting depends on this interface, not on the concrete
  `MemoryEngine`. This is the **Rust-ready boundary**: if match throughput ever outgrows
  in-process Go, replace the implementation with a client to a dedicated Rust matching
  service and **no caller changes**.
- **`events.Publisher`** — betting/sports push live updates through this; the realtime
  hub implements it. Modules never import each other.
- **`wallet.Accounts`** — wallet moves balances through this small interface, implemented
  by identity, so it doesn't reach into the users table directly.

---

## 4. Polyglot persistence (multi-tier DB)

### MySQL 8 — system of record (ACID)
`users` (hierarchy, balances, shares, commissions, locks), `domains`,
`account_statement`, `sports`, `matches`. Money and hierarchy must be strongly consistent.

### MongoDB 7 — high-volume / flexible documents
`bets` (and later deleted bets, logs, login/password history, odds snapshots). Append-heavy,
range-read, schema-flexible.

### Redis 7 — speed & real-time plane
Cache (hot users, sports list), **pub/sub** fan-out for the live pages, presence /
concurrent-user counters, rate limiting.

---

## 5. The processing layer (engine)

The exchange matches opposing **back (LAGAI)** and **lay (KHAI)** orders. The
[`engine`](backend/internal/engine) package holds an in-memory order book per
market+selection and computes worst-case **exposure** per order. Two implementations exist behind `MatchingEngine`:
- **`MemoryEngine`** (Go, in-process) — the default; more than fast enough for typical match rates.
- **`RemoteEngine`** (Go client) → **[`engine-rs/`](engine-rs)** (Rust service) — a dedicated,
  GC-free matching process with predictable tail latency, selected by setting `ENGINE_URL`.

The Rust service speaks the same JSON contract (`/submit`, `/book`, `/health`) and reproduces the
matching logic exactly, so switching is a config/deploy change — the betting module never changes.
This is the whole point of drawing the boundary as an interface from day one.

---

## 6. Real-time fan-out & scale to 50K

Every instance runs the same WebSocket hub and `PSUBSCRIBE`s the Redis `room:*` channels.
A producer (e.g. a placed bet) `PUBLISH`es to `room:MARKET_UPDATE_DATA:{matchId}`; every
instance receives it and pushes to its locally-connected sockets joined to that room.

```
  bet placed ──► betting module ──► events.Publisher ──► Redis PUBLISH room:MARKET_...
                                                              │
        instance A  ◄───────────────────────────────────────┼──► instance B
        (sockets joined to the room get the message on whichever instance they hit)
```

Result: connections spread across instances behind a load balancer with **no sticky
sessions**. Add instances to add capacity.

---

## 7. Frontend

React 18 + Vite + TypeScript + MUI, TanStack Query for data, Zustand for the session.
Routes mirror the doc (`/super-duper-admin/...`). Dev server proxies `/api` and `/ws` to
the Go app. See [frontend/src](frontend/src).

---

## 8. Build phases

- **Phase 0 — Foundation.** Infra, schema, connectors, health, hub skeleton. ✅
- **Phase 1 — Auth + Dashboard + Manage Company.** Login/JWT/RBAC, doc §1–§2, enforcing
  "Super Duper Admin creates Company only". Full module skeleton wired. ✅
- **Phase 2 — More SDA pages (this commit).** Live Matches (§3, realtime), Block Market (§8),
  Bet List Live (§17, realtime), All Reports (§15), Website Setting (§23, new domains module),
  Manage Password (§11), plus deposit/withdraw + lock on Manage Company. ✅
- **Phase 3 — Results, Completed Matches, content & settings (this commit).** Results (§22,
  declare/revoke → settles matches), Completed Matches (§6), Market Setting (§32, new settings
  module), News (§29) and Queries (§28) as new Mongo modules. ✅
- **Phase 4 — Clients, settlements, workers, monitoring (this commit).** Blocked Clients (§9),
  Settlements (§26, in wallet), Add Worker (§24, new helpers module), Search Logs User (§12,
  parent-chain walk), Concurrent Users (§31, per-user bet aggregation). ✅
- **Phase 5 — Commission, series, activation, surveillance (this commit).** Commission &
  Limits (§10, with downline summary), Manage Series (§18, series + manual matches), Activate
  Matches (§19), Ip Surveillance (§30) backed by a new **audit module** that records every
  login (the login flow now captures IP/User-Agent). ✅
- **Phase 6 — Fancy, bank requests, casino, deduct (this commit).** Set Fancy BetLimit (§27,
  new fancy module), Agent Bank DP/WD (§20, new requests module with an approval workflow that
  applies balance changes), Deduct Dealer (§21, reuses wallet), Aura GGR (§7, new casino module),
  Old Match Results (§25). ✅ Nearly the entire SDA spec is now covered.
- **Phase 7 — Detail sub-pages + lower role tiers (this commit).** Live Game Details (§4),
  Live Report/My Markets (§5, live order book from the engine + manual bet + positions),
  Collection Report (§13), Log Detail (§14), Chips Summary (§16). **Lower tiers enabled:** a
  generic `Manage Clients` page + `/api/users/children` derive the creatable role from the
  caller's usetype, so every tier (Company → Admin → … → Dealer) can manage its own downline.
  The whole SDA spec is now covered. ✅
- **Phase 8 — Role-based access control (this commit).** Platform-global features (website &
  market settings, casino, news, queries, IP surveillance, and catalog mutations like
  block/activate/series/results/fancy limits) are now locked to the Super Duper Admin via
  `middleware.RequireAuthRole`, while downline-scoped features stay open to every management tier
  (they are inherently scoped by `parent_id`). The sidebar filters the same way per role, and the
  app bar shows the signed-in role. ✅
- **Phase 9 — Helper login + permission enforcement (this commit).** Worker accounts (§24) can
  now sign in. Login tries the `users` table, then helper accounts (via the `HelperAuth` interface
  the helpers module implements). A helper's JWT acts **in its parent's context** (UserID/Usetype
  = parent) and carries `IsHelper`, the helper's own id, and its permission set. A new
  `RequirePermission(perm)` middleware gates the documented helper actions (declare result, fancy
  activation/result, match on/off, manage series/activate) — non-helpers pass through, helpers
  must hold the permission. The self password-change flow is blocked for helpers (it would target
  the parent). ✅
- **Phase 10 — Helper hardening + management (this commit).** Closed a delegation gap: pure-global
  config (settings, domains, casino, news, queries, surveillance) now uses `RequireSuperAdmin`,
  which rejects helpers acting in an SDA's context — only catalog actions with an explicit helper
  permission are delegable. Parents can now reset a helper's password and edit its name/permissions
  (`PUT /api/helpers/:id`, `/:id/password`). The sidebar hides global items a helper lacks the
  permission for, mirroring the API guards exactly. ✅
- **Phase 11 — Rust matching engine (this commit).** The `MatchingEngine` boundary paid off: a
  dedicated Rust service ([`engine-rs/`](engine-rs)) now implements back/lay matching + exposure
  over HTTP, mirroring the Go engine's behaviour and JSON contract. A Go `RemoteEngine` client
  implements the same interface; the app picks remote vs in-process via `ENGINE_URL`, so the
  betting module is byte-for-byte unchanged. Readiness pings the engine when remote. ✅
- **Phase 12+** — richer per-market live management, casino integration, engine persistence/replay.

Two SDA guards now exist: `RequireAuthRole(SDA)` (a real SDA **or** its permissioned helper —
used for delegable catalog mutations) and `RequireSuperAdmin` (a real SDA only — used for
non-delegable global config).

### Helper model
A helper is a restricted operator working under a management user. Its token inherits the parent's
role for coarse access (so the right panel shows) but every sensitive mutation is additionally
gated by `RequirePermission`, so two helpers of the same SDA can have different capabilities. All
downline-scoped reads/writes naturally resolve to the parent's subtree because UserID = parent id.

### Access model
Two guards wrap the API:
- `RequireAuth` — any authenticated user. Used by downline-scoped features (Manage Clients,
  wallet, reports, settlements, …) which only ever touch the caller's own subtree.
- `RequireAuthRole(SuperDuperAdmin)` — global platform admin. Used by settings/domains/casino/
  news/queries/audit and the catalog **mutation** routes in sports/fancy (their **read** routes
  stay open so every tier can view matches/series/results/fancy).
