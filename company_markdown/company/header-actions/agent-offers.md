# Agent Offers

> **Menu path:** Top-bar (header) → blinking "Agent Offer" badge button (sidebar header me, `user.usetype != 0` hone par dikhta hai)
> **Route:** `/company/agent-offers`
> **Query params:** Koi nahi
> **Component:** `src/app/agent-offers/agent-offers.component.ts` (+ `.html`)
> **Parent page:** Top-bar (header) — `src/app/_components/sidebar/sidebar.component.html`

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![agent-offers](screenshots/agent-offers.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page agents ko company ka current **offer** read-only dikhata hai — banner image, heading(s), offer details aur offer terms. Yeh sirf display page hai; yahan kuch edit/create nahi hota. Offer ki actual setting [Offers Settings](offers-settings.md) page se hoti hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Agents" (breadcrumb: Dashboard → Offers). Page tabhi render hota hai jab `offer` data mil jaaye (`*ngIf="offer"`).
- **Banner:** poori width ki offer banner image (`offer.imageUrl`).
- **Heading block:** center-aligned `<h4>` lines — `offer.heading` ko newline par split karke har line alag heading.
- **Offer Details:** "Offer Details:" heading ke neeche numbered list (`<ol>`), har line ek item.
- **Offer Terms:** "Offer Terms:" heading ke neeche numbered list (`<ol>`), har line ek term.
- **Buttons / actions:** Koi nahi — purely read-only.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Entry point (yeh page kahan se khulta hai)

- **Sidebar header me blinking "Agent Offer" badge button** se khulta hai. Yeh button do jagah hai (mobile/desktop variant) aur dono `routerLink="agent-offers"` use karte hain, condition `user.usetype != 0` par. Reference: `src/app/_components/sidebar/sidebar.component.html` (lines ~16 aur ~33).
- Route har major panel ke routing module me registered hai (company, dealer, master, sub-admin, super-master, super-admin, super-duper-admin), to jis panel me logged-in user hai wahan se khulta hai.
- Header dropdown (`company.component.html`) me iska direct link nahi hai — wahan sirf Change Password / Settings / Offers Settings hai. Agent Offer ka link sidebar/top header ke blinking badge se aata hai.

## Actions (User kya kar sakta hai)

- Sirf offer padh sakta hai (banner, heading, details, terms). Koi edit/save action nahi.

## Data source (technical)

- **Load API (GET):** `GET /getOffer` — `fetchOffer()` page open hote hi call karta hai. Response me `imageUrl`, `heading`, `offerDetails`, `offerTerms` aate hain.
- **Processing:** `heading`, `offerDetails`, `offerTerms` ko `\n` par split karke aur empty lines filter karke arrays banaye jaate hain (`offerheadingList`, `offerDetailsList`, `offerTermsList`).
- **Loading:** `dataService.loading` spinner fetch ke dauraan.
- **Socket:** Koi nahi.

> Note: Yeh wahi `GET /getOffer` data hai jo [Offers Settings](offers-settings.md) (`POST /saveOffer`) se set hota hai.
