# Settlement (Settlement Report)

> **Menu path:** Sidebar → All Reports → Settlement
> **Route:** `/company/chip-history?type=3`
> **Query params:** `type=3` (Settlement pre-select karta hai). Agar `type` na ho to default `1` (Ledger) hota hai.
> **Component:** `src/app/chip-history/chip-history.component.ts` (+ `.html`)
> **Parent page:** [All Reports](../all-reports.md)

> **Note:** Yeh standalone `ChipHistoryComponent` hai (`report` component nahi). Company panel (role=11) ke "Settlement" menu item is component ko `type=3` query param ke saath kholta hai. Component `ngOnInit` me `queryParams['type']` padhta hai aur usse filter form ka `type` field set karta hai — `3` ka matlab **Settlement** ledger view. (Verified current source se.)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![settlement](screenshots/settlement.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Coin / chip ledger ko ek select-able "type" ke hisaab se date-wise dikhata hai — Credit, Debit aur Balance ke saath. Settlement menu se aane par `type=3` (Settlement) pre-selected aata hai, yaani sirf settlement entries ka ledger. User chahe to dropdown se Ledger / Commission / Settlement / Credit Limit me switch kar sakta hai, aur apna (Own) ya kisi Super Master (User) ka ledger dekh sakta hai.

## `type` query param kya karta hai

- `type` ka value `filterForm.type` me set hota hai aur API ko `selectType` (Number) ke roop me jaata hai.
- Mapping (Select dropdown): **1 = Ledger**, **2 = Commission**, **3 = Settlement**, **4 = Credit Limit**.
- Settlement menu link `type=3` bhejta hai, isliye page khulte hi "Settlement" selected aur uska ledger load ho jaata hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Settlement Report" heading, breadcrumb: Dashboard → Settlement Report.
- **Sub-heading:** "List".
- **Filters / inputs (filterForm):**
  - **Select** — dropdown: Ledger (1) / Commission (2) / Settlement (3) / Credit Limit (4). `type` query param se pre-select.
  - **From Date** — date picker (default aaj se 10 din pehle).
  - **To Date** — date picker (default aaj).
  - **Own / User** — radio group. "Own" = apna ledger; "User" = kisi Super Master ka ledger.
  - **Select Super Master** — dropdown (`mstrname (mstruserid)`), sirf tab enabled jab "User" selected ho. List `/masters` API se.
- **Buttons:** "Search" (`init(true)` se data fetch), "Reset" (UI button — abhi koi handler bind nahi).
- **Table columns:** #, Date (EDate), Particular (narration), Credit (green), Debit (red), Balance, Revoke (Balance value; `< 0.01` par red, warna green).
- **Loading:** table par spinner. **No data:** table khaali rehta hai (alag "no data" message nahi).
- _(Note: pagination yahan nahi hai — pura result ek baar me aata hai.)_

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- Select (type) dropdown se Ledger / Commission / Settlement / Credit Limit chunna.
- From/To date set karna.
- Own ya User (Super Master) choose karna; User case me Super Master select karna.
- "Search" se ledger fetch karna.

## Data source (technical)

- **API:** `POST /coinLedger` — body: `userId` (Own to self mstrid, warna selected Super Master), `usertype` (corresponding usetype), `selectType` (= filter type 1-4, yahan 3=Settlement), `fromDate`, `toDate`, `filterType: 'ALL'`. Search par extra `fromDate1` / `ToDate1` bhi jate hain. Response `res.data`.
- `POST /masters` — body: `{ userid: <self mstrid> }`. "Select Super Master" dropdown ki list (`value.data`).
- **Socket:** Koi nahi.
