# Manage Password

> **Menu path:** Sidebar → Manage Password
> **Route:** `/company/change-password`
> **Component:** `src/app/change-password/change-password.component.ts` (+ `.html`)

## 📸 Screenshot

<!-- TODO: Is page ka live UI screenshot yahan lagana hai. File ko screenshots/ folder me daalein. -->
![manage-password](screenshots/manage-password.png)

> _Screenshot pending — placeholder. Live site se screenshot lekar upar wali image replace kar dein._

## Page kya karta hai (Purpose)

Yeh page logged-in **company (role 11)** user ko apna khud ka login password change karne deta hai. Agar user **helper (usetype 55)** hai to pehle ek **Security Question** verify karni padti hai, uske baad hi Change Password form dikhta hai. Baaki sabhi users (company sahit) ke liye seedha Change Password form aa jaata hai.

## Screen pe kya dikhta hai (UI Layout)

- **Title / breadcrumb:** `isVerified` true hone par "Change Password", warna "Security Question". Breadcrumb: Dashboard → (Change Password / Security Question).
- **Security Question section** (jab `isVerified == false`, yaani helper usetype 55):
  - Question text (`user.question`)
  - **Enter Answer** input (`answer`)
  - **Submit** button (`verifyAnswer`, answer khaali ho to disabled)
- **Change Password section** (jab `isVerified == true`):
  - **OLD PASSWORD** — `oldpass` (type=password)
  - **NEW PASSWORD** — `newpass` (type=password)
  - **CONFIRM PASSWORD** — `renewpass` (type=password, input par `checkPass()` validate hota hai)
  - Error message line (red, center) — `errorMsg` (field missing ya new ≠ confirm hone par)
  - **Save Changes** button — sirf `enableSubmit == true` (yaani new == confirm) hone par enabled.
- **Modals / dialogs:** koi nahi.
- **Table columns:** koi table nahi.

## Sub-pages (is page ke andar khulne wale pages)

Koi sub-page nahi.

## Actions (User kya kar sakta hai)

- (Helper) Security question ka answer dekar verify karna (`verifyAnswer`).
- Old / New / Confirm password bharna; new == confirm hone par hi Save enable hota hai.
- **Save Changes** — password change. Success par:
  - Agar `authService.user.password_changed == 0` ho to `DataService.logout()` (force re-login).
  - Warna user ke `usetype` ke hisaab se role-wise dashboard par redirect. Company user ka `usetype == 11` hota hai, to woh `/company` par redirect hota hai. (Baaki: 0→super-duper-admin, 10→super-admin, 9→sub-admin, 8→super-master, 1→master, 2→dealer, 55→helper.)

## Data source (technical)

- **API:** `POST /verifyAnswer` (security question verify), `POST /changePassword` (body: `old_password`, `newpassword`, `Renewpassword`).
- User info `AuthService.user` se; success par role-wise router navigate ya `DataService.logout()`.
- **Socket:** koi nahi.
