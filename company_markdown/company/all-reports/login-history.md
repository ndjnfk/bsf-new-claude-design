# Login History (Report id=4)

> **Menu path:** Sidebar → All Reports → Login History
> **Route:** `/company/report?id=4`
> **Query params:** `id=4` (required), `userTypeId` _(optional)_, `accTypeId` _(optional)_
> **Component:** `src/app/report/report.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** Yeh wahi shared `report` component hai with `id=4` (Login History). Component ke andar `selectedBetType = '4'`. Mapping: 1=Bet History, 2=Profit & Loss, 3=Account Statement/My Stmt, 4=Login History, 5=Deleted Bet History, 6=Password History. (Company panel, role=11 — verified current source se.)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![login-history](screenshots/login-history.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Selected user ke login records dikhata hai — kab, kis IP/device/browser aur location (city/region/org) se login hua. Yeh `report` component ka `id=4` variant hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Reports" heading, breadcrumb: Dashboard → Reports.
- **Top bar:** Search input + Filter icon button.
- **Report type label:** disabled dropdown "Login History List".
- **Filters / inputs:** Select User, Type dropdown, From Date, To Date, Load button. (Transaction/Account Type aur Match Status yahan nahi dikhte.)
- **Table columns:** #, Date (logstdt), Ip Address (ipadress), User (mstruserid), Device Info, Browser Info, City, Region, Organization (org).
- **Loading:** spinner. **Pagination:** mat-paginator (10/25/50/100). **No data:** "There is no data available."

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- User aur date range set karke "Load" karna.
- Search box se results filter karna (client-side).
- Pagination se page / page-size badalna.

## Data source (technical)

- **API:** `GET /loginHistory` — query params: `page`, `userId`, `from_date`, `to_date`, `limit`.
- `GET /getChild` — Select User list.
- **Socket:** Koi nahi.
