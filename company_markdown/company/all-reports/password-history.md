# Password History (Report id=6)

> **Menu path:** Sidebar → All Reports → Password History
> **Route:** `/company/report?id=6`
> **Query params:** `id=6` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** Yeh wahi shared `report` component hai with `id=6` (Password History). Component ke andar `selectedBetType = '6'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified current source se.)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![password-history](screenshots/password-history.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Selected user ki password change history dikhata hai — kis user ka password kab aur kisne (changer) change kiya, kis IP se. Yeh `report` component ka `id=6` variant hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Password History List".
- **Filters / inputs:** Select User, Type dropdown, From Date, To Date, Load button. (Transaction/Account Type aur Match Status yahan nahi dikhte.)
- **Table columns:** #, Username, Changer Name (changername), IP, Date (created_at).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- User aur date range set karke "Load" karna.
- Pagination se page / page-size badalna.
- _(Note: id=6 table par client-side search box apply nahi hota — table seedha `data` par bind hai.)_

## Data source (technical)

- **API:** `GET /passwordHistory` — query params: `page`, `userId`, `from_date`, `to_date`, `limit`. (Response `res.data.data` + `res.data.meta` structure me aata hai.)
- `GET /getChild` — Select User list.
- **Socket:** Koi nahi.
