# Manage → Super Stockist (Users List)

> **Menu path:** Sidebar → Manage → Super Stockist
> **Route:** `/company/users`
> **Query params:** `userTypeId=8` (Super Stockist list), optional `userId`, `category`, `actionType`
> **Component:** `src/app/users/users.component.ts` (+ `.html`)
> **Parent page:** koi nahi (top-level Manage page)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![super-stockist-list](screenshots/super-stockist-list.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh **wahi Users list page hai jo Admin me hai**, bas `userTypeId=8` ke saath khulta hai — yaani list **Super Stockist** role par filter ho jaati hai. UI, filters, columns, action buttons, modals aur APIs bilkul same hain.

> Poori detail ke liye dekhein: **[admin.md](admin.md)**. Yahan sirf difference: `userTypeId=8` (Super Stockist), aur Create button "Create Super Stockist" type ke saath.

## Sub-pages (is page ke andar khulne wale pages)

- [user-dashboard.md](user-dashboard.md) — kisi row me User Name par click karne se khulta hai.

## Data source (technical)

- Same as [admin.md](admin.md) — list `POST /masters` (`type=8`).
- **Socket:** koi nahi.
