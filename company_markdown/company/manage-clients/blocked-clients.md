# Blocked Clients

> **Menu path:** Sidebar → Manage Clients → Blocked Clients
> **Route:** `/company/blocked-user`
> **Component:** `src/app/blocked-user/blocked-user.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![blocked-clients](screenshots/blocked-clients.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page un blocked users ki list dikhata hai jo lock/bet-lock kiye gaye hain. Yahan se har blocked user ki commission details dekh sakte hain, edit page par jaake unko block/unblock (agent lock / bet lock) kar sakte hain, aur password change kar sakte hain.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Blocked Clients. Section title "Blocked Users".
- **Buttons / tools:** CSV button, PDF button (export — sirf UI present, abhi koi action wired nahi), aur **Search...** input (UI present, abhi `ngModel` se wired nahi — search code me `blockedUserSearch` se chalta hai).
- **Table columns (`blockedUserColumns`):**
  - `ID` — `mstruserid`
  - `User Name` — `(mstrname)` (brackets ke saath)
  - `Match Comm.` — `Commission`
  - `Ssn Comm.` — `SessionComm`
  - `Share` — (khaali cell)
  - `Actions` — **Edit** link (`[routerLink]="['../edit-blocked-user', d.mstruserid]"`) + **Change Password** button (`changePassword(d)`)
- **Modals / dialogs (parent page me defined, ng-template):**
  - **Edit SC** (`#editBlockModal`) — fields: User Id (disabled), Name, Current Limit (disabled), My Match Share (disabled), Match Share (disabled), Match Commission (disabled), Session Commission (disabled), Agent Blocked (toggle), Bets Blocked (toggle); Cancel + Save Change buttons. _(Note: list me Edit ab routerLink se child page par jaata hai; purana `openEditBlock()` dialog code abhi component me maujood hai but Edit link use nahi karta.)_
  - **Change Password SC** (`#changePasswordModal`) — New Password, Confirm Password fields (confirm pe `matchPassword` validator) + Change button.

## Sub-pages (is page ke andar khulne wale pages)

- [Edit Blocked Client](edit-blocked-client.md) — kisi blocked user ke row me **Edit** dabane par khulta hai (route `/company/edit-blocked-user/:id`).

## Actions (User kya kar sakta hai)

- Blocked users list dekhna (search code me support hai via `blockedUserSearch`).
- Kisi user ko Edit karna — child page par jaakar Agent Blocked / Bets Blocked toggle set karna.
- User ka password change karna (modal).
- CSV / PDF export buttons (sirf UI, action pending).

## Data source (technical)

- **API:**
  - `GET /getBlockUsers` (param `search`) — list fetch. Response `value.users` ko `blockedUserData.bets` me daalte hain.
  - `POST /setBlockedUsers` (`name`, `userId`, `mstrLock`, `betLock`) — block/unblock save (`onSaveChangeClicked`, dialog mode).
  - `POST /changeUserPassword` (`userName`, `userId`, `newPassword`, `confirmPassword`) — password change.
- **Socket:** Koi nahi.
