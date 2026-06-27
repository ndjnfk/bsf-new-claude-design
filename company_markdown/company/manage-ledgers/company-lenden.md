# Company Len Den

> **Menu path:** Sidebar → Manage Ledgers → Company Len Den
> **Route:** `/company/company-lenden`
> **Query params:** `name` (parent/company ka naam, heading me), `filterType` (Transaction-type select se URL me merge hota hai)
> **Component:** `src/app/company-lenden/company-lenden.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![company-lenden](screenshots/company-lenden.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

> **Note:** Yeh page **company panel (role 11) ke liye naya page hai** — super-duper-admin docs me iska koi base nahi hai. Yeh doc seedha source code se likha gaya hai.

## Page kya karta hai (Purpose)

Yeh page company user ka **apne parent ke saath ka len-den (chip / ledger statement)** dikhata hai — yaani company aur uske upar wale (parent) ke beech ki transactions ki list. Har entry par date, narration/particular, credit, debit aur running balance aata hai. Upar diye dropdown se transaction view ka type badla jaa sakta hai (Transaction-wise, Match-wise, Settlement).

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Company Len Den" heading, breadcrumb: Dashboard → Company Len Den.
- **Section card heading:** "List" + saath me ek **type dropdown**.
- **Filter (dropdown — `selectedType`):**
  - **Transaction wise** (`ALL`) — default.
  - **Match wise** (`Single`).
  - **Settlement** (`Settlement`).
  - Type change par `onTypeChange()` chalta hai: columns update hote hain aur `filterType` URL query param me merge ho jaata hai.
- **Table columns (dynamic, `selectedType` par depend):**
  - **Transaction wise (ALL):** Date, Particular (`narration`), Credit, Debit, **Balance**.
  - **Match wise / Settlement:** Date, Particular (`narration`), Credit, Debit (yahan **Balance column hata diya jaata hai**).
  - _(HTML me `Selection` (`SelectionName`) ka column template bhi defined hai, par woh tab hi render hota hai jab `columns` array me hota — current logic me yeh kisi bhi type par columns list me nahi aata.)_
  - Date field `EDate` se aata hai (`date: 'medium'` format), baaki `Credit` / `Debit` / `Balance` direct fields se.
- **Pagination:** mat-paginator — page size options 10/25/50/100, default 50.
- **No data:** "There is no data available."
- **Modals / dialogs:** koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Len-den statement table dekhna (read-only).
- **Type dropdown** se view badalna (Transaction wise / Match wise / Settlement) — columns + URL `filterType` update hota hai aur data dobara fetch hota hai.
- Pagination se page aur page-size badalna (`fetchData`).

## Data source (technical)

- **API:** `POST /chipHistoryParentID`
  - **Body:** `userId` (= logged-in company user ki `mstrid`), `parentId` (= `authService.user.parentId`), `filterType` (= `selectedType`: `ALL` / `Single` / `Settlement`).
  - **Query params:** `page`, `limit`.
  - **Response:** `data` (rows), `meta.total`, `meta.perPage`.
- Data load page open hote hi `queryParams` subscription me trigger hota hai (`name` param se `username` set hota hai, phir `fetchData()`).
- **Socket:** koi nahi.
