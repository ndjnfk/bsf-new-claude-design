# Set Fancy BetLimit

> **Menu path:** Sidebar → Set Fancy BetLimit
> **Route:** `/company/manage-fancy`
> **Component:** `src/app/super-duper-admin/manage-fancy/manage-fancy.component.ts` (+ `.html`) _(super-duper-admin ka component reuse hota hai)_

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![set-fancy-betlimit](screenshots/set-fancy-betlimit.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Is page pe admin kisi match ke fancy markets ko manage karta hai — bet limits (min/max stake, exposure), message aur status set karta hai, fancy ko show/hide karta hai aur fancy ka result declare ya abandon karta hai. Kuch limit/status columns specific company users ke liye chhup jaate hain.

## Menu visibility (IMPORTANT — company-specific gating)

Yeh "Set Fancy BetLimit" menu item bhi sidebar me **har company user ko nahi dikhta** — bilkul "Results" jaisa hi gating hai. Company panel (`company.component.ts`) menu se is item ko hata deta hai jab tak user in conditions me se kisi ek pe fit na ho:

- `usetype == 11 && mstrid == 4957`, **YA**
- `usetype == 11 && mstrid == 2 && mstrname == 'Ccompany'`.

Match na ho to "Set Fancy BetLimit" (aur "Results") dono menu se splice ho jaate hain.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Manage Fancy Markets" heading, breadcrumb Dashboard → Fancy Markets. Card title "List".
- **Filters / inputs (toolbar row):**
  - `Select match` (mat-select, match list — selection par list reload)
  - `Select type` (mat-select: All / Sessions (`session`) / Line (`line`))
  - `Search` (text input, `appDelayInput` — delayed input par reload)
- **Table columns:**
  - `#` (serial)
  - `Match Name` (matchName)
  - `Fancy Name` — slide-toggle (active=1 → on, warna hide) + `HeadName` label
  - `Min Stake` (number input — `MinStake`)
  - `Max Stake` (number input — `MaxStake`)
  - `Max Exposure` (number input — `max_session_liability`)
  - `Max Bet Exposure` (number input — `max_session_bet_liability`)
  - `Message` (text input — `message`)
  - `Status` (mat-select: Active(1) / In Active(0) / Suspend(4) / Hide(9))
  - `Result` (text input — `result`)
  - `Declare` (Declare button — `result` fill hone par hi enable)
  - `Action` (Abandoned button + "Update Stake & Message" button)
- **Conditional hide (in-component):** In specific company users ke liye `Min Stake`, `Max Stake`, `Max Exposure`, `Max Bet Exposure`, `Message`, `Status` columns aur "Update Stake & Message" button hide ho jaate hain. Condition: (`usetype == 11 && mstrid == 4957`) ya (`usetype == 11 && mstrid == 2 && mstrname == 'Ccompany'`). Yani in company users ko sirf show/hide + result declare/abandon controls milte hain.
- **Paginator:** pageSizeOptions [10, 25, 50, 100], default 50.
- **Empty / not-found states:** "There is no data available." (data 0 aur search blank) / "Not found." (search ke saath result 0).
- **Loader:** spinner (isLoading) + global loader (`dataService.loading`).

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Match + type select aur search karke fancy list filter karna.
- Slide-toggle se fancy ko show/hide karna (`hide()` → active 1 ↔ 9).
- Status dropdown se Active / In Active / Suspend / Hide set karna (`updateStatus()`).
- Min/Max stake, exposure, message edit karke "Update Stake & Message" se save karna (`updateFancyStake()`) — _gated company users ke liye yeh button hidden hai_.
- Result value daal kar "Declare" se fancy result declare karna (`declareResult()`, confirm ke saath).
- "Abandoned" se fancy abandon karna (`abandonedFancy()`, confirm ke saath).
- Pagination ke through fancy markets browse karna.

## Data source (technical)

- **API:**
  - `GET /fancies` (params: `page`, `type`, `matchId`, `search`, `limit`) — fancy list (`data`), matches dropdown (`matches`), selected `matchId`, `meta`.
  - `PUT /fancies/{ID}` (body: `active`) — status update / show-hide.
  - `PUT /updateFancyStake/{ID}` (body: poora row `d`, blank message → `null`) — stake/exposure/message update.
  - `POST /declareFancyResult` (body: `sportId`, `fancy_Id`, `matchId`, `result`, `selectionId = mFancyId`) — fancy result declare.
  - `POST /abandonedFancy` (body: `sportId`, `fancy_Id`, `matchId`) — fancy abandon.
- **Socket:** koi nahi.
