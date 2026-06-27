# Dashboard

> **Menu path:** Sidebar → Dashboard
> **Route:** `/company/home-dashboard`
> **Query params:** koi nahi
> **Component:** `src/app/home-dashboard/home-dashboard.component.ts` (+ `.html`)
> **Parent page:** koi nahi (yeh login ke baad ka landing page hai)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![dashboard](screenshots/dashboard.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh login ke baad ka Home (landing) screen hai jisme current logged-in Company user ka apna summary dikhta hai — username, level, balance, profit/loss, share aur commission. Yeh sirf read-only display page hai, koi action ya form nahi hota. Company login (usetype=11) ke liye level "Company" aur company contact "Company" dikhega.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Home", breadcrumb me sirf "Home" link.
- **Section "Details"** (cards / ibox row):
  - **MY USERNAME** — `authService.user.mstrname`, niche chhota `authService.user.mstruserid`.
  - **MY LEVEL** — `myLevelName` (usetype se map: 11=Company, 10=Admin, 9=Sub Admin, 8=Super Stockist, 1=Stockist, 2=Agent, 3=Client, baaki=Super Duper Admin). Company login me yeh "Company".
  - **Current Balance** — `authService.user.balance`.
  - **Profit/Loss** — `authService.user.p_l` (negative ho to red `text-danger`, warna green `text-success`).
  - **Company Contact** — `companyContactName` (usetype se map: 11/10=Company, 9=Admin, 8=Sub Admin, 1=Super Stockist, 2=Stockist, 3=Agent, baaki=Super Duper Admin).
  - _(MY FIX LIMIT card code me comment-out hai — abhi dikhta nahi.)_
- **Section "My Share and Company Share"** (paired cards):
  - **Maximum My Match Share** — `partner_cricket %` / **Minimum Company Match Share** — `100 - partner_cricket %`.
  - **Maximum My Casino Share** — `partner_casino %` / **Minimum Company Casino Share** — `100 - partner_casino %`.
  - _(Tennis aur Soccer share cards code me comment-out hain.)_
- **Section "Commission"** (cards — har card tabhi dikhta hai jab uski value > 0 ho ya `usetype == 0`):
  - **Match Odds Commission (To Take)** — `Commission`.
  - **Bookmaker Loss Commission (To Give)** — `rolling_commission`.
  - **Session Win Commission (To Take)** — `SessionComm`.
  - **Session Rolling Commission (To Give)** — `fancy_rolling_commission`.
- **Buttons:** koi nahi (sirf display cards).
- **Table columns:** koi table nahi.
- **Modals / dialogs:** koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi — yeh leaf (read-only) page hai, isme se koi navigation nahi hoti.

## Actions (User kya kar sakta hai)

- Sirf apni summary information dekh sakta hai (view-only page). Koi button/form/edit nahi.

## Data source (technical)

- **API:** Koi direct API call nahi. Saari values `AuthService.user` object se aati hain (jo login/`authService.init()` par load hoti hai). `ngOnInit` me `dataService.loading` flag on/off karke loader manage hota hai.
- **Socket:** koi socket event nahi.
