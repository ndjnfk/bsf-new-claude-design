# Log User Details (User Logs Statement)

> **Menu path:** Sidebar → Search Logs User → (User Logs Statement button)
> **Route:** `/company/logs-user-details/:id`
> **Component:** `src/app/search-logs-user/logs-user-details/logs-user-details.component.ts` (+ `.html`)
> **Parent page:** [Search Logs User](search-logs-user.md)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![log-user-details](screenshots/log-user-details.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page ek selected user ki poori **logs statement** dikhata hai — har bet/transaction par match, market, selection, side, price, log type, type, date, aur balance/liability ke before/after values. User ID route ke `:id` param se aata hai. Page par yeh data PDF me bhi download kiya jaa sakta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** heading "DASHBOARD", breadcrumb: Dashboard → Search User.
- **Section card:** "Block Sports" (heading text aisa hi hai code me).
- **Buttons:** **Download PDF** (`downloadPDF`) — jsPDF + autoTable se landscape PDF banata hai (filename `user_log_statement<timestamp>.pdf`).
- **Table columns:** #, Match Name, Market Name, Selection Name, Side (`betType`), Price (`volume`), Log Type, Type, Date, Balance, Before Balance, After Balance, Liability, Before Liability, After Liability.
- **Pagination:** mat-paginator — page size options 10/25/50/100, default 50.
- **Modals / dialogs:** koi nahi.

> Note: PDF wali table me Side/Price columns nahi hote (sirf 12 columns: Match/Market/Selection Name, Log Type, Type, Date, Balance, Before/After Balance, Liability, Before/After Liability).

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Logs statement table dekhna (read-only).
- Pagination se page aur page-size badalna (`getLogs`).
- **Download PDF** se poori statement PDF me save karna.

## Data source (technical)

- **API:** `GET /getLogsByUsername` (params: `page`, `limit`, `username` — route ke `:id` se uppercase). Response: `data`, `meta.total`, `meta.perPage`.
- **Socket:** koi nahi.
