# Auth Login / Forgot Password UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Trigent Auth shell and Login / Forgot Password glass cards to match the approved screenshots, with Bootstrap-responsive layout and no “Keep me signed in” checkbox.

**Architecture:** Auth layout owns the atmospheric background, Bootstrap two-column grid, brand row, route-`data` headline/description, and shared feature list. Login and Forgot Password components render only the right-column glass form cards into `<router-outlet>`.

**Tech Stack:** Angular 20 standalone components, Angular Router (route `data`), Bootstrap 5.3 grid/CSS, Google Fonts (Instrument Serif + DM Sans), CSS custom properties for glass/atmosphere.

**Spec:** `docs/superpowers/specs/2026-09-22-auth-login-ui-design.md`

## Global Constraints

- No “Keep me signed in” checkbox on login.
- Logo: `trigentLogoIcon.png` + white CSS wordmark “TRIGENT” (do not use full logo’s navy text on dark bg).
- Bootstrap owns responsive columns; custom CSS owns atmosphere, glass, typography, accents.
- No auth APIs or guards; Sign In navigates to `/dashboard` for POC only.
- Static marketing copy must match the spec verbatim.
- Prefer existing standalone component patterns under `src/pages/auth/` and `src/shared/layouts/auth/`.

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/styles.css` | Import Bootstrap CSS globally |
| `src/index.html` | Google Fonts + favicon already using Trigent icon |
| `src/app/app.routes.ts` | Attach `headline` / `description` route `data` to auth children |
| `src/shared/layouts/auth/auth.ts` | Bind child route data; import `RouterOutlet` |
| `src/shared/layouts/auth/auth.html` | Shell markup: background, brand, left copy, features, outlet |
| `src/shared/layouts/auth/auth.css` | Atmosphere, brand, features, tokens |
| `src/shared/layouts/auth/auth.spec.ts` | Assert brand + headline binding |
| `src/pages/auth/login/login.ts` | Sign In → `/dashboard` |
| `src/pages/auth/login/login.html` | Glass Sign In card (no keep-signed-in) |
| `src/pages/auth/login/login.css` | Card / field / CTA styles |
| `src/pages/auth/login/login.spec.ts` | Assert card copy + forgot link; no keep-signed-in |
| `src/pages/auth/forgot-password/forgot-password.ts` | Stub submit handler |
| `src/pages/auth/forgot-password/forgot-password.html` | Glass reset card |
| `src/pages/auth/forgot-password/forgot-password.css` | Reuse same card tokens as login |
| `src/pages/auth/forgot-password/forgot-password.spec.ts` | Assert reset copy + back link |

---

### Task 1: Global Bootstrap + fonts

**Files:**
- Modify: `src/styles.css`
- Modify: `src/index.html`
- Test: visual / build (no unit test required for CSS import)

**Interfaces:**
- Consumes: none
- Produces: Bootstrap utilities available app-wide; `--font-brand` / `--font-ui` available via body font-family

- [ ] **Step 1: Import Bootstrap in global styles**

Replace `src/styles.css` with:

```css
@import 'bootstrap/dist/css/bootstrap.min.css';

html,
body {
  height: 100%;
  margin: 0;
}

body {
  font-family: 'DM Sans', system-ui, sans-serif;
}
```

- [ ] **Step 2: Add Google Fonts to `src/index.html`**

Inside `<head>`, after the viewport meta (keep existing favicon), add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Verify serve compiles**

Run: `npx ng build --configuration=development`

Expected: Build succeeds (exit 0). If Bootstrap import path fails, confirm `node_modules/bootstrap` exists (`npm install` if needed).

- [ ] **Step 4: Commit**

```bash
git add src/styles.css src/index.html
git commit -m "chore: add Bootstrap and auth UI fonts"
```

---

### Task 2: Route data for left-panel copy

**Files:**
- Modify: `src/app/app.routes.ts`
- Test: covered by Auth layout tests in Task 3

**Interfaces:**
- Consumes: existing `Login` / `ForgotPassword` route components
- Produces: child routes expose `data.headline: string` and `data.description: string`

- [ ] **Step 1: Add route data to auth children**

Update the Auth children in `src/app/app.routes.ts` to:

```ts
children: [
  {
    path: 'login',
    component: Login,
    data: {
      headline: 'Every shift, verified.',
      description:
        'Employees, locations and compliance reports for the whole workforce.',
    },
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
    data: {
      headline: 'Locked out? Happens.',
      description:
        "Enter the email you sign in with and we'll send a reset link.",
    },
  },
],
```

Leave all other routes unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/app/app.routes.ts
git commit -m "feat: add auth route data for left-panel copy"
```

