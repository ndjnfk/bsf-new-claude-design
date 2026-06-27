# Block Market

> **Menu path:** Sidebar → Block Market
> **Route:** `/company/sports`
> **Component:** `src/app/sports/sports.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![block-market](screenshots/block-market.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page poori sports ki list dikhata hai aur har sport ko on/off (block/unblock) karne ki suvidha deta hai. Ek simple table jisme toggle se sport ka status turant change hota hai aur list refresh ho jaati hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Sports Block" — breadcrumb: Dashboard → Sports Block.
- **Section card:** "Block Sports" titled card jisme sports ka table hai.
- **Filters / inputs:** Koi search/filter input nahi.
- **Buttons / controls:**
  - Per-row slide-toggle (Action column) — us sport ko on/off karta hai. `[checked]` `d.active == 1` ke hisaab se set hota hai.
- **Table columns (`columns`):**
  - `So.` — serial number (`index + 1`).
  - `Name` — sport ka naam (`d.name`).
  - `Status` — "{name} is ON/Off" (`d.active == 1` to ON, warna Off).
  - `Action` — slide-toggle.
- **Loader:** Jab list load ho rahi ho (`isLoading`) tab `mat-spinner` dikhta hai.
- **Modals / dialogs:** Koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Sports ki list aur unka current status (ON/Off) dekhna.
- Kisi sport ke Action toggle se use block/unblock karna. Toggle dabate hi update hota hai aur list dobara load hoti hai.

## Data source (technical)

- **API:**
  - Sports list `dataService.getSports()` se load hoti hai (promise).
  - `PUT /sports/:id` — body `{ active: sport.active ? 0 : 1 }` — sport ka status toggle. Success ke baad `init()` se list refresh.
- **Socket:** Koi nahi.
