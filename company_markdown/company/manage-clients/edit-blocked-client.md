# Edit Blocked Client

> **Menu path:** Sidebar → Manage Clients → Blocked Clients → (row me) Edit
> **Route:** `/company/edit-blocked-user/:id`
> **Component:** `src/app/blocked-user/edit-blocked-user/edit-blocked-user.component.ts` (+ `.html`)
> **Parent page:** [Blocked Clients](blocked-clients.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![edit-blocked-client](screenshots/edit-blocked-client.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page kisi ek blocked user ki details edit karne ke liye hai. Idhar se user ko **Agent Blocked** (agent lock) aur **Bets Blocked** (bet lock) toggle se on/off kiya jaata hai. Baaki commission/share fields sirf dekhne ke liye (disabled) hain. Page Blocked Clients list ke **Edit** button se khulta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Clients", breadcrumb: Dashboard → Edit Block Clients. Section title "Edit User".
- **Form fields (`editBlockForm`):**
  - `User Id` — disabled (`userid`)
  - `Name` — editable (`name`)
  - `Current Limit` — disabled (`currentLimit`, user ka balance)
  - `My Match Share` — disabled (`100 - partner_cricket`)
  - `Match Share` — disabled (`partner_cricket`)
  - `Match Commission` — disabled (`Commission`)
  - `Session Commission` — disabled (`SessionComm`)
  - **Agent Blocked** — slide-toggle, ON/OFF label. `mstrlock === 0` hone par ON.
  - **Bets Blocked** — slide-toggle, ON/OFF label. `bet_lock === 0` hone par ON.
- **Buttons:**
  - **Cancel** — wapas Blocked Clients list par (`[routerLink]="['/', urlType, 'blocked-user']"`, company role me `urlType = company`).
  - **Save Changes** — `onSaveChangeClicked()`.
- **Modals / dialogs:** Page-mode me koi nahi. (Component dual-mode hai — niche dekhein.)

## Dual mode (technical note)

Component do tarah se chal sakta hai:
- **Page mode** (default): route param `:id` se user fetch hota hai, Save ke baad list par navigate.
- **Dialog mode**: agar `MAT_DIALOG_DATA` se data aaye to form usse populate hota hai, Save/Cancel `dialogRef.close()` karte hain. (Yahan blocked-user page edit ke liye page mode use karta hai.)

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- User ki block details dekhna (commission/share disabled fields).
- Name edit karna.
- **Agent Blocked** toggle se agent lock/unlock set karna.
- **Bets Blocked** toggle se bet lock/unlock set karna.
- Save Changes se update, ya Cancel se wapas list par jaana.

## Data source (technical)

- **API:**
  - `GET /getBlockUsers` (param `search` = id) — page mode me user data fetch; response `users` me se `mstruserid === id || mstrid === id` match karke form populate.
  - `POST /setBlockedUsers` (`name`, `userId`, `mstrLock` = agentBlocked ? 0 : 1, `betLock` = betsBlocked ? 0 : 1) — save.
- `urlType` `dataService.getUrlType(authService.user.usetype)` se nikalta hai (Cancel/navigation ke liye; company role = `company`).
- **Socket:** Koi nahi.
