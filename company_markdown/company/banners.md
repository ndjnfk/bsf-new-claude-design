# Banners

> **Menu path:** Sidebar → Banners
> **Route:** `/company/banners`
> **Component:** `src/app/banners/banners.component.ts` (+ `banners.component.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![banners](screenshots/banners.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Is page pe company user **homepage ke banners/sliders** ko manage karta hai — naye banner image add karna, existing banner ki image edit karna, aur banner delete karna. Yeh banners front-site (client side) pe domain ke hisaab se dikhte hain.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** "Banners" heading, breadcrumb Dashboard → Banners.
- **Card title:** "List", aur right side me **Add** icon button (`domain_add` icon) — naya banner banane ka modal kholta hai.
- **Table columns:**
  - `Image` — banner ka preview thumbnail (`<img>`, width ~80px, source `d.image`).
  - `Domain` — kis domain ka banner hai (`domain`).
  - `Edit` (header "Action") — edit icon button (banner ki image update karne ka modal).
  - `Delete` — delete icon button (warn color).
- **Loader:** banners fetch hote waqt spinner (`isLoading`).

## Add / Edit modal (manageModal)

- Toolbar title: **Create Banner** (naya) ya **Edit Banner** (jab `model.id` ho).
- **Form field:** `Image` — file input (Formly `type: 'file'`, `accept="image/*"`).
  - **Create mode:** Image **required** hai.
  - **Edit mode:** Image optional (naya file na chunne par sirf id ke saath blank image bhejti hai, yani purani image rehti hai).
- **Save** button — form valid hone par hi enabled.
- Close (X) button modal band karta hai.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi. Add/Edit ek in-page `MatDialog` modal hai; Delete ek `confirm()` dialog se hota hai.

## Actions (User kya kar sakta hai)

- **Naya banner add karna** — Add button → modal → image choose → Save (`manage()` + `save()` → `POST /banner`).
- **Banner edit karna** — Edit icon → modal → nayi image choose (optional) → Save (`PUT /banner/{id}`).
- **Banner delete karna** — Delete icon → confirm → delete (`remove()` → `DELETE /banner/{id}`).

## Data source (technical)

- **API:**
  - `GET /banner` — saare banners ki list.
  - `POST /banner` (multipart `FormData`: `image`) — naya banner create.
  - `PUT /banner/{id}` (multipart `FormData`: `id`, `image` — string/blank ho to image skip) — banner update.
  - `DELETE /banner/{id}` — banner delete.
- **Upload:** Form data `FormData` ke through bhejta hai (image file upload). Global loader `dataService.loading` save/delete ke dauraan active rehta hai.
- **Socket:** koi nahi.
