# Chips Summary

> **Menu path:** Sidebar → All Reports → Chips Summary
> **Route:** `/company/chip-summary`
> **Query params:** Koi nahi.
> **Component:** `src/app/chip-summary/chip-summary.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** Yeh alag standalone component hai (`report` component nahi) — route `chip-summary` par `ChipSummaryComponent` load hota hai. (Company panel, role=11 — verified current source se.)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![chips-summary](screenshots/chips-summary.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Chip (cash) settlement summary do columns me dikhata hai — ek taraf jin downline users ko paisa "Give/Dena" hai (Plus) aur dusri taraf jinse "Take/Lena" hai (Minus). User apni downline balances dekh kar yahin se Part Settlement (P/S) ya Full Settlement (F/S) kar sakta hai, aur kisi child me drill-down bhi kar sakta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Chips Summary" heading, breadcrumb: Dashboard → Chips Summary.
- **Sport filter:** upar toolbar me Sport dropdown (All + har sport) — change par data reload (`changeSport`).
- **Do cards (side by side):**
  - **Left card — "<user> ( + ) Give"** — plus users (Dena hai). Columns: Role (badge "c"), Name (mstrname (mstruserid)), Balance (PUsum, 2-decimal), Action. Niche tfoot me Total (PUsum sum).
  - **Right card — "<user> ( - ) Take"** — minus users (Lena hai). Columns: Role, Name, Balance (Musum, 2-decimal), Action. Niche tfoot me Total (Musum sum).
- Har card me upar ek "Search" input, aur agar drill-down kiya ho (current user type apne type se alag ho) to ek **undo** icon button (wapas apne level par jaane ke liye).
- **Name column:** agar row child hai aur uska usetype 3 nahi hai to naam clickable hota hai (`init(UserID, usetype)` se us child me drill-down hota hai).
- **Action column buttons (per row, conditions ke hisaab se):**
  - **P/S** — Part Settlement; settlement chip modal khulta hai.
  - **F/S** — Full Settlement; `clearChip`. Agar current user `usetype 0` aur row `usetype 8` ho (aur popup flag true ho) to discount modal khulta hai, warna direct confirm ("Are you sure?").
  - **H** — History; `/company/chip-history-user` page par jaata hai (query params: userid, name, parentId).
  - P/S aur F/S sirf tab dikhte hain jab `canSettle(d)` true ho aur row child ho. (`canSettle` project / `allow_deposit_withdraw` / usetype-2 conditions par depend karta hai.)
- **Modals / dialogs:**
  - **settlementChipModal** (P/S) — fields: Amount (Chips, number, required, min 1), Current Balance (display), Remark (Narration). "Save".
  - **settlementChipDiscountModal** (F/S discount case) — fields: Cash Discount (discount, number 1–5, required), Remark (Narration). "Save".

## Sub-pages (is page ke andar khulne wale pages)

- **Chip History (User)** — `H` button se `/company/chip-history-user` page par jaata hai (selected user ki chip history).

## Actions (User kya kar sakta hai)

- Sport filter change karke summary refresh karna.
- Plus/Minus dono lists me users aur Total dekhna.
- Child user ke naam par click karke uski downline me drill-down karna.
- undo button se wapas apne level par aana.
- P/S se part settlement (amount + remark daal kar Save).
- F/S se full settlement (discount case me discount + remark, warna direct confirm).
- H button se chip history dekhna.

## Data source (technical)

- **API:**
  - `POST /chipSummary` — plus/minus users ki balance summary (body: `mstrid`, `typeId`, `sportId`). Response `data.plusData` / `data.minusData`.
  - `POST /clearChip` — settlement save (P/S, F/S aur discount sabhi isi endpoint par; body me `userId`, `CrDr`, `Chips`, `discount`, `IsFree`, `Narration`).
  - Sports list `dataService.getSports()` se.
- **Socket:** Koi nahi.