---

### Task 3: Auth layout shell

**Files:**
- Modify: `src/shared/layouts/auth/auth.ts`
- Modify: `src/shared/layouts/auth/auth.html`
- Modify: `src/shared/layouts/auth/auth.css`
- Modify: `src/shared/layouts/auth/auth.spec.ts`

**Interfaces:**
- Consumes: child route `data.headline`, `data.description`; `RouterOutlet`
- Produces: `headline` / `description` signals (or properties) bound in template; feature list markup; brand using `/trigentLogoIcon.png`

- [ ] **Step 1: Write failing Auth tests**

Replace `src/shared/layouts/auth/auth.spec.ts` with:

```ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Auth } from './auth';

@Component({
  standalone: true,
  template: `<p>child</p>`,
})
class StubChild {}

const testRoutes: Routes = [
  {
    path: '',
    component: Auth,
    children: [
      {
        path: 'login',
        component: StubChild,
        data: {
          headline: 'Every shift, verified.',
          description:
            'Employees, locations and compliance reports for the whole workforce.',
        },
      },
      {
        path: 'forgot-password',
        component: StubChild,
        data: {
          headline: 'Locked out? Happens.',
          description:
            "Enter the email you sign in with and we'll send a reset link.",
        },
      },
    ],
  },
];

describe('Auth', () => {
  let fixture: ComponentFixture<Auth>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [provideRouter(testRoutes)],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Auth);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render brand and login left copy from route data', async () => {
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('TRIGENT');
    expect(text).toContain('Attendance & Compliance');
    expect(text).toContain('Every shift, verified.');
    expect(text).toContain('Employees, locations and compliance reports');
    expect(text).toContain('Employees');
    expect(text).toContain('Locations');
    expect(text).toContain('Reports');

    const logo = fixture.debugElement.query(By.css('img.auth-brand__icon'));
    expect(logo).toBeTruthy();
    expect(logo.nativeElement.getAttribute('src')).toContain('trigentLogoIcon.png');
  });

  it('should swap left copy on forgot-password route', async () => {
    await router.navigateByUrl('/forgot-password');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Locked out? Happens.');
    expect(text).toContain("Enter the email you sign in with");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/auth/auth.spec.ts`

Expected: FAIL (template still says “auth works!” / missing brand).

- [ ] **Step 3: Implement Auth component TypeScript**

Replace `src/shared/layouts/auth/auth.ts` with:

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly features = [
    {
      title: 'Employees',
      detail: 'add, edit and assign roles and sites',
      icon: 'employees',
    },
    {
      title: 'Locations',
      detail: 'approved sites and attendance area',
      icon: 'locations',
    },
    {
      title: 'Reports',
      detail: 'Shops & Establishment export',
      icon: 'reports',
    },
  ] as const;

  private readonly childData$ = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    startWith(null),
    map(() => {
      let child = this.route.firstChild;
      while (child?.firstChild) {
        child = child.firstChild;
      }
      return child?.snapshot.data ?? {};
    }),
  );

  readonly headline = toSignal(
    this.childData$.pipe(map((d) => (d['headline'] as string) ?? '')),
    { initialValue: '' },
  );

  readonly description = toSignal(
    this.childData$.pipe(map((d) => (d['description'] as string) ?? '')),
    { initialValue: '' },
  );
}
```

Note: If `AsyncPipe` is unused after `toSignal`, remove it from `imports`. Prefer the signal version above without `AsyncPipe`.

Final lean imports:

```ts
imports: [RouterOutlet],
```

- [ ] **Step 4: Implement Auth template**

Replace `src/shared/layouts/auth/auth.html` with:

```html
<div class="auth-shell">
  <div class="auth-shell__glow auth-shell__glow--cool" aria-hidden="true"></div>
  <div class="auth-shell__glow auth-shell__glow--warm" aria-hidden="true"></div>

  <div class="container auth-shell__content">
    <div class="row align-items-center g-4 g-lg-5 min-vh-100 py-4 py-lg-0">
      <div class="col-12 col-lg-7">
        <div class="auth-brand mb-4">
          <img
            class="auth-brand__icon"
            src="trigentLogoIcon.png"
            alt=""
            width="40"
            height="40"
          />
          <div class="auth-brand__text">
            <div class="auth-brand__name">TRIGENT</div>
            <div class="auth-brand__tagline">Attendance &amp; Compliance · Admin portal</div>
          </div>
        </div>

        <h1 class="auth-headline">{{ headline() }}</h1>
        <p class="auth-description">{{ description() }}</p>

        <ul class="auth-features list-unstyled mb-0">
          @for (feature of features; track feature.title) {
            <li class="auth-features__item">
              <span class="auth-features__icon" [attr.data-icon]="feature.icon" aria-hidden="true"></span>
              <span class="auth-features__copy">
                <strong>{{ feature.title }}</strong>
                — {{ feature.detail }}
              </span>
            </li>
          }
        </ul>
      </div>

      <div class="col-12 col-lg-5 d-flex justify-content-lg-end">
        <div class="auth-outlet w-100">
          <router-outlet />
        </div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Implement Auth CSS**

