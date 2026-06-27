# Offers Settings (Agents Offers Setting)

> **Menu path:** Top-bar (header) dropdown → Offers Settings
> **Route:** `/company/offers-settings`
> **Query params:** Koi nahi
> **Component:** `src/app/company/agent-offers-form/agent-offers-form.component.ts` (+ `.html`)
> **Parent page:** Top-bar (header) dropdown (`src/app/company/company.component.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![offers-settings](screenshots/offers-settings.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page company ke **agents ke liye offer** create/update karne ka admin form hai. Yahan se offer ka heading, details, terms aur ek banner image set hoti hai. Yeh wahi offer hai jo agents ko **Agent Offers** page (`agent-offers`) par read-only dikhta hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Agents Offers Setting" (breadcrumb: Dashboard → Offers Setting)
- **Card:** ek "List" ibox jiske andar offer ka form hai.
- **Form fields (sab required jahan note kiya):**
  - **Heading** — textarea (4 rows). Multi-line allowed (har line offer page par alag heading banti hai). Required.
  - **Offer Details** — textarea (4 rows). Multi-line; har line ek list-item ban jaati hai. Required.
  - **Offer Terms** — textarea (4 rows). Multi-line; har line ek term ban jaata hai. Required.
  - **Upload Banner Image** — file input. Offer banner.
- **Buttons:** **Save Offer** (primary). Tab tak disabled jab tak form valid na ho.

> Note: `submitOffer()` tabhi chalta hai jab form valid ho **aur** ek image select ki gayi ho. Form load par existing offer values pre-fill ho jaati hain (heading/details/terms), lekin image dobara select karni padti hai save ke liye.

## Sub-pages (is page ke andar khulne wale pages)

Is page se direct koi sub-page navigate nahi hota. Lekin yeh page jis offer ko set karta hai wahi **Agent Offers** page par display hota hai:

- [Agent Offers](agent-offers.md) — yahan set kiya gaya offer (heading/details/terms/banner) agents ko read-only dikhta hai. Dono `GET /getOffer` se same data padhte hain.

## Actions (User kya kar sakta hai)

- Heading / Offer Details / Offer Terms likhna (multi-line).
- Banner image upload karna.
- **Save Offer** dabakar offer save karna.

## Data source (technical)

- **Load API (GET):** `GET /getOffer` — page open hote hi current offer fetch hota hai aur heading/offerDetails/offerTerms form me patch ho jaate hain (`fetchOffer()`).
- **Save API (POST):** `POST /saveOffer` — `FormData` (multipart) bhejta hai with: `heading`, `offerDetails`, `offerTerms`, `image` (selected file).
- **Loading:** Save aur fetch dono par `dataService.loading` spinner.
- **Socket:** Koi nahi.
