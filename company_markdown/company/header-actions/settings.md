# Settings (Domain Settings)

> **Menu path:** Top-bar (header) dropdown → Settings
> **Route:** `/company/settings`
> **Query params:** Koi nahi
> **Component:** `src/app/company/settings/settings.component.ts` (+ `.html`)
> **Parent page:** Top-bar (header) dropdown (`src/app/company/company.component.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![settings](screenshots/settings.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page company/domain ki branding settings manage karta hai — jaise login page ka headline, alternate URL, aur login banner image. Yahan jo set karte hain wo aapke domain (white-label site) par dikhta hai. Yeh COMPANY panel ka settings page hai (super-duper-admin wala alag hai).

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Domain Settings" (breadcrumb: Dashboard → Domain Settings)
- **Card:** ek "Summary" ibox jisme ek form hai (Formly se generate hota hai).
- **Form fields (default, jab `project != 2`):**
  - **Headline** — text input. Site/login page ka headline.
  - **User Headline** — text input. User-facing headline.
  - **Alternate URL** — text input (eg. `https://xyz.com`).
  - **Login Banner** — file upload (sirf images, `accept="image/*"`).
- **Form fields (jab `project == 2`):** field set thoda alag ho jaata hai:
  - **Mobile Number** — text input.
  - **Headline** — text input.
  - **Alternate URL** — text input (eg. `https://xyz.com`).
  - **Login Banner** — file upload (images only).
- **Buttons:** **Save** (raised, primary). Form valid hone tak disabled rehta hai.

> Note: Component ke andar `mobile / facebook / instagram / telegram / email` jaise extra fields commented out hain — abhi UI me nahi dikhte.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi. Yeh ek single-form settings page hai.

## Actions (User kya kar sakta hai)

- Headline / User Headline / Alternate URL / (project 2 me Mobile) edit karna.
- Login banner image upload karna.
- **Save** dabakar settings server par store karna. Save ke time ek loading spinner chalta hai (`dataService.loading`).

## Data source (technical)

- **Load:** Form ka initial data `authService.domain` se aata hai (model me set hota hai). `project` value `authService.project` se aati hai.
- **Save API (PUT):**
  - Default (`project != 2`): `PUT /domainSettings/{domainId}`
  - Project 2: `PUT /domains/{domainId}`
  - `domainId` = `authService.user.domainId`.
- **Payload:** `FormData` (multipart) — kyunki banner file upload hoti hai. `login_banner` agar string ya empty ho to use blank bhej diya jaata hai (taaki existing image overwrite na ho).
- **Socket:** Koi nahi.
