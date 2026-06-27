# Search Logs User

> **Menu path:** Sidebar → Search Logs User
> **Route:** `/company/search-logs-user`
> **Component:** `src/app/search-logs-user/search-logs-user.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![search-logs-user](screenshots/search-logs-user.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Is page pe ek **User ID** daal kar uske **parent hierarchy** (Super Duper Admin se le kar User tak ki poori chain) dekh sakte hain. Agar us user ke logs maujood hain to "User Logs Statement" button enable ho jaata hai, jisse uski poori betting/balance/liability logs detail page khulta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** heading "DASHBOARD", breadcrumb: Dashboard → Search User.
- **Filters / inputs:**
  - **Enter User Id** — text input (`selectedUserId`).
  - "User doesn't exist" error text (red) — tab dikhta hai jab `inputbox_lable == false` (yaani logs na mile).
- **Buttons:**
  - **Submit** (`getUserDetails`) — user ke logs check karta hai aur parents fetch karta hai.
  - **User Logs Statement** (`showLogsBtn == true` hone par hi dikhta hai) — child detail page par le jaata hai (`../logs-user-details/<mstruserid>`).
- **Table columns (Search User Details):** do-column table — **Role** (`roleLabels`: Super duper Admin, Company, AD (super-admin), SC (sub-admin), SST (super-master), SS (master), SA (dealer), Sp (user)) aur uske saamne us role ka parent: `mstruserid (mstrname) partner_cricket%`. Parent na ho to "-".
- **Modals / dialogs:** koi nahi.

> Note: constructor me `init()` chalti hai jo `POST /masters` se masters list laati hai (current logged-in company user ki `mstrid` ke under; sirf data prep ke liye — current UI me yeh list directly render nahi hoti).

## Sub-pages (is page ke andar khulne wale pages)

- [User Logs Statement (Log User Details)](log-user-details.md) — "User Logs Statement" button par click karne se khulta hai (route `logs-user-details/:id`).

## Actions (User kya kar sakta hai)

- User ID enter karke **Submit** dabana — parent hierarchy aur logs check hona.
- Logs milne par **User Logs Statement** page kholna.

## Data source (technical)

- **API:**
  - `POST /masters` (body: `userid` = company user ki `mstrid`, `page`) — masters/users list (constructor `init()`).
  - `GET /getLogsByUsername` (params: `page`, `username`) — username ke logs; total > 0 hone par button enable hota hai.
  - `POST /getParents` (body: `userId`) — parent hierarchy (`viewParent`).
- **Socket:** koi nahi.
