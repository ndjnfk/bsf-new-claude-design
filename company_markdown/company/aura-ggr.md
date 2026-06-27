# Aura GGR

> **Menu path:** Sidebar → Aura GGR
> **Route:** `/company/royal-casino`
> **Component:** `src/app/royal-casino/royal-casino.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![aura-ggr](screenshots/aura-ggr.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page Royal Casino (Aura) ka GGR / profit-loss summary report date range ke hisaab se dikhata hai. Upar overall total (GGR) dikhta hai aur niche date-wise summary table hota hai. Page khulte hi (constructor me) bina filter ke report ek baar load ho jaati hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches" — breadcrumb: Dashboard → Royal Casino Report.
- **Filters / inputs:**
  - `From Date:` — date input (`type=date`, `fromDate`).
  - `To Date:` — date input (`type=date`, `toDate`).
- **Buttons:**
  - `Search` — selected date range ka report fetch karta hai (`royalCasinoReport()`).
- **Summary card:** "Summary" titled card jisme `Total` aur uske aage overall total value (`total`) dikhti hai.
- **Report table columns (`column1`):** `Title` (`Label`), `Date` (`SummaryDate`), `Declared` (hamesha "Yes" hardcoded), `Profit/Loss` (`NetChips`). Ek footer row bhi render hoti hai (blank cells).
- **Modals / dialogs:** Koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- From/To date select karke `Search` se Royal Casino report nikalna.
- Overall total (GGR) dekhna.
- Date-wise profit/loss (NetChips) summary table me dekhna.

## Data source (technical)

- **API:** `GET /royalCasinoReport` (params: `fromDate`, `toDate` — sirf tab bhejte hain jab value set ho). Response `res.royalCasinoReportData` me aata hai.
  - `Label === 'Overall Total'` wali row se `total` (GGR) nikala jaata hai.
  - Baaki rows (Overall Total ke alawa) table me dikhti hain.
- **Socket:** Koi nahi.
