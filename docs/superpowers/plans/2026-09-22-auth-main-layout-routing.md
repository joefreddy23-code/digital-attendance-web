# Auth & Main Layout Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire nested Auth and Main layout routes so login/forgot-password use the Auth shell and app pages use Main (sidebar + topbar + outlet), with no auth guards.

**Architecture:** Single `app.routes.ts` with two empty-path parent routes (`Auth`, `Main`), each with child page routes. App root is only `<router-outlet />`. Stub login and forgot-password pages under `src/pages/`.

**Tech Stack:** Angular 20 standalone components, `@angular/router`, existing Bootstrap dependency (optional for minimal layout CSS).

**Spec:** `docs/superpowers/specs/2026-09-22-auth-main-layout-routing-design.md`

## Global Constraints

- No auth guards, tokens, or login API
- Eager component imports (no lazy modules)
- Keep stub specs as `should create` smoke tests
- Do not polish full UI; minimal structural layout CSS only
- Do not commit unless the user explicitly asks

---

### Task 1: Auth pages (login + forgot-password stubs)

**Files:**
- Create: `src/pages/login/login.ts`, `login.html`, `login.css`, `login.spec.ts`
- Create: `src/pages/forgot-password/forgot-password.ts`, `forgot-password.html`, `forgot-password.css`, `forgot-password.spec.ts`

**Interfaces:**
- Produces: standalone `Login` and `ForgotPassword` components

- [ ] **Step 1: Create Login page**

`login.ts`:
```ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {}
```

`login.html`:
```html
<h1>Login</h1>
<p>login works!</p>
<p><a routerLink="/forgot-password">Forgot password?</a></p>
<p><a routerLink="/dashboard">Continue to dashboard</a></p>
```

- [ ] **Step 2: Create ForgotPassword page**

Same pattern; selector `app-forgot-password`; class `ForgotPassword`; links back to `/login`.

- [ ] **Step 3: Add `should create` specs** matching `dashboard.spec.ts` pattern.

---

### Task 2: Wire Auth and Main layouts

**Files:**
- Modify: `src/shared/layouts/auth/auth.html`, `auth.ts`
- Modify: `src/shared/layouts/main/main.html`, `main.ts`, `main.css`
- Modify: `src/shared/components/sidebar/sidebar.html`, `sidebar.ts`

**Interfaces:**
- Consumes: `Sidebar`, `Topbar`, `RouterOutlet`, `RouterLink`
- Produces: layouts that render child routes

- [ ] **Step 1: Auth layout** — import `RouterOutlet`; template is a wrapper + `<router-outlet />`.

- [ ] **Step 2: Sidebar** — import `RouterLink`; links for `/dashboard`, `/attendance`, `/employees`, `/locations`, `/reports`.

- [ ] **Step 3: Main layout** — import `Sidebar`, `Topbar`, `RouterOutlet`; template: sidebar + column with topbar + outlet; minimal flex CSS.

---

### Task 3: App routes and root shell

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.html`

- [ ] **Step 1: Replace `app.html` with only `<router-outlet />`.**

- [ ] **Step 2: Implement nested routes** per the design spec (redirect `/` and `**` to `login`; Auth children; Main children).

- [ ] **Step 3: Verify build** with `npx ng build`.

---

## Self-review

- Spec coverage: routes, layouts, new pages, root outlet, sidebar links, temp dashboard link — all tasked.
- No guards (explicitly excluded).
- Commit steps omitted per user commit rule.
