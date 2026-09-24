# Auth Reactive Forms Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Login and Forgot Password to Angular Reactive Forms with submit-time validation and inline errors, and replace email with Employee ID on both screens.

**Architecture:** Each auth page owns its own `FormGroup`. Errors show only after submit via a `submitted` flag. Login navigates to `/dashboard` only when valid; Forgot Password remains a static no-op on valid submit. Route `data.description` for forgot-password is updated to Employee ID copy.

**Tech Stack:** Angular 20 standalone components, `@angular/forms` ReactiveFormsModule / FormBuilder / Validators, Jasmine + Karma (`ng test`).

**Spec:** `docs/superpowers/specs/2026-09-24-auth-reactive-forms-validation-design.md`

## Global Constraints

- Use Reactive Forms (`ReactiveFormsModule`), not `ngModel` / `FormsModule`.
- Employee ID: `Validators.required` only; message `Employee ID is required`.
- Password: required + `minLength(8)` + pattern `/^(?=.*[A-Za-z])(?=.*\d).+$/`.
- Password messages: `Password is required` | `Password must be at least 8 characters` | `Password must include at least one letter and one number` (priority: required → minlength → pattern).
- Show errors only after submit (`submitted && control.invalid`).
- No auth APIs or guards; valid login → `/dashboard`; valid forgot-password → no-op.
- Prefer existing standalone patterns under `src/pages/auth/`.

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/pages/auth/login/login.ts` | Login `FormGroup`, validators, `submitted`, gated navigate |
| `src/pages/auth/login/login.html` | Reactive form + Employee ID/password + inline errors |
| `src/pages/auth/login/login.css` | Error text + invalid input border |
| `src/pages/auth/login/login.spec.ts` | Validation + navigate-on-valid tests |
| `src/pages/auth/forgot-password/forgot-password.ts` | Forgot `FormGroup`, required Employee ID |
| `src/pages/auth/forgot-password/forgot-password.html` | Reactive form + copy + error |
| `src/pages/auth/forgot-password/forgot-password.css` | Error styles |
| `src/pages/auth/forgot-password/forgot-password.spec.ts` | Copy + required validation tests |
| `src/app/app.routes.ts` | Forgot-password left-panel description (Employee ID) |
| `src/shared/layouts/auth/auth.spec.ts` | Assert updated left-panel description |

---

### Task 1: Login Reactive Forms + validation

**Files:**
- Modify: `src/pages/auth/login/login.spec.ts`
- Modify: `src/pages/auth/login/login.ts`
- Modify: `src/pages/auth/login/login.html`
- Modify: `src/pages/auth/login/login.css`

**Interfaces:**
- Consumes: none
- Produces:
  - `Login.form: FormGroup` with controls `employeeId`, `password`
  - `Login.submitted: boolean`
  - `Login.showError(name: 'employeeId' | 'password'): boolean`
  - `Login.passwordErrorMessage(): string | null`
  - `Login.onSubmit(): void` — navigates `/dashboard` only if `form.valid`

- [ ] **Step 1: Rewrite failing Login specs for reactive validation**

Replace `src/pages/auth/login/login.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let router: Router;
  let component: Login;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render welcome card without keep-signed-in', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Welcome back');
    expect(text).toContain('Sign in to the HR admin portal');
    expect(text).toContain('Forgot password?');
    expect(text).toContain('Employee ID');
    expect(text).not.toContain('Keep me signed in');

    const forgot = fixture.debugElement.query(
      By.css('a[href="/forgot-password"], a[routerLink="/forgot-password"]'),
    );
    expect(forgot).toBeTruthy();
  });

  it('should show required errors on empty submit and not navigate', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Employee ID is required');
    expect(text).toContain('Password is required');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show password length and strength errors', () => {
    component.form.setValue({ employeeId: 'E001', password: 'short' });
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Password must be at least 8 characters',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    component.form.setValue({ employeeId: 'E001', password: 'longenough' });
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Password must include at least one letter and one number',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should navigate to dashboard on valid submit', () => {
    component.form.setValue({ employeeId: 'E001', password: 'Password1' });
    component.onSubmit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
```

- [ ] **Step 2: Run Login specs — expect failures**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/login/login.spec.ts`

Expected: FAIL (missing `form` / Employee ID errors / empty submit still navigates).

- [ ] **Step 3: Implement Login component**

Replace `src/pages/auth/login/login.ts` with:

```ts
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  submitted = false;

  readonly form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  showError(controlName: 'employeeId' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return this.submitted && control.invalid;
  }

  passwordErrorMessage(): string | null {
    if (!this.showError('password')) {
      return null;
    }
    const control = this.form.controls.password;
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    if (control.hasError('pattern')) {
      return 'Password must include at least one letter and one number';
    }
    return null;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
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

  <form class="auth-card__form" [formGroup]="form" (ngSubmit)="onSubmit()">
    <label class="auth-field">
      <span class="auth-field__label">Employee ID</span>
      <input
        class="auth-field__input"
        [class.auth-field__input--invalid]="showError('employeeId')"
        type="text"
        formControlName="employeeId"
        autocomplete="username"
      />
      @if (showError('employeeId')) {
        <span class="auth-field__error">Employee ID is required</span>
      }
    </label>

    <label class="auth-field">
      <span class="auth-field__label">Password</span>
      <input
        class="auth-field__input"
        [class.auth-field__input--invalid]="showError('password')"
        type="password"
        formControlName="password"
        autocomplete="current-password"
      />
      @if (passwordErrorMessage(); as message) {
        <span class="auth-field__error">{{ message }}</span>
      }
    </label>

    <div class="auth-card__row">
      <a class="auth-card__link" routerLink="/forgot-password">Forgot password?</a>
    </div>

    <button class="auth-card__submit" type="submit">Sign In</button>
  </form>
</section>
```

- [ ] **Step 5: Add error styles to Login CSS**

Append to `src/pages/auth/login/login.css`:

```css
.auth-field__input--invalid {
  border-color: rgba(232, 93, 93, 0.75);
}

.auth-field__input--invalid:focus {
  border-color: rgba(232, 93, 93, 0.9);
  box-shadow: 0 0 0 3px rgba(232, 93, 93, 0.18);
}

.auth-field__error {
  font-size: 0.8rem;
  color: #f07178;
}
```

- [ ] **Step 6: Run Login specs — expect pass**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/login/login.spec.ts`

Expected: All specs PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/login/login.ts src/pages/auth/login/login.html src/pages/auth/login/login.css src/pages/auth/login/login.spec.ts
git commit -m "feat(auth): add reactive login form with Employee ID validation"
```

---

### Task 2: Forgot Password Reactive Forms + validation

**Files:**
- Modify: `src/pages/auth/forgot-password/forgot-password.spec.ts`
- Modify: `src/pages/auth/forgot-password/forgot-password.ts`
- Modify: `src/pages/auth/forgot-password/forgot-password.html`
- Modify: `src/pages/auth/forgot-password/forgot-password.css`

**Interfaces:**
- Consumes: none
- Produces:
  - `ForgotPassword.form: FormGroup` with control `employeeId`
  - `ForgotPassword.submitted: boolean`
  - `ForgotPassword.showError(name: 'employeeId'): boolean`
  - `ForgotPassword.onSubmit(): void` — sets `submitted`; returns early if invalid; no-op if valid

- [ ] **Step 1: Rewrite failing Forgot Password specs**

Replace `src/pages/auth/forgot-password/forgot-password.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;
  let component: ForgotPassword;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render reset card with Employee ID copy and back link', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Reset your password');
    expect(text).toContain("Enter your Employee ID and we'll send a reset link");
    expect(text).toContain('Employee ID');
    expect(text).toContain('Remembered it?');
    expect(text).toContain('Back to sign in');
    expect(text).not.toContain('Work email');
    expect(text).not.toContain("We'll email you a link to set a new one");

    const back = fixture.debugElement.query(By.css('a.auth-card__back'));
    expect(back).toBeTruthy();
  });

  it('should show Employee ID required error on empty submit', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Employee ID is required');
    expect(component.form.invalid).toBeTrue();
  });

  it('should accept a valid Employee ID submit without throwing', () => {
    component.form.setValue({ employeeId: 'E001' });
    expect(() => component.onSubmit()).not.toThrow();
    expect(component.form.valid).toBeTrue();
  });
});
```

- [ ] **Step 2: Run Forgot Password specs — expect failures**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/forgot-password/forgot-password.spec.ts`

Expected: FAIL (old email subtitle; no `form` / required error).

- [ ] **Step 3: Implement Forgot Password component**

Replace `src/pages/auth/forgot-password/forgot-password.ts` with:

```ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);

  submitted = false;

  readonly form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
  });

  showError(controlName: 'employeeId'): boolean {
    const control = this.form.controls[controlName];
    return this.submitted && control.invalid;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    // Static UI only — no API in this POC
  }
}
```

- [ ] **Step 4: Implement Forgot Password template**

Replace `src/pages/auth/forgot-password/forgot-password.html` with:

```html
<section class="auth-card">
  <h2 class="auth-card__title">Reset your password</h2>
  <p class="auth-card__subtitle">Enter your Employee ID and we'll send a reset link</p>

  <form class="auth-card__form" [formGroup]="form" (ngSubmit)="onSubmit()">
    <label class="auth-field">
      <span class="auth-field__label">Employee ID</span>
      <input
        class="auth-field__input"
        [class.auth-field__input--invalid]="showError('employeeId')"
        type="text"
        formControlName="employeeId"
        autocomplete="username"
      />
      @if (showError('employeeId')) {
        <span class="auth-field__error">Employee ID is required</span>
      }
    </label>

    <button class="auth-card__submit" type="submit">Submit</button>
  </form>

  <p class="auth-card__footer">
    Remembered it?
    <a class="auth-card__back" routerLink="/login">Back to sign in</a>
  </p>
