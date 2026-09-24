# Auth & Main Layout Routing Design

**Date:** 2026-09-22  
**Status:** Approved for implementation planning  
**Scope:** Layout shells, page stubs, and nested Angular routes (no auth guards)

## Goal

Wire the app so unauthenticated screens (login, forgot password) use the Auth layout, and post-login app screens use the Main layout (sidebar + topbar + page content). Navigation between these areas is driven by the router only; real authentication is out of scope.

## Decisions

| Decision | Choice |
|----------|--------|
| Route structure | Nested layout routes in a single `app.routes.ts` |
| Auth enforcement | None for now (layout routing only) |
| Login / forgot password location | `src/pages/login/`, `src/pages/forgot-password/` |
| Default URL | `/` redirects to `/login` |
| Unknown URLs | `**` redirects to `/login` |

## Route tree

```
/                    → redirectTo: 'login'
/login               → Auth layout → Login page
/forgot-password     → Auth layout → Forgot password page

/dashboard           → Main layout → Dashboard
/attendance          → Main layout → Attendance
/employees           → Main layout → Employees
/locations           → Main layout → Locations
/reports             → Main layout → Reports

/**                  → redirectTo: 'login'
```

### Example `app.routes.ts` shape

```ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '',
    component: Auth,
    children: [
      { path: 'login', component: Login },
      { path: 'forgot-password', component: ForgotPassword },
    ],
  },
  {
    path: '',
    component: Main,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'attendance', component: Attendance },
      { path: 'employees', component: Employees },
      { path: 'locations', component: Locations },
      { path: 'reports', component: Reports },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
```

Eager component imports are fine for this POC; lazy loading can be added later.

## Layouts

### Auth layout (`src/shared/layouts/auth`)

- Shell for unauthenticated pages only.
- Template: minimal wrapper + `<router-outlet />`.
- Does **not** include sidebar or topbar.
- No login business logic in the layout.

### Main layout (`src/shared/layouts/main`)

- Shell for authenticated-area pages.
- Template composition:
  - `app-sidebar`
  - `app-topbar`
  - content area with `<router-outlet />`
- Imports `Sidebar` and `Topbar` as standalone components.
- Minimal structural CSS so the shell is usable (sidebar beside content); visual polish is out of scope.

## Pages

### Existing (wire as Main children)

- `src/pages/dashboard`
- `src/pages/attendance`
- `src/pages/employees`
- `src/pages/locations`
- `src/pages/reports`

### New stubs (Auth children)

Create with the same Angular standalone pattern as existing pages:

- `src/pages/login/` — `login.ts`, `login.html`, `login.css`, `login.spec.ts`
- `src/pages/forgot-password/` — `forgot-password.ts`, `forgot-password.html`, `forgot-password.css`, `forgot-password.spec.ts`

Stub content is enough (title + placeholder text), plus:

- Links between login ↔ forgot-password
- A temporary “Continue to dashboard” link on login for manual navigation testing (no real auth)

## App root

- `app.html` should contain only `<router-outlet />` (remove Angular CLI starter placeholder).
- `app.ts` continues to import `RouterOutlet` only.

## Sidebar navigation (minimal)

Update sidebar stub to use `routerLink` entries for Main children so layout switching and child navigation can be verified:

- Dashboard → `/dashboard`
- Attendance → `/attendance`
- Employees → `/employees`
- Locations → `/locations`
- Reports → `/reports`

No active-route styling required beyond basic links.

## Out of scope

- Auth guards, interceptors, tokens, or login API
- Real form validation / submit behavior
- Polished UI/UX for login, sidebar, or topbar
- Lazy-loaded feature route modules
- Role-based access

## Future hook (not implementing now)

Guards can later wrap the Main parent route and redirect unauthenticated users to `/login` without changing the route tree shape.

## Success criteria

1. Visiting `/` lands on login under Auth layout (no sidebar/topbar).
2. `/forgot-password` uses the same Auth layout.
3. Visiting `/dashboard` (and other Main children) shows sidebar + topbar + page content.
4. Navigating between Main children keeps the Main layout mounted.
5. Navigating to an unknown path redirects to `/login`.
6. App builds successfully with the new routes and stubs.