Replace `src/shared/layouts/auth/auth.css` with:

```css
:host {
  display: block;
  min-height: 100vh;
  --auth-bg: #070d1a;
  --auth-text: #ffffff;
  --auth-muted: #8b9cb3;
  --auth-accent: #f5a623;
  --auth-glass-bg: rgba(18, 28, 48, 0.55);
  --auth-glass-border: rgba(255, 255, 255, 0.12);
  --auth-input-bg: rgba(10, 18, 35, 0.65);
  --font-brand: 'Instrument Serif', Georgia, serif;
  --font-ui: 'DM Sans', system-ui, sans-serif;
  color: var(--auth-text);
  font-family: var(--font-ui);
}

.auth-shell {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  overflow: hidden;
  background: var(--auth-bg);
}

.auth-shell__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.auth-shell__glow--cool {
  width: min(55vw, 520px);
  height: min(55vw, 520px);
  top: -12%;
  left: -8%;
  background: radial-gradient(circle, rgba(40, 90, 160, 0.55), transparent 70%);
}

.auth-shell__glow--warm {
  width: min(50vw, 480px);
  height: min(50vw, 480px);
  right: -10%;
  bottom: -18%;
  background: radial-gradient(circle, rgba(180, 120, 40, 0.35), transparent 70%);
}

.auth-shell__content {
  position: relative;
  z-index: 1;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.auth-brand__icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.auth-brand__name {
  font-family: var(--font-brand);
  font-size: 1.55rem;
  letter-spacing: 0.12em;
  line-height: 1.1;
  color: var(--auth-text);
}

.auth-brand__tagline {
  margin-top: 0.15rem;
  font-size: 0.8125rem;
  color: var(--auth-muted);
}

.auth-headline {
  margin: 0 0 1rem;
  max-width: 14ch;
  font-size: clamp(2.25rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.auth-description {
  margin: 0 0 2rem;
  max-width: 34ch;
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--auth-muted);
}

.auth-features {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.auth-features__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: var(--auth-muted);
  font-size: 0.95rem;
  line-height: 1.4;
}

.auth-features__item strong {
  color: #c5d0e0;
  font-weight: 600;
}

.auth-features__icon {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  flex-shrink: 0;
  background: rgba(8, 14, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.06);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 0.95rem;
}

.auth-features__icon[data-icon='employees'] {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f5a623' stroke-width='1.8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4.5 19.5a7.5 7.5 0 0115 0'/%3E%3C/svg%3E");
}

.auth-features__icon[data-icon='locations'] {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f5a623' stroke-width='1.8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z'/%3E%3Ccircle cx='12' cy='11' r='2.25'/%3E%3C/svg%3E");
}

.auth-features__icon[data-icon='reports'] {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f5a623' stroke-width='1.8'%3E%3Ccircle cx='12' cy='12' r='7.25'/%3E%3Cpath stroke-linecap='round' d='M12 8v4.5l2.5 1.5'/%3E%3C/svg%3E");
}

.auth-outlet {
  max-width: 420px;
  margin-inline: auto;
}

@media (min-width: 992px) {
  .auth-outlet {
    margin-inline: 0 0 auto;
  }
}
```

- [ ] **Step 6: Run Auth tests — expect PASS**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/auth/auth.spec.ts`

Expected: All Auth specs PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/layouts/auth/auth.ts src/shared/layouts/auth/auth.html src/shared/layouts/auth/auth.css src/shared/layouts/auth/auth.spec.ts
git commit -m "feat: build auth layout shell with route-driven copy"
```

---

### Task 4: Login glass card

**Files:**
- Modify: `src/pages/auth/login/login.ts`
- Modify: `src/pages/auth/login/login.html`
- Modify: `src/pages/auth/login/login.css`
- Modify: `src/pages/auth/login/login.spec.ts`

**Interfaces:**
- Consumes: `Router`, shared visual tokens via duplicated card CSS vars (match Auth tokens)
- Produces: `onSubmit()` navigates to `/dashboard`; template has no keep-signed-in checkbox

