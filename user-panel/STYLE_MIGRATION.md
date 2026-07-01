# Step 3 — Assets & Global Styling Migration

Migrated the Angular global styling + static assets into the React User Panel.
**No individual pages migrated** (per the task); this is foundation only.

## Sources → Targets

| Angular source | React target | Notes |
|---|---|---|
| `src/assets/image/*` (42 files) | `public/assets/image/*` | served at `/assets/image/...` (same URL as Angular) |
| `src/assets/font/OpenSans-*.ttf` | `public/assets/font/*` | referenced by `@font-face` in `src/styles/main.scss` |
| `src/assets/css/pro-styles2.min.css` | `public/assets/css/pro-styles2.min.css` | linked from `index.html`; self-contained (base64), no path edits |
| `src/styles.scss` | `src/styles/main.scss` | **ported verbatim**, imported by `src/main.tsx` |
| `angular.json` styles[] + `index.html` `<head>` | `index.html` + `main.scss` | see below |

### Why `public/assets/` (not `src/assets/`)
Vite serves `public/` at the web root, so every `/assets/...` URL the Angular
templates use keeps working **unchanged** when pages are migrated later. This is the
Vite-compatible, lowest-churn path strategy. (Component-imported, hashed assets via
`src/assets/` would force rewriting every reference — avoided deliberately.)

## What was preserved
- **Colors / theme:** all CSS custom properties — `:root` light theme + `body.bsftheme`
  + `body.shivay99theme` (e.g. `--green #019b48`, `--header-color #1e2a28`,
  `--bg_theme_color`, `--market-row`, filter vars) — copied verbatim.
- **Typography:** `@font-face` Open Sans (Regular/Semibold) → `/assets/font/...`;
  Montserrat (headings) via Google Fonts; body `open sans` 14px/1.428.
- **Responsive breakpoints:** every media query kept byte-for-byte — `min-width: 1328px`,
  `max-width: 1331.98 / 1148.98 / 1080.98 / 991.9 / 767.98 / 574.9 / 354.9 / 316.9px`.
- **Bootstrap 5:** imported via `@import 'bootstrap/scss/bootstrap'` (Sass resolves it
  from `node_modules`). No Bootstrap variable overrides — defaults match Angular.
- **Brand utility classes:** `fs-9…fs-20`, `fw-400/500/600`, `.back`/`.lay`,
  `.lagai_box_color`/`.khai_box_color`, `.suspended_value`, `.blinking-inplay`, etc.

## `index.html` changes (vs Angular)
**Added:** Montserrat (Google Fonts), Font Awesome 5.15.4 (CDN), `pro-styles2.min.css`,
welcome-image `preload`s.
**Dropped (intentionally):**
- `app-root` element → React uses `#root`.
- **jQuery 3.5.1** + **Bootstrap JS bundle** — replaced by **React-Bootstrap** (no
  global `$`/`bootstrap` runtime). Any jQuery behaviour (modals, dropdowns) becomes
  React-Bootstrap components during page migration.
- `Array.prototype.move` polyfill — port to a `src/utils` helper only if a page needs it.

## Dropped assets (dead in production)
- `assets/css/demo.scss` — **not** in `angular.json` `styles[]`, so it never shipped.
- `assets/css/materialdesignicons-webfont.*` — orphaned: the MDI stylesheet `<link>`
  is **commented out** in the Angular `index.html`, `demo.scss` (its only consumer) is
  excluded from the build, and `pro-styles2.min.css` has **0** MDI references. Font
  Awesome 5 is the actual icon set. Re-add via `@mdi/font` later only if a page needs it.

## Angular-specific selectors — identified & documented
The global stylesheet has **no** Angular-only CSS syntax (no `:host`, `::ng-deep`,
`[_ngcontent-*]` — those live in component styles, none of which were migrated yet).
However, these classes/selectors are **structural** — they style DOM produced by Angular
templates that **don't exist yet**, so they're **inert until the matching pages are
built**. Listed here so they're reproduced (same class names) during page migration:

| Selector group | Belongs to (future page/component) |
|---|---|
| `header .top-header`, `header .bottom-header ul li a`, `.header-top`, `.brand-logo` | Header |
| `#sidebar-menu`, `.left-side-menu`, `.left-bar-section ul.nav a`, `.right-bar`, `.right-slider` | Sidebar / right drawer |
| `.bottom-tabs`, `.footmenu`, `.footer1`, `.bot-menupop`, `.footer-content` | Footer / mobile bottom-nav |
| `.bet-table`, `.betting-section`, `.blue-bet`, `.market-title-row`, `.bl-buttons .bl-btn`, `.fancy .lagai_box_color/.khai_box_color`, `.suspended_value` | Event / bet slip |
| `.match-index-row`, `.in-play-row-left/right`, `.top-time-dtl`, `.match-title`, `.blinking-inplay` | Home / In-Play match cards |
| `.account-ui`, `.match-unmatch-table`, `#Macthed-tab` | Account statement / bet history |
| `.withdraw-ui input/select`, `.datepicker-section`, `.filter-btn` | Deposit / Withdraw / filters |
| `.custom-accordion .card h5 a` | Profit-Loss accordion |

**Theme/brand selectors** (applied to `<body>` dynamically by Angular):
`body.bsftheme`, `body.shivay99theme`, `.cric247`, `.theme_color_bsf2020`,
`.theme_color_shivay99`. For now the panel uses the `:root` defaults (no body class);
when multi-tenant theming is wired, toggle the body class as Angular did.

## Verification
- `tsc --noEmit` ✅ · `eslint . --max-warnings 0` ✅ · `vitest run` ✅ (3/3)
- `npm run build` ✅ — no warnings; `dist/assets/{image(42),font(2),css}` emitted;
  CSS bundle 258 kB (gzip 37.6 kB).
