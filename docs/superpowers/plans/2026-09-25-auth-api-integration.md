# Auth API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Login and Forgot Password to real APIs via a typed Auth service, persist session in `localStorage`, and guard Main layout routes.

**Architecture:** Flat `API_ENDPOINTS` config (full URLs for ports 3005/3006), request/response interfaces under `src/shared/utils/interface`, single `Auth` service for HTTP + session helpers, functional `authGuard` on Main layout, pages map one identifier field (email if contains `@`, else ID) and call the service.

**Tech Stack:** Angular 20 standalone, `HttpClient` / `provideHttpClient` / `provideHttpClientTesting`, Jasmine + Karma (`ng test`), `localStorage`.

**Spec:** `docs/superpowers/specs/2026-09-25-auth-api-integration-design.md`

## Global Constraints

- Endpoints: `http://localhost:3005/web/login` and `http://localhost:3006/web/forgot-password` (full URLs; different ports).
- Login request sends either `empId` or `email` plus `password`; forgot-password sends either `employeeId` or `empEmail`.
- Identifier detection: value contains `@` → email; otherwise → ID.
- Form control rename: `employeeId` → `identifier`; label **Employee ID or Email**; required error: `Employee ID or Email is required`.
- Session keys: `auth_token`, `auth_user` in `localStorage`.
- Login page calls `saveSession(data)` then navigates `/dashboard` only on success; Auth HTTP methods do not write storage themselves.
- No HTTP interceptor / Bearer attachment; no logout UI; no token expiry checks beyond token presence.
- Prefer existing standalone patterns under `src/pages/auth/` and `src/shared/services/`.

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/shared/utils/config/api.config.ts` | `API_ENDPOINTS` constant |
| `src/shared/utils/interface/auth-request.interface.ts` | `LoginRequest`, `ForgotPasswordRequest` |
| `src/shared/utils/interface/auth-response.interface.ts` | `LoginResponse`, `LoginUserData`, `ForgotPasswordResponse` |
| `src/shared/services/auth/auth.ts` | HTTP login/forgotPassword + session helpers |
| `src/shared/services/auth/auth.spec.ts` | Auth service tests |
| `src/shared/guards/auth.guard.ts` | Functional guard |
| `src/shared/guards/auth.guard.spec.ts` | Guard tests |
| `src/app/app.config.ts` | `provideHttpClient()` |
| `src/app/app.routes.ts` | Guard on Main; forgot-password description copy |
| `src/pages/auth/login/*` | API call, loading, API error, session + navigate |
| `src/pages/auth/forgot-password/*` | API call, loading, success/error messages |
| `src/shared/layouts/auth/auth.spec.ts` | Updated left-panel description assertion |

---

### Task 1: API config + auth interfaces

**Files:**
- Create: `src/shared/utils/config/api.config.ts`
- Create: `src/shared/utils/interface/auth-request.interface.ts`
- Create: `src/shared/utils/interface/auth-response.interface.ts`
- Create: `src/shared/utils/config/api.config.spec.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `API_ENDPOINTS.login: string`
  - `API_ENDPOINTS.forgotPassword: string`
  - `LoginRequest`, `ForgotPasswordRequest`
  - `LoginResponse`, `LoginUserData`, `ForgotPasswordResponse`

- [ ] **Step 1: Write the failing config test**

Create `src/shared/utils/config/api.config.spec.ts`:

```ts
import { API_ENDPOINTS } from './api.config';

describe('API_ENDPOINTS', () => {
  it('should expose login and forgot-password URLs', () => {
    expect(API_ENDPOINTS.login).toBe('http://localhost:3005/web/login');
    expect(API_ENDPOINTS.forgotPassword).toBe(
      'http://localhost:3006/web/forgot-password',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include=src/shared/utils/config/api.config.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: FAIL (cannot find module `./api.config` or `API_ENDPOINTS` undefined)

- [ ] **Step 3: Create config and interfaces**

Create `src/shared/utils/config/api.config.ts`:

```ts
export const API_ENDPOINTS = {
  login: 'http://localhost:3005/web/login',
  forgotPassword: 'http://localhost:3006/web/forgot-password',
} as const;
```

Create `src/shared/utils/interface/auth-request.interface.ts`:

```ts
export interface LoginRequest {
  empId?: string;
  email?: string;
  password: string;
}

export interface ForgotPasswordRequest {
  employeeId?: string;
  empEmail?: string;
}
```

Create `src/shared/utils/interface/auth-response.interface.ts`:

```ts
export interface LoginUserData {
  empId: number;
  empName: string;
  empEmail: string;
  empRoleId: number;
  empRole: string;
  token: string;
  tokenType: string;
  expiresIn: number;
  expiryTime: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: LoginUserData;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include=src/shared/utils/config/api.config.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/config/api.config.ts src/shared/utils/config/api.config.spec.ts src/shared/utils/interface/auth-request.interface.ts src/shared/utils/interface/auth-response.interface.ts
git commit -m "$(cat <<'EOF'
feat(auth): add API endpoints config and auth interfaces

EOF
)"
```

---

### Task 2: Auth service (HTTP + session)

**Files:**
- Modify: `src/shared/services/auth/auth.ts`
- Modify: `src/shared/services/auth/auth.spec.ts`

**Interfaces:**
- Consumes: `API_ENDPOINTS`, `LoginRequest`, `ForgotPasswordRequest`, `LoginResponse`, `ForgotPasswordResponse`, `LoginUserData`
- Produces:
  - `Auth.login(payload: LoginRequest): Observable<LoginResponse>`
  - `Auth.forgotPassword(payload: ForgotPasswordRequest): Observable<ForgotPasswordResponse>`
  - `Auth.saveSession(data: LoginUserData): void`
  - `Auth.clearSession(): void`
  - `Auth.getToken(): string | null`
  - `Auth.getUser(): LoginUserData | null`
  - `Auth.isAuthenticated(): boolean`
  - `Auth.buildLoginRequest(identifier: string, password: string): LoginRequest`
  - `Auth.buildForgotPasswordRequest(identifier: string): ForgotPasswordRequest`

- [ ] **Step 1: Rewrite Auth specs (failing until implemented)**

Replace `src/shared/services/auth/auth.spec.ts` with:

```ts
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { Auth } from './auth';
import { API_ENDPOINTS } from '../../utils/config/api.config';
import { LoginUserData } from '../../utils/interface/auth-response.interface';

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;

  const userData: LoginUserData = {
    empId: 1,
    empName: 'Vijay Sam',
    empEmail: 'joe_f@trigent.com',
    empRoleId: 1,
    empRole: 'Human Resource/ Admin',
    token: 'test-token',
    tokenType: 'Bearer',
    expiresIn: 86400,
    expiryTime: '2026-09-26T03:59:19.118Z',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build login request with empId when identifier has no @', () => {
    expect(service.buildLoginRequest('20', 'secret1A')).toEqual({
      empId: '20',
      password: 'secret1A',
    });
  });

  it('should build login request with email when identifier contains @', () => {
    expect(
      service.buildLoginRequest('joe@example.com', 'secret1A'),
    ).toEqual({
      email: 'joe@example.com',
      password: 'secret1A',
    });
  });

  it('should build forgot-password request with employeeId or empEmail', () => {
    expect(service.buildForgotPasswordRequest('2')).toEqual({
      employeeId: '2',
    });
    expect(service.buildForgotPasswordRequest('a@b.com')).toEqual({
      empEmail: 'a@b.com',
    });
  });

  it('should POST login and return response', () => {
    const payload = { empId: '20', password: 'secret1A' };
    let result: unknown;
    service.login(payload).subscribe((res) => (result = res));

    const req = httpMock.expectOne(API_ENDPOINTS.login);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      success: true,
      message: 'Login successful',
      data: userData,
    });

    expect(result).toEqual({
      success: true,
      message: 'Login successful',
      data: userData,
    });
  });

  it('should POST forgot-password and return response', () => {
    const payload = { employeeId: '2' };
    let result: unknown;
    service.forgotPassword(payload).subscribe((res) => (result = res));

    const req = httpMock.expectOne(API_ENDPOINTS.forgotPassword);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      success: true,
      message: 'Temporary password has been sent to the employee email',
    });

    expect(result).toEqual({
      success: true,
      message: 'Temporary password has been sent to the employee email',
    });
  });

  it('should save and clear session in localStorage', () => {
    expect(service.isAuthenticated()).toBeFalse();
    service.saveSession(userData);
    expect(service.getToken()).toBe('test-token');
    expect(service.getUser()).toEqual(userData);
    expect(service.isAuthenticated()).toBeTrue();
    service.clearSession();
    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
```

- [ ] **Step 2: Run Auth specs to verify they fail**

Run: `npx ng test --include=src/shared/services/auth/auth.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: FAIL (missing methods / HttpClient not provided as needed)

- [ ] **Step 3: Implement Auth service**

Replace `src/shared/services/auth/auth.ts` with:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import {
  ForgotPasswordRequest,
  LoginRequest,
} from '../../utils/interface/auth-request.interface';
import {
  ForgotPasswordResponse,
  LoginResponse,
  LoginUserData,
} from '../../utils/interface/auth-response.interface';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(API_ENDPOINTS.login, payload);
  }

  forgotPassword(
    payload: ForgotPasswordRequest,
  ): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      API_ENDPOINTS.forgotPassword,
      payload,
    );
  }

  buildLoginRequest(identifier: string, password: string): LoginRequest {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return { email: trimmed, password };
    }
    return { empId: trimmed, password };
  }

  buildForgotPasswordRequest(identifier: string): ForgotPasswordRequest {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return { empEmail: trimmed };
    }
    return { employeeId: trimmed };
  }

  saveSession(data: LoginUserData): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): LoginUserData | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as LoginUserData;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
```

- [ ] **Step 4: Ensure HttpClient is available in tests**

If Step 2 failed because `HttpClient` injection requires app-level provider, keep `HttpClientTestingModule` in the Auth spec (already above). Also add `provideHttpClient()` to `src/app/app.config.ts` now so the app can inject `HttpClient`:

In `src/app/app.config.ts`, add import and provider:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
  ]
};
```

- [ ] **Step 5: Run Auth specs to verify they pass**

Run: `npx ng test --include=src/shared/services/auth/auth.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/shared/services/auth/auth.ts src/shared/services/auth/auth.spec.ts src/app/app.config.ts
git commit -m "$(cat <<'EOF'
feat(auth): implement Auth service with login and session helpers

EOF
)"
```

---

### Task 3: Auth guard + Main route protection

**Files:**
- Create: `src/shared/guards/auth.guard.ts`
- Create: `src/shared/guards/auth.guard.spec.ts`
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Consumes: `Auth.isAuthenticated()`
- Produces: `authGuard: CanActivateFn`

- [ ] **Step 1: Write failing guard specs**

Create `src/shared/guards/auth.guard.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { authGuard } from './auth.guard';
import { Auth } from '../services/auth/auth';

describe('authGuard', () => {
  let auth: Auth;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
    auth = TestBed.inject(Auth);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow activation when authenticated', () => {
    spyOn(auth, 'isAuthenticated').and.returnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(result).toBeTrue();
  });

  it('should redirect to /login when not authenticated', () => {
    spyOn(auth, 'isAuthenticated').and.returnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
```

- [ ] **Step 2: Run guard specs to verify they fail**

Run: `npx ng test --include=src/shared/guards/auth.guard.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: FAIL (cannot find `./auth.guard`)

- [ ] **Step 3: Implement guard and wire routes**

Create `src/shared/guards/auth.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../services/auth/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  void router.navigateByUrl('/login');
  return false;
};
```

In `src/app/app.routes.ts`, import the guard and add `canActivate: [authGuard]` on the Main layout route:

```ts
import { authGuard } from '../shared/guards/auth.guard';

// ...

  {
    path: '',
    component: Main,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'attendance', component: Attendance },
      { path: 'employees', component: Employees },
      { path: 'locations', component: Locations },
      { path: 'reports', component: Reports },
    ],
  },
```

Leave Auth layout routes public (no guard).

- [ ] **Step 4: Run guard specs to verify they pass**

Run: `npx ng test --include=src/shared/guards/auth.guard.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/guards/auth.guard.ts src/shared/guards/auth.guard.spec.ts src/app/app.routes.ts
git commit -m "$(cat <<'EOF'
feat(auth): add authGuard to protect main layout routes

EOF
)"
```

---

### Task 4: Login page API integration

**Files:**
- Modify: `src/pages/auth/login/login.spec.ts`
- Modify: `src/pages/auth/login/login.ts`
- Modify: `src/pages/auth/login/login.html`

**Interfaces:**
- Consumes: `Auth.login`, `Auth.buildLoginRequest`, `Auth.saveSession`
- Produces:
  - Form control `identifier` (was `employeeId`)
  - `apiError: string | null`
  - `loading: boolean`
  - Navigate `/dashboard` only after successful API login + `saveSession`

- [ ] **Step 1: Rewrite Login specs for API integration**

Replace `src/pages/auth/login/login.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { Auth } from '../../../shared/services/auth/auth';
import { LoginUserData } from '../../../shared/utils/interface/auth-response.interface';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let router: Router;
  let component: Login;
  let auth: jasmine.SpyObj<Auth>;

  const userData: LoginUserData = {
    empId: 1,
    empName: 'Vijay Sam',
    empEmail: 'joe_f@trigent.com',
    empRoleId: 1,
    empRole: 'Human Resource/ Admin',
    token: 'test-token',
    tokenType: 'Bearer',
    expiresIn: 86400,
    expiryTime: '2026-09-26T03:59:19.118Z',
  };

  beforeEach(async () => {
    auth = jasmine.createSpyObj<Auth>('Auth', [
      'login',
      'buildLoginRequest',
      'saveSession',
    ]);
    auth.buildLoginRequest.and.callFake((identifier, password) =>
      identifier.includes('@')
        ? { email: identifier, password }
        : { empId: identifier, password },
    );

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: Auth, useValue: auth }],
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

  it('should render welcome card with Employee ID or Email label', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Welcome back');
    expect(text).toContain('Employee ID or Email');
    expect(text).toContain('Forgot password?');
    expect(text).not.toContain('Keep me signed in');
  });

  it('should show required errors on empty submit and not call login', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Employee ID or Email is required');
    expect(text).toContain('Password is required');
    expect(auth.login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show password length and strength errors', () => {
    component.form.setValue({ identifier: 'E001', password: 'short' });
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Password must be at least 8 characters',
    );
    expect(auth.login).not.toHaveBeenCalled();

    component.form.setValue({ identifier: 'E001', password: 'longenough' });
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Password must include at least one letter and one number',
    );
  });

  it('should save session and navigate on successful login', () => {
    auth.login.and.returnValue(
      of({ success: true, message: 'Login successful', data: userData }),
    );
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(auth.buildLoginRequest).toHaveBeenCalledWith('20', 'Password1');
    expect(auth.login).toHaveBeenCalled();
    expect(auth.saveSession).toHaveBeenCalledWith(userData);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should show API message and not navigate on failed login', () => {
    auth.login.and.returnValue(
      of({ success: false, message: 'Invalid email or password' }),
    );
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Invalid email or password',
    );
    expect(auth.saveSession).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show fallback message on HTTP error', () => {
    auth.login.and.returnValue(throwError(() => new Error('network')));
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to connect. Please try again.',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run Login specs to verify they fail**

Run: `npx ng test --include=src/pages/auth/login/login.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: FAIL (still uses `employeeId`, no Auth calls)

- [ ] **Step 3: Implement Login component + template**

Replace `src/pages/auth/login/login.ts` with:

```ts
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);

  submitted = false;
  loading = false;
  apiError: string | null = null;

  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  showError(controlName: 'identifier' | 'password'): boolean {
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
    this.apiError = null;
    if (this.form.invalid || this.loading) {
      return;
    }

    const { identifier, password } = this.form.getRawValue();
    const payload = this.auth.buildLoginRequest(identifier, password);
    this.loading = true;

    this.auth.login(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.auth.saveSession(res.data);
          void this.router.navigateByUrl('/dashboard');
          return;
        }
        this.apiError = res.message || 'Login failed';
      },
      error: () => {
        this.loading = false;
        this.apiError = 'Unable to connect. Please try again.';
      },
    });
  }
}
```

Replace `src/pages/auth/login/login.html` with:

```html
<section class="auth-card">
  <h2 class="auth-card__title">Welcome back</h2>
  <p class="auth-card__subtitle">Sign in to the HR admin portal</p>

  @if (apiError) {
    <p class="auth-card__api-error" role="alert">{{ apiError }}</p>
  }

  <form class="auth-card__form" [formGroup]="form" (ngSubmit)="onSubmit()">
    <label class="auth-field">
      <span class="auth-field__label">Employee ID or Email</span>
      <input
        class="auth-field__input"
        [class.auth-field__input--invalid]="showError('identifier')"
        type="text"
        formControlName="identifier"
        autocomplete="username"
      />
      @if (showError('identifier')) {
        <span class="auth-field__error">Employee ID or Email is required</span>
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

    <button class="auth-card__submit" type="submit" [disabled]="loading">
      {{ loading ? 'Signing in…' : 'Sign In' }}
    </button>
  </form>
</section>
```

Add to `src/pages/auth/login/login.css` (append):

```css
.auth-card__api-error {
  margin: 0 0 1rem;
  color: #b42318;
  font-size: 0.875rem;
}
```

- [ ] **Step 4: Run Login specs to verify they pass**

Run: `npx ng test --include=src/pages/auth/login/login.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth/login/login.ts src/pages/auth/login/login.html src/pages/auth/login/login.css src/pages/auth/login/login.spec.ts
git commit -m "$(cat <<'EOF'
feat(auth): wire login page to Auth API and session storage

EOF
)"
```

---

### Task 5: Forgot password API integration + copy

**Files:**
- Modify: `src/pages/auth/forgot-password/forgot-password.spec.ts`
- Modify: `src/pages/auth/forgot-password/forgot-password.ts`
- Modify: `src/pages/auth/forgot-password/forgot-password.html`
- Modify: `src/pages/auth/forgot-password/forgot-password.css`
- Modify: `src/app/app.routes.ts` (forgot-password `data.description`)
- Modify: `src/shared/layouts/auth/auth.spec.ts` (description assertion if present)

**Interfaces:**
- Consumes: `Auth.forgotPassword`, `Auth.buildForgotPasswordRequest`
- Produces:
  - Form control `identifier`
  - `apiMessage: string | null` (success or error)
  - `apiMessageIsError: boolean`
  - `loading: boolean`

- [ ] **Step 1: Rewrite Forgot Password specs**

Replace `src/pages/auth/forgot-password/forgot-password.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { ForgotPassword } from './forgot-password';
import { Auth } from '../../../shared/services/auth/auth';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;
  let component: ForgotPassword;
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<Auth>('Auth', [
      'forgotPassword',
      'buildForgotPasswordRequest',
    ]);
    auth.buildForgotPasswordRequest.and.callFake((identifier) =>
      identifier.includes('@')
        ? { empEmail: identifier }
        : { employeeId: identifier },
    );

    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([]), { provide: Auth, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render reset card with identifier copy and back link', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Reset your password');
    expect(text).toContain(
      "Enter your Employee ID or Email and we'll send a reset link",
    );
    expect(text).toContain('Employee ID or Email');
    expect(text).toContain('Back to sign in');

    const back = fixture.debugElement.query(By.css('a.auth-card__back'));
    expect(back).toBeTruthy();
  });

  it('should show required error on empty submit and not call API', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Employee ID or Email is required',
    );
    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('should show success message from API', () => {
    auth.forgotPassword.and.returnValue(
      of({
        success: true,
        message: 'Temporary password has been sent to the employee email',
      }),
    );
    component.form.setValue({ identifier: '2' });
    component.onSubmit();
    fixture.detectChanges();

    expect(auth.buildForgotPasswordRequest).toHaveBeenCalledWith('2');
    expect(fixture.nativeElement.textContent).toContain(
      'Temporary password has been sent to the employee email',
    );
  });

  it('should show failure message from API', () => {
    auth.forgotPassword.and.returnValue(
      of({
        success: false,
        message: 'Invalid employee ID or employee is inactive',
      }),
    );
    component.form.setValue({ identifier: '2' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Invalid employee ID or employee is inactive',
    );
  });

  it('should show fallback message on HTTP error', () => {
    auth.forgotPassword.and.returnValue(throwError(() => new Error('network')));
    component.form.setValue({ identifier: '2' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to connect. Please try again.',
    );
  });
});
```

- [ ] **Step 2: Run Forgot Password specs to verify they fail**

Run: `npx ng test --include=src/pages/auth/forgot-password/forgot-password.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: FAIL

- [ ] **Step 3: Implement Forgot Password component + template + route copy**

Replace `src/pages/auth/forgot-password/forgot-password.ts` with:

```ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);

  submitted = false;
  loading = false;
  apiMessage: string | null = null;
  apiMessageIsError = false;

  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
  });

  showError(controlName: 'identifier'): boolean {
    const control = this.form.controls[controlName];
    return this.submitted && control.invalid;
  }

  onSubmit(): void {
    this.submitted = true;
    this.apiMessage = null;
    this.apiMessageIsError = false;
    if (this.form.invalid || this.loading) {
      return;
    }

    const { identifier } = this.form.getRawValue();
    const payload = this.auth.buildForgotPasswordRequest(identifier);
    this.loading = true;

    this.auth.forgotPassword(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.apiMessage = res.message;
        this.apiMessageIsError = !res.success;
      },
      error: () => {
        this.loading = false;
        this.apiMessage = 'Unable to connect. Please try again.';
        this.apiMessageIsError = true;
      },
    });
  }
}
```

Replace `src/pages/auth/forgot-password/forgot-password.html` with:

```html
<section class="auth-card">
  <h2 class="auth-card__title">Reset your password</h2>
  <p class="auth-card__subtitle">
    Enter your Employee ID or Email and we'll send a reset link
  </p>

  @if (apiMessage) {
    <p
      class="auth-card__api-message"
      [class.auth-card__api-message--error]="apiMessageIsError"
      role="status"
    >
      {{ apiMessage }}
    </p>
  }

  <form class="auth-card__form" [formGroup]="form" (ngSubmit)="onSubmit()">
    <label class="auth-field">
      <span class="auth-field__label">Employee ID or Email</span>
      <input
        class="auth-field__input"
        [class.auth-field__input--invalid]="showError('identifier')"
        type="text"
        formControlName="identifier"
        autocomplete="username"
      />
      @if (showError('identifier')) {
        <span class="auth-field__error">Employee ID or Email is required</span>
      }
    </label>

    <button class="auth-card__submit" type="submit" [disabled]="loading">
      {{ loading ? 'Submitting…' : 'Submit' }}
    </button>
  </form>

  <p class="auth-card__footer">
    Remembered it?
    <a class="auth-card__back" routerLink="/login">Back to sign in</a>
  </p>
</section>
```

Append to `src/pages/auth/forgot-password/forgot-password.css`:

```css
.auth-card__api-message {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: #027a48;
}

.auth-card__api-message--error {
  color: #b42318;
}
```

In `src/app/app.routes.ts`, update forgot-password `data.description` to:

```ts
description:
  'Enter the Employee ID or Email you sign in with and we\'ll send a reset link.',
```

In `src/shared/layouts/auth/auth.spec.ts`:

1. Update the forgot-password route fixture `data.description` to:
   `"Enter the Employee ID or Email you sign in with and we'll send a reset link."`
2. Update the assertion in `should swap left copy on forgot-password route` from:
   `expect(text).toContain('Enter the Employee ID you sign in with');`
   to:
   `expect(text).toContain('Enter the Employee ID or Email you sign in with');`

- [ ] **Step 4: Run Forgot Password (+ auth layout) specs**

Run:

```bash
npx ng test --include=src/pages/auth/forgot-password/forgot-password.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --include=src/shared/layouts/auth/auth.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth/forgot-password/forgot-password.ts src/pages/auth/forgot-password/forgot-password.html src/pages/auth/forgot-password/forgot-password.css src/pages/auth/forgot-password/forgot-password.spec.ts src/app/app.routes.ts src/shared/layouts/auth/auth.spec.ts
git commit -m "$(cat <<'EOF'
feat(auth): wire forgot-password page to Auth API

EOF
)"
```

---

### Task 6: Full verification

**Files:**
- None new (verify all)

- [ ] **Step 1: Run full unit test suite**

Run: `npx ng test --browsers=ChromeHeadless --watch=false`

Expected: all specs PASS

- [ ] **Step 2: Manual smoke (optional if backends running)**

1. `ng serve` — open `/login`
2. Invalid credentials → API error message; stay on login; no token in `localStorage`
3. Valid empId/email + password → `auth_token` / `auth_user` set → `/dashboard`
4. Clear storage → visit `/dashboard` → redirected to `/login`
5. Forgot password with valid/invalid identifier → success/error message on page

- [ ] **Step 3: Commit any remaining fixes only if needed**

If Step 1 required small fixes, commit them with a focused message. Otherwise skip.

---

## Self-review checklist (plan author)

| Spec requirement | Task |
|------------------|------|
| `API_ENDPOINTS` config | Task 1 |
| Request/response interfaces under `utils/interface` | Task 1 |
| Auth login / forgotPassword HTTP | Task 2 |
| Identifier mapping (`@` → email) | Task 2 (`build*Request`) |
| Session save/clear/get/isAuthenticated | Task 2 |
| `provideHttpClient` | Task 2 |
| `authGuard` + Main routes | Task 3 |
| Login page wire + navigate on success | Task 4 |
| Forgot password wire + messages | Task 5 |
| Copy / label updates | Tasks 4–5 |
| No interceptor / logout | Explicitly out of scope |
