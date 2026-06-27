# Receive / Pay Cash

> **Menu path:** User Dashboard → Receive Cash / Pay Cash
> **Route:** `/company/recieve-pay-cash`
> **Query params:** `userId`, `userTypeId`, `componentType` (`receiveCash` ya `payCash`), `agentName`, `agentId`, `settlementAmount`, `directRouteToCollectionReport` _(optional, `'true'`/`'false'`)_
> **Component:** `src/app/recieve-pay-cash/recieve-pay-cash.component.ts` (+ `.html`)
> **Parent page:** [User Dashboard](../user-dashboard.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![recieve-pay-cash](screenshots/recieve-pay-cash.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Is page se ek downline user (client/agent) ke saath cash settlement hota hai — yaani user se **cash receive** karna ya user ko **cash pay** karna. `componentType` query param decide karta hai ki page "Receive Cash From User" mode me khulega ya "Pay Cash To User" mode me. Settlement amount ke against ek chip-clearing entry banayi jaati hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Matches" heading + breadcrumb (Dashboard → SC → `{agentName}` → "Receive Cash" / "Pay Cash").
- **Card title:** `componentType` ke hisab se "Receive Cash From User" ya "Pay Cash To User".
- **Info rows (read-only):**
  - **Agent Name:** `{agentId} ({agentName})`.
  - **Rs. Exposure:** current `settlementAmount`.
- **Filters / inputs:**
  - **Update Ledger** — number input (`inputAmount`), sirf tab dikhta hai jab `directRouteToCollectionReport === true`. Yahan settle karne wali amount daali jaati hai (min 0, step 0.01).
  - **Note** — textarea.
    - Agar `directRouteToCollectionReport` false hai → textarea **readonly** with fixed text "Go to collection report for settlement".
    - Agar true hai → editable note (`note` field).
- **Buttons:**
  - **Save Changes** — sirf tab visible jab `directRouteToCollectionReport === true`. Click pe `clearChip()` chalti hai. Loader chalu hone par disabled (`loaderBtn`).

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi. _(Jab `directRouteToCollectionReport` false ho to user ko Collection Report par jaane ki guidance di jaati hai, lekin yahan se direct navigation nahi hota.)_

## Actions (User kya kar sakta hai)

- **Amount + note enter karna** (direct-route mode me) aur **Save Changes** karna.
- `clearChip()`:
  - Validation: agar amount invalid ho to alert. _(Note: code ka condition `inputAmount <= 0 && inputAmount > settlementAmount` likha hai — practically yeh dono ek saath sach nahi ho sakte, isliye validation effectively skip ho jaata hai. Source quirk, document ke liye note kar diya.)_
  - `/clearChip` POST karta hai with `CrDr = 2` (receiveCash) ya `1` (payCash), `Chips = inputAmount`, `discount = 0`, `IsFree = 2`, `Narration = note`.
  - Success ke baad `getUserData()` se fresh `settlementAmount` laata hai, input/note reset, loader off.

## Data source (technical)

- **API:**
  - `POST /clearChip` — settlement/clear chip entry banata hai. Body: `userId`, `CrDr` (2=receive, 1=pay), `Chips`, `discount`, `IsFree`, `Narration`.
  - `GET /users/{userId}` — updated `settlementAmount` fetch karta hai (`getUserData`).
- **Socket:** Koi nahi.