</section>
```

- [ ] **Step 5: Add error styles to Forgot Password CSS**

Append to `src/pages/auth/forgot-password/forgot-password.css`:

```css
.auth-field__input--invalid {
  border-color: rgba(232, 93, 93, 0.75);
}

.auth-field__input--invalid:focus {
  border-color: rgba(232, 93, 93, 0.9);
  box-shadow: 0 0 0 3px rgba(232, 93, 93, 0.18);
}

.auth-field__error {
  font-size: 0.8rem;
  color: #f07178;
}
```

- [ ] **Step 6: Run Forgot Password specs — expect pass**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/forgot-password/forgot-password.spec.ts`

Expected: All specs PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/forgot-password/forgot-password.ts src/pages/auth/forgot-password/forgot-password.html src/pages/auth/forgot-password/forgot-password.css src/pages/auth/forgot-password/forgot-password.spec.ts
git commit -m "feat(auth): add reactive forgot-password form with Employee ID"
```

---

### Task 3: Auth layout route copy for Employee ID

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/shared/layouts/auth/auth.spec.ts`

**Interfaces:**
- Consumes: none
- Produces: forgot-password route `data.description` =
  `"Enter the Employee ID you sign in with and we'll send a reset link."`

- [ ] **Step 1: Update Auth layout spec expectations**

