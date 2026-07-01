# Step 8 — Shared Layout Migration

Migrated the Angular shared layout (Header, Sidebar, Footer) plus common loaders,
toasts and shared modals to React. Angular source untouched.

## Components

| Angular | React | Notes |
|---|---|---|
| `HeaderComponent` | `components/layout/Header.tsx` | logo + user info + nav + headline marquee + slide-out `.side-menu` |
| `SidebarComponent` | `components/layout/Sidebar.tsx` | `.left-side-menu` sport list + `.right-bar` user drawer + overlays |
| `FooterComponent` | `components/layout/Footer.tsx` | footer links + social + `.bottom-tabs` mobile bar |
| Loader (image/overlay) | `components/common/GlobalLoader.tsx` + `store/loader.ts` | = Angular `LoaderService.toggle()` |
| Suspense fallback | `components/common/Loader.tsx` | route/lazy loading spinner |
| `ngx-toastr` | `react-toastify` | `ToastContainer` in `main.tsx`, fired by the API interceptor |
| `$('#casinoBalance').modal()` | `components/modals/CasinoTransferModal.tsx` | react-bootstrap |
| `$('#viewOpenBetsModal').modal()` | `components/modals/OpenBetsModal.tsx` | react-bootstrap, row click → `/event/...` |
| change-password modal | `components/modals/ChangePasswordModal.tsx` | react-bootstrap + react-hook-form/zod |
| — | `components/modals/LayoutModals.tsx` | renders modals from one `layoutUi.modal` field |
| `AppLayout` | `components/layout/AppLayout.tsx` | composes the above + `<Outlet/>` |

## How the Angular patterns were converted

- **Bindings → state/hooks.** `userData`, `domain`, `showDeposit` come from the
  **auth store** (`useAuth`); the sports menu from the **sports store**
  (`useSports`, ported `getSport()` mapping). `isSideMenuOpen` → `layoutUi` store.
- **jQuery → React state / Bootstrap APIs.**
  - `$('body').addClass('sidebar-enable'/'right-bar-enabled')` → `layoutUi`
    booleans synced to `<body>` by the declarative **`useBodyClass`** hook (the only
    body touch, state-driven — no imperative DOM poking).
  - `$('#id').modal('show'/'hide')` → **react-bootstrap `<Modal show>`** driven by
    `layoutUi.modal` (`'bets' | 'password' | 'casino' | null`).
  - `.side-menu [class.open]` (already state-driven in Angular) → `sideMenuOpen`.
- **Navigation → React Router.** All `routerLink` → `<Link>`; programmatic
  `router.navigate` (open-bet row → event) → `useNavigate`. Sidebar sport links keep
  the `?sport_id=` query param.
- **No direct DOM manipulation** beyond the controlled `useBodyClass` sync.

## HTML structure & responsiveness

The same key class names are reproduced (`navbar-fixed-top`, `header-user-nm`,
`side-menu`, `left-side-menu`, `#sidebar-menu`, `right-bar`, `user-menus`,
`leftbar-overlay`/`rightbar-overlay`, `footer1`, `bottom-tabs`, `menu__item`, …) so
the **global styles migrated in Step 3** (including the `max-width` breakpoints and
`d-lg-none` bottom tab bar) apply. Mobile vs desktop behaviour is preserved:
hamburger (`d-lg-none`) opens the slide menu; the bottom tab bar shows only below
`lg`; the left/right drawers open via overlays.

## Known visual gaps (documented, not blocking)

- **Component-scoped CSS not migrated.** Each Angular component had its own
  `*.component.css` (header/sidebar/footer) that Step 3 did not migrate (only the
  global `styles.scss`). So fine details (exact drawer slide animation, some
  spacing/colors) differ until those component styles are ported. The **structure
  and class hooks are in place** for that.
- **`assets/img/login/*` not migrated.** The sidebar sport icons and footer social
  images referenced a `assets/img/login/` folder that was not part of the Step-3
  asset copy. Sport icons now point at the migrated `/assets/image/*` set (cricket/
  soccer/tennis exist); social links use Font Awesome glyphs (FA5 is loaded). Bottom
  tab icons use Font Awesome in place of the inline SVGs (same `.bottom-tabs`
  structure).
- **Backend contract.** Modal data calls (`bets?paginate=no`, `changePassword`,
  `casino_balance/*`) use the Adonis endpoint names the Angular app used; against the
  Go backend they 404 (handled by the interceptor) until those `/api/user/*`
  endpoints are built.

## Verification
- `tsc --noEmit` ✅ · `eslint . --max-warnings 0` ✅ · `vitest run` ✅ (54/54;
  4 new layout tests: render header/sidebar/footer/outlet, headline marquee,
  open-bets modal via state, body-class toggle) · `npm run build` ✅.
