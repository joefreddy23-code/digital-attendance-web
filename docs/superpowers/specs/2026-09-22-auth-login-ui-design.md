# Auth Login / Forgot Password UI Design

**Date:** 2026-09-22  
**Status:** Approved for implementation planning  
**Scope:** Visual Auth shell + Login and Forgot Password form cards (static UI; no real authentication APIs)

## Goal

Match the provided Trigent Attendance & Compliance admin portal screenshots for `/login` and `/forgot-password`: shared dark atmospheric Auth layout, page-specific left copy, and glassmorphism form cards on the right. Use Bootstrap 5 for the responsive grid.

## Decisions

| Decision | Choice |
|----------|--------|
| Layout ownership | Auth layout owns shared chrome; child pages own only the right glass form card |
| Left headline / description | Driven by Angular route `data` on login and forgot-password routes |
| Feature list | Shared in Auth layout (identical on both screens) |
| Logo | `public/trigentLogoIcon.png` + white CSS wordmark “TRIGENT” (full logo has navy text unsuitable on dark bg) |
| Responsiveness | Bootstrap 5 grid (`container` / `row` / `col-*`) |
| Keep me signed in | **Omitted** — not required |
| Auth APIs / guards | Out of scope |
| Sign In POC behavior | Navigate to `/dashboard` on submit (routing only) |

## Architecture

```
Auth layout
├── Atmospheric background (navy + cool/warm radial glows)
├── Bootstrap row
│   ├── Left column (col-lg-6 / col-lg-7)
│   │   ├── Brand: icon + TRIGENT + portal tagline
│   │   ├── Headline + description (from activated child route data)
│   │   └── Feature list (Employees / Locations / Reports)
│   └── Right column (col-lg-6 / col-lg-5)
│       └── <router-outlet /> → Login or ForgotPassword glass card
```

### Route data

```ts
{ path: 'login', component: Login, data: {
  headline: 'Every shift, verified.',
  description: 'Employees, locations and compliance reports for the whole workforce.',
}}

{ path: 'forgot-password', component: ForgotPassword, data: {
  headline: 'Locked out? Happens.',
  description: "Enter the email you sign in with and we'll send a reset link.",
}}
```

Auth layout reads the activated child route’s `data` (via `Router` / `ActivatedRoute`) and binds headline + description in the left text container.

## Visual system

CSS custom properties on the Auth layout (or scoped auth styles):

| Token | Role | Approx value |
|-------|------|----------------|
| `--auth-bg` | Base navy | `#070d1a` |
| `--auth-glow-cool` | Top-left blue bloom | soft radial `#1a3a6b` |
| `--auth-glow-warm` | Bottom-right amber bloom | soft radial amber / `#3d2a12` |
| `--auth-text` | Primary text | `#ffffff` |
| `--auth-muted` | Tagline, body, labels | `#8b9cb3` |
| `--auth-accent` | CTA, links, icons | `#f5a623` / `#f9b03d` |
| `--auth-glass-bg` | Form card | `rgba(18, 28, 48, 0.55)` + `backdrop-filter: blur(16px)` |
| `--auth-glass-border` | Card / input border | `rgba(255,255,255,0.12)` |
| `--auth-input-bg` | Field fill | `rgba(10, 18, 35, 0.65)` |

### Typography

- Load Google Fonts in `index.html` (or styles): a serif for brand wordmark (e.g. Instrument Serif) and a clean sans for UI (e.g. DM Sans).
- Brand “TRIGENT”: serif, white, tracked uppercase.
- Portal tagline: ~13px muted sans — `Attendance & Compliance · Admin portal`.
- Left headline: ~42–48px bold white sans.
- Left body: ~16px muted.
- Feature rows: ~14px muted; leading label can be slightly brighter.
- Card title: ~22px bold white; subtitle muted.
- Field labels: ~11px uppercase tracked muted.
- CTA: ~15px bold dark text on accent fill.

### Shared left feature list

Each row: accent icon in a dark circle + text:

1. **Employees** — add, edit and assign roles and sites  
2. **Locations** — approved sites and attendance area  
3. **Reports** — Shops & Establishment export  

Use simple inline SVG icons (user, pin, clock) tinted with `--auth-accent`.

## Forms

### Login (`src/pages/auth/login`)

Glass card contents only:

- Title: “Welcome back”
- Subtitle: “Sign in to the HR admin portal”
- WORK EMAIL input (placeholder `pooja@company.com`)
- PASSWORD input (password type)
- Row: “Forgot password?” link (accent color) aligned end → `/forgot-password`  
  *(no “Keep me signed in” checkbox)*
- Full-width accent “Sign In” button → navigates to `/dashboard` for POC

### Forgot password (`src/pages/auth/forgot-password`)

Glass card contents only:

- Title: “Reset your password”
- Subtitle: “We'll email you a link to set a new one”
- WORK EMAIL input (placeholder `pooja@company.com`)
- Full-width accent “Submit” button (no API; can no-op or show static success later)
- Footer: “Remembered it? **Back to sign in**” → `/login`

## Bootstrap / responsiveness

- Ensure Bootstrap CSS is imported globally (e.g. `@import 'bootstrap/dist/css/bootstrap.min.css';` in `src/styles.css`). Bootstrap is already a dependency (`bootstrap@^5.3.8`).
- Auth shell uses Bootstrap grid for column stacking:
  - `lg` and up: two columns side by side
  - below `lg`: stack branding column then form card
- Custom CSS owns atmosphere, glass, typography, and accents — not the responsive column breakpoints.

## Files to touch

| File | Change |
|------|--------|
| `src/styles.css` | Import Bootstrap; optional global font base |
| `src/index.html` | Google Fonts link(s) |
| `src/shared/layouts/auth/auth.{html,css,ts}` | Full Auth shell UI + route-data binding |
| `src/pages/auth/login/login.{html,css,ts}` | Glass Sign In card |
| `src/pages/auth/forgot-password/forgot-password.{html,css,ts}` | Glass Reset card |
| `src/app/app.routes.ts` | Add `data` for headline/description on auth child routes |
| Specs under `*.spec.ts` | Smoke updates if templates break existing “works!” assertions |

## Out of scope

- Real login / password-reset API integration
- Form validation libraries / error states beyond native HTML if needed
- Auth guards
- Pixel-perfect mobile redesign beyond Bootstrap stacking + readable spacing
- “Keep me signed in” checkbox

## Success criteria

1. `/login` visually matches the login screenshot (layout, copy, glass card, no keep-signed-in checkbox).
2. `/forgot-password` shows the same shell with its left copy and reset card.
3. Layout stacks cleanly on narrow viewports via Bootstrap columns.
4. Trigent icon from `public/` is used in the brand row.
5. Forgot-password ↔ login links navigate correctly; Sign In reaches `/dashboard`.