In `src/shared/layouts/auth/auth.spec.ts`, change the forgot-password stub route `data.description` and assertion.

Replace the forgot-password child route block with:

```ts
      {
        path: 'forgot-password',
        component: StubChild,
        data: {
          headline: 'Locked out? Happens.',
          description:
            "Enter the Employee ID you sign in with and we'll send a reset link.",
        },
      },
```

Replace the assertion in `should swap left copy on forgot-password route`:

```ts
    expect(text).toContain('Locked out? Happens.');
    expect(text).toContain('Enter the Employee ID you sign in with');
    expect(text).not.toContain('Every shift, verified.');
```

- [ ] **Step 2: Run Auth specs — expect failure against real routes if wired, or pass stubs only**

Note: `auth.spec.ts` uses local `testRoutes`, so Step 1 alone should still PASS. Continue to Step 3 to update production routes so the app matches the spec.

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/auth/auth.spec.ts`

Expected: PASS after Step 1 (stub data only).

- [ ] **Step 3: Update production route data**

In `src/app/app.routes.ts`, change forgot-password `data.description` to:

```ts
          description:
            "Enter the Employee ID you sign in with and we'll send a reset link.",
```

- [ ] **Step 4: Re-run Auth + both form specs**

Run:

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/auth/auth.spec.ts --include=src/pages/auth/login/login.spec.ts --include=src/pages/auth/forgot-password/forgot-password.spec.ts
```

Expected: All included specs PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/app.routes.ts src/shared/layouts/auth/auth.spec.ts
git commit -m "fix(auth): use Employee ID copy on forgot-password route"
```

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| Reactive Forms on Login + Forgot Password | Task 1, Task 2 |
| Employee ID replaces email (fields + labels) | Task 1, Task 2 |
| Employee ID required-only message | Task 1, Task 2 |
| Password required / min 8 / letter+number messages + priority | Task 1 |
| Errors only after submit | Task 1, Task 2 (`submitted` flag) |
| Inline error + invalid border | Task 1 Step 5, Task 2 Step 5 |
| Valid login → `/dashboard` | Task 1 |
| Valid forgot-password no-op | Task 2 |
| Route left-panel description update | Task 3 |
| Specs updated | Tasks 1–3 |

No placeholders remaining. Control names (`employeeId`, `password`) and method names (`showError`, `passwordErrorMessage`, `onSubmit`) are consistent across tasks.