- [ ] **Step 1: Write failing Login tests**

Replace `src/pages/auth/login/login.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render welcome card without keep-signed-in', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Welcome back');
    expect(text).toContain('Sign in to the HR admin portal');
    expect(text).toContain('Forgot password?');
    expect(text).not.toContain('Keep me signed in');

    const forgot = fixture.debugElement.query(By.css('a[href="/forgot-password"], a[routerLink="/forgot-password"]'));
    expect(forgot).toBeTruthy();
  });

  it('should navigate to dashboard on submit', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/login/login.spec.ts`

Expected: FAIL on missing welcome copy / form.

- [ ] **Step 3: Implement Login TypeScript**

Replace `src/pages/auth/login/login.ts` with:

```ts
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);

  email = 'pooja@company.com';
  password = '';

  onSubmit(): void {
    void this.router.navigateByUrl('/dashboard');
  }
}
```

- [ ] **Step 4: Implement Login template**

Replace `src/pages/auth/login/login.html` with:

```html
<section class="auth-card">
  <h2 class="auth-card__title">Welcome back</h2>
  <p class="auth-card__subtitle">Sign in to the HR admin portal</p>

  <form class="auth-card__form" (ngSubmit)="onSubmit()">
    <label class="auth-field">
      <span class="auth-field__label">Work email</span>
      <input
        class="auth-field__input"
        type="email"
        name="email"
        [(ngModel)]="email"
        autocomplete="username"
        required
      />
    </label>

    <label class="auth-field">
      <span class="auth-field__label">Password</span>
      <input
        class="auth-field__input"
        type="password"
        name="password"
        [(ngModel)]="password"
        autocomplete="current-password"
        required
      />
    </label>

    <div class="auth-card__row">
      <a class="auth-card__link" routerLink="/forgot-password">Forgot password?</a>
    </div>

    <button class="auth-card__submit" type="submit">Sign In</button>
  </form>
</section>
```

- [ ] **Step 5: Implement Login CSS**

Replace `src/pages/auth/login/login.css` with:

```css
:host {
  display: block;
  width: 100%;
  --auth-text: #ffffff;
  --auth-muted: #8b9cb3;
  --auth-accent: #f5a623;
  --auth-glass-bg: rgba(18, 28, 48, 0.55);
  --auth-glass-border: rgba(255, 255, 255, 0.12);
  --auth-input-bg: rgba(10, 18, 35, 0.65);
  --font-ui: 'DM Sans', system-ui, sans-serif;
  font-family: var(--font-ui);
}

.auth-card {
  width: 100%;
  padding: 1.75rem 1.5rem 1.5rem;
  border-radius: 1rem;
  background: var(--auth-glass-bg);
  border: 1px solid var(--auth-glass-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}

.auth-card__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--auth-text);
}

.auth-card__subtitle {
  margin: 0.35rem 0 1.5rem;
  font-size: 0.95rem;
  color: var(--auth-muted);
}

.auth-card__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.auth-field__label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--auth-muted);
}

.auth-field__input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 0.65rem;
  border: 1px solid var(--auth-glass-border);
  background: var(--auth-input-bg);
  color: var(--auth-text);
  outline: none;
}

.auth-field__input:focus {
  border-color: rgba(245, 166, 35, 0.55);
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.15);
}

.auth-card__row {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.25rem;
}

.auth-card__link {
  color: var(--auth-accent);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
}

.auth-card__link:hover {
  text-decoration: underline;
}

.auth-card__submit {
  margin-top: 0.35rem;
  width: 100%;
  border: 0;
  border-radius: 0.65rem;
  padding: 0.85rem 1rem;
  background: var(--auth-accent);
  color: #0b1220;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.auth-card__submit:hover {
  filter: brightness(1.05);
}
```

- [ ] **Step 6: Run Login tests — expect PASS**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/login/login.spec.ts`

Expected: All Login specs PASS. If `a[routerLink=...]` query fails, assert via `By.css('a.auth-card__link')` and `routerLink` attribute presence instead.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/login/login.ts src/pages/auth/login/login.html src/pages/auth/login/login.css src/pages/auth/login/login.spec.ts
git commit -m "feat: add login glass card matching auth UI"
```

---

### Task 5: Forgot-password glass card

**Files:**
- Modify: `src/pages/auth/forgot-password/forgot-password.ts`
- Modify: `src/pages/auth/forgot-password/forgot-password.html`
- Modify: `src/pages/auth/forgot-password/forgot-password.css`
- Modify: `src/pages/auth/forgot-password/forgot-password.spec.ts`

