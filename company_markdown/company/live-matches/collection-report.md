# Collection Report

> **Menu path:** Sidebar → Live Matches → match Title → Agent Match Dashboard → **Collection Report**
> **Route:** `/company/collection-report`
> **Query params:** `matchId`, `matchName`
> **Component:** `src/app/collection-report/collection-report.component.ts` (+ `.html`)
> **Parent page:** [Agent Match Dashboard](agent-match-dashboard.md)
> **Role:** Company (usetype `11`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![collection-report](screenshots/collection-report.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page ek **specific match** ki chip summary do columns me dikhata hai — kis client se **paisa lena hai** (Payment Receiving From / Lena Hai) aur kis client ko **paisa dena hai** (Payment Paid To / Dena Hai). Har column ek table hota hai jisme client ka naam aur uska current balance aata hai, plus footer me total. ("Own", "Cash" aur "Own Commission" rows filter karke hata diye jaate hain.)

> Note: Yeh login user (company, `mstrid`) ki us match ke liye chip summary hai. (Sidebar wala "Collection Report" — route `collection-report-all` — alag page hai jo poore account ki balance teen groups me dikhata hai.)

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** Heading "Matches", breadcrumb: Dashboard → Matches → `{{ matchName }}` → Collection Report.
- **Do columns (ibox cards):**
  - **PAYMENT RECEIVING FROM (Lena Hai)** — data `minusData`.
  - **PAYMENT PAID TO (Dena Hai)** — data `plusData`.
- **Table columns (har card):** Client Name (`mstruserid (mstrname)`), Current Balance (left: `Musum`, right: `PUsum`). Footer me "Total" + amount (`DataService.getTotal`).
- **Inputs / filters / buttons:** Koi nahi — page load par hi data aa jaata hai.
- **Modals / dialogs:** Koi nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Match-wise kis client se lena hai aur kisko dena hai dekhna.
- Har column ka total balance dekhna.

## Data source (technical)

- **API:** `POST /chipSummary` (`mstrid` = login user / company, `matchId`) — response `data.minusData` (Lena Hai) aur `data.plusData` (Dena Hai). Client-side filter: `Own`, `Cash`, `Own  Commission` rows hata diye jaate hain.
- **Socket:** Koi nahi.