**Interfaces:**
- Consumes: `RouterLink`, same card CSS language as Login
- Produces: `onSubmit()` no-op (prevent default only); back link to `/login`

- [ ] **Step 1: Write failing ForgotPassword tests**

Replace `src/pages/auth/forgot-password/forgot-password.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render reset card and back link', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Reset your password');
    expect(text).toContain("We'll email you a link to set a new one");
    expect(text).toContain('Remembered it?');
    expect(text).toContain('Back to sign in');

    const back = fixture.debugElement.query(By.css('a.auth-card__back'));
    expect(back).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/forgot-password/forgot-password.spec.ts`

Expected: FAIL on missing reset copy.

- [ ] **Step 3: Implement ForgotPassword TypeScript**

Replace `src/pages/auth/forgot-password/forgot-password.ts` with:

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  email = 'pooja@company.com';

  onSubmit(): void {
    // Static UI only — no API in this POC
  }
}
```

- [ ] **Step 4: Implement ForgotPassword template**

Replace `src/pages/auth/forgot-password/forgot-password.html` with:

```html
<section class="auth-card">
  <h2 class="auth-card__title">Reset your password</h2>
  <p class="auth-card__subtitle">We'll email you a link to set a new one</p>

  <form class="auth-card__form" (ngSubmit)="onSubmit()">
    <label class="auth-field">
      <span class="auth-field__label">Work email</span>
      <input
        class="auth-field__input"
        type="email"
        name="email"
        [(ngModel)]="email"
        autocomplete="username"
        required
      />
    </label>

    <button class="auth-card__submit" type="submit">Submit</button>
  </form>

  <p class="auth-card__footer">
    Remembered it?
    <a class="auth-card__back" routerLink="/login">Back to sign in</a>
  </p>
</section>
```

- [ ] **Step 5: Implement ForgotPassword CSS**

Copy the same rules from `src/pages/auth/login/login.css` into `src/pages/auth/forgot-password/forgot-password.css`, then append:

```css
.auth-card__footer {
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--auth-muted);
}

.auth-card__back {
  margin-left: 0.25rem;
  color: var(--auth-text);
  font-weight: 700;
  text-decoration: none;
}

.auth-card__back:hover {
  color: var(--auth-accent);
}
```

- [ ] **Step 6: Run ForgotPassword tests — expect PASS**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/forgot-password/forgot-password.spec.ts`

Expected: All specs PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/forgot-password/forgot-password.ts src/pages/auth/forgot-password/forgot-password.html src/pages/auth/forgot-password/forgot-password.css src/pages/auth/forgot-password/forgot-password.spec.ts
git commit -m "feat: add forgot-password glass card matching auth UI"
```

---

### Task 6: End-to-end verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: all prior tasks
- Produces: confirmation against success criteria in the spec

- [ ] **Step 1: Run focused unit tests together**

Run:

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/auth/auth.spec.ts --include=src/pages/auth/login/login.spec.ts --include=src/pages/auth/forgot-password/forgot-password.spec.ts
```

Expected: All PASS.

If multiple `--include` is unsupported by the local CLI, run the three commands from Tasks 3–5 sequentially.

- [ ] **Step 2: Build**

Run: `npx ng build --configuration=development`

Expected: exit 0.

- [ ] **Step 3: Manual UI check**

Run: `npx ng serve` and verify:

1. `/login` — navy glows, brand icon, “Every shift, verified.”, features, glass card, **no** keep-signed-in, Forgot password link works.
2. `/forgot-password` — “Locked out? Happens.” left copy, reset card, Back to sign in works.
3. Narrow the viewport below `lg` — columns stack (Bootstrap).
4. Sign In lands on `/dashboard`.

- [ ] **Step 4: Final commit only if Step 3 required polish fixes**

If polish edits were needed, commit them with a message like:

```bash
git add -u
git commit -m "fix: polish auth login UI to match screenshot"
```

Otherwise skip.

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Auth owns background, grid, brand, features | Task 3 |
| Left copy from route `data` | Tasks 2–3 |
| Login / forgot cards only in outlet | Tasks 4–5 |
| Bootstrap responsive columns | Task 3 template |
| Bootstrap imported globally | Task 1 |
| No keep-signed-in | Task 4 |
| Logo icon + white TRIGENT wordmark | Task 3 |
| Sign In → `/dashboard` | Task 4 |
| Forgot ↔ login links | Tasks 4–5 |
| Fonts / tokens / glass | Tasks 1, 3–5 |
| Manual + unit verification | Task 6 |
