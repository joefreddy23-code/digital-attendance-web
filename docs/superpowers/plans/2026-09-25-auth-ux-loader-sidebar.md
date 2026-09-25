# Auth UX Loader Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show API `message` on auth HTTP errors, bind sidebar profile to session user data, and show a full-screen overlay spinner for all HttpClient calls via an interceptor.

**Architecture:** Shared `apiErrorMessage()` helper for Login/Forgot Password; Sidebar reads `Auth.getUser()`; `LoaderService` counter + functional `loadingInterceptor` + `GlobalLoader` hosted in `app.html`.

**Tech Stack:** Angular 20 standalone, signals, functional interceptors (`withInterceptors`), Jasmine + Karma (`ng test`).

**Spec:** `docs/superpowers/specs/2026-09-25-auth-ux-loader-sidebar-design.md`

## Global Constraints

- HTTP error message priority: string `error.error.message` → else `"Unable to connect. Please try again."`
- Sidebar: `empName`, `empRole`; initials from first+last word of `empName` (one word → first 2 letters); null user → `"—"`, `""`, `"?"`
- Loader: full-screen overlay; in-flight counter; `finalize` always hides
- Keep auth submit `loading` disable; visual spinner from overlay
- No Bearer interceptor; no logout UI; no endpoint/interface changes
- On Windows: use ASCII `...` in UI strings if needed (avoid unicode ellipsis mojibake)
- Prefer existing standalone patterns under `src/shared/` and `src/pages/auth/`

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/shared/utils/http/api-error-message.ts` | `apiErrorMessage(err)` |
| `src/shared/utils/http/api-error-message.spec.ts` | Helper unit tests |
| `src/pages/auth/login/login.ts` (+ spec) | Use helper in error path |
| `src/pages/auth/forgot-password/forgot-password.ts` (+ spec) | Use helper in error path |
| `src/shared/components/sidebar/sidebar.ts` (+ html, spec) | Session profile |
| `src/shared/services/loader/loader.ts` (+ spec) | Counter + `isLoading` |
| `src/shared/interceptors/loading.interceptor.ts` (+ spec) | show/hide around HTTP |
| `src/shared/components/global-loader/*` | Overlay UI |
| `src/app/app.ts` / `app.html` / `app.config.ts` | Host overlay + register interceptor |

---

### Task 1: API error message helper + auth pages

**Files:**
- Create: `src/shared/utils/http/api-error-message.ts`
- Create: `src/shared/utils/http/api-error-message.spec.ts`
- Modify: `src/pages/auth/login/login.ts`
- Modify: `src/pages/auth/login/login.spec.ts`
- Modify: `src/pages/auth/forgot-password/forgot-password.ts`
- Modify: `src/pages/auth/forgot-password/forgot-password.spec.ts`

**Interfaces:**
- Consumes: `HttpErrorResponse` shape (`error.message`)
- Produces: `apiErrorMessage(err: unknown): string`

- [ ] **Step 1: Write failing helper + page specs**

Create `src/shared/utils/http/api-error-message.spec.ts`:

```ts
import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it('should return API message from HttpErrorResponse body', () => {
    const err = new HttpErrorResponse({
      status: 401,
      error: { success: false, message: 'Invalid email or password' },
    });
    expect(apiErrorMessage(err)).toBe('Invalid email or password');
  });

  it('should return fallback when body has no message', () => {
    const err = new HttpErrorResponse({ status: 0, error: null });
    expect(apiErrorMessage(err)).toBe('Unable to connect. Please try again.');
  });

  it('should return fallback for non-HTTP errors', () => {
    expect(apiErrorMessage(new Error('boom'))).toBe(
      'Unable to connect. Please try again.',
    );
  });
});
```

In `login.spec.ts`, replace the HTTP error test with two tests:

```ts
  it('should show API message from HttpErrorResponse body', () => {
    auth.login.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { success: false, message: 'Invalid email or password' },
          }),
      ),
    );
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Invalid email or password',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show fallback message on HTTP error without body message', () => {
    auth.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0, error: null })),
    );
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to connect. Please try again.',
    );
  });
```

Add `import { HttpErrorResponse } from '@angular/common/http';` to login.spec.ts.

In `forgot-password.spec.ts`, replace the HTTP error test similarly (same two cases; assert `apiMessage` text). Keep existing success/failure 200-body tests.

- [ ] **Step 2: Run specs to verify they fail**

Run:

```bash
npx ng test --include=src/shared/utils/http/api-error-message.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --include=src/pages/auth/login/login.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --include=src/pages/auth/forgot-password/forgot-password.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: helper FAIL (missing module); login/forgot FAIL on API-body HTTP error case.

- [ ] **Step 3: Implement helper and wire pages**

Create `src/shared/utils/http/api-error-message.ts`:

```ts
import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK = 'Unable to connect. Please try again.';

export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const message = (err.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return FALLBACK;
}
```

In `login.ts` error handler:

```ts
import { apiErrorMessage } from '../../../shared/utils/http/api-error-message';

// ...
      error: (err) => {
        this.loading = false;
        this.apiError = apiErrorMessage(err);
      },
```

In `forgot-password.ts` error handler:

```ts
import { apiErrorMessage } from '../../../shared/utils/http/api-error-message';

// ...
      error: (err) => {
        this.loading = false;
        this.apiMessage = apiErrorMessage(err);
        this.apiMessageIsError = true;
      },
```

- [ ] **Step 4: Run specs to verify they pass**

Same three `ng test --include=...` commands. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/http/api-error-message.ts src/shared/utils/http/api-error-message.spec.ts src/pages/auth/login/login.ts src/pages/auth/login/login.spec.ts src/pages/auth/forgot-password/forgot-password.ts src/pages/auth/forgot-password/forgot-password.spec.ts
git commit -m "fix(auth): show API error message on login and forgot-password HTTP failures"
```

---

### Task 2: Sidebar session user details

**Files:**
- Modify: `src/shared/components/sidebar/sidebar.ts`
- Modify: `src/shared/components/sidebar/sidebar.html`
- Modify: `src/shared/components/sidebar/sidebar.spec.ts`

**Interfaces:**
- Consumes: `Auth.getUser(): LoginUserData | null`
- Produces: `displayName`, `displayRole`, `initials` getters (or computed from user)

- [ ] **Step 1: Write failing Sidebar specs**

Add Auth mock and profile tests to `sidebar.spec.ts`:

```ts
import { provideHttpClient } from '@angular/common/http';

import { Auth } from '../../services/auth/auth';
import { LoginUserData } from '../../utils/interface/auth-response.interface';

// ...

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
    auth = jasmine.createSpyObj<Auth>('Auth', ['getUser']);
    auth.getUser.and.returnValue(userData);

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: Auth, useValue: auth },
      ],
    }).compileComponents();
    // ... rest unchanged
  });

  it('should render session user name, role, and initials', () => {
    expect(fixture.nativeElement.textContent).toContain('Vijay Sam');
    expect(fixture.nativeElement.textContent).toContain('Human Resource/ Admin');
    expect(fixture.nativeElement.textContent).toContain('VS');
    expect(fixture.nativeElement.textContent).not.toContain('Pooja D');
  });

  it('should render fallbacks when no session user', () => {
    auth.getUser.and.returnValue(null);
    fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('—');
    expect(fixture.debugElement.query(By.css('.sidebar__avatar')).nativeElement.textContent.trim()).toBe('?');
  });
```

- [ ] **Step 2: Run Sidebar specs to verify they fail**

Run: `npx ng test --include=src/shared/components/sidebar/sidebar.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: FAIL (still shows Pooja D / PD).

- [ ] **Step 3: Implement Sidebar bindings**

Replace `sidebar.ts` with:

```ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Auth } from '../../services/auth/auth';
import { MainLayoutService } from '../../services/main-layout/main-layout';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: {
    class: 'sidebar',
    '[class.sidebar--collapsed]': '!layout.sidebarExpanded()',
    '[class.sidebar--expanded]': 'layout.sidebarExpanded()',
  },
})
export class Sidebar {
  readonly layout = inject(MainLayoutService);
  private readonly auth = inject(Auth);

  readonly navItems = [
    { label: 'Overview', path: '/dashboard', icon: 'fa-house' },
    { label: 'Employees', path: '/employees', icon: 'fa-user' },
    { label: 'Locations', path: '/locations', icon: 'fa-location-dot' },
    { label: 'Reports', path: '/reports', icon: 'fa-clock' },
  ] as const;

  get displayName(): string {
    return this.auth.getUser()?.empName ?? '—';
  }

  get displayRole(): string {
    return this.auth.getUser()?.empRole ?? '';
  }

  get initials(): string {
    const name = this.auth.getUser()?.empName?.trim();
    if (!name) {
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
}
```

Update profile block in `sidebar.html`:

```html
<div class="sidebar__profile">
  <div class="sidebar__avatar" aria-hidden="true">{{ initials }}</div>
  @if (layout.sidebarExpanded()) {
    <div class="sidebar__profile-text">
      <div class="sidebar__profile-name">{{ displayName }}</div>
      <div class="sidebar__profile-role">{{ displayRole }}</div>
    </div>
  }
</div>
```

- [ ] **Step 4: Run Sidebar specs to verify they pass**

Run: `npx ng test --include=src/shared/components/sidebar/sidebar.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/sidebar/sidebar.ts src/shared/components/sidebar/sidebar.html src/shared/components/sidebar/sidebar.spec.ts
git commit -m "feat(sidebar): show logged-in user name and role from session"
```

---

### Task 3: Loader service, interceptor, and full-screen overlay

**Files:**
- Create: `src/shared/services/loader/loader.ts`
- Create: `src/shared/services/loader/loader.spec.ts`
- Create: `src/shared/interceptors/loading.interceptor.ts`
- Create: `src/shared/interceptors/loading.interceptor.spec.ts`
- Create: `src/shared/components/global-loader/global-loader.ts`
- Create: `src/shared/components/global-loader/global-loader.html`
- Create: `src/shared/components/global-loader/global-loader.css`
- Modify: `src/app/app.config.ts`
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`

**Interfaces:**
- Produces:
  - `LoaderService.show(): void`, `hide(): void`, `isLoading(): boolean` (signal-backed)
  - `loadingInterceptor: HttpInterceptorFn`
  - `GlobalLoader` component

- [ ] **Step 1: Write failing LoaderService + interceptor specs**

Create `src/shared/services/loader/loader.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';

import { LoaderService } from './loader';

describe('LoaderService', () => {
  let loader: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    loader = TestBed.inject(LoaderService);
  });

  it('should start not loading', () => {
    expect(loader.isLoading()).toBeFalse();
  });

  it('should track nested show/hide with a counter', () => {
    loader.show();
    expect(loader.isLoading()).toBeTrue();
    loader.show();
    expect(loader.isLoading()).toBeTrue();
    loader.hide();
    expect(loader.isLoading()).toBeTrue();
    loader.hide();
    expect(loader.isLoading()).toBeFalse();
  });

  it('should not go below zero on hide', () => {
    loader.hide();
    expect(loader.isLoading()).toBeFalse();
  });
});
```

Create `src/shared/interceptors/loading.interceptor.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { loadingInterceptor } from './loading.interceptor';
import { LoaderService } from '../services/loader/loader';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loader: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loader = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show loader during request and hide after response', () => {
    expect(loader.isLoading()).toBeFalse();
    http.get('/test').subscribe();
    expect(loader.isLoading()).toBeTrue();
    httpMock.expectOne('/test').flush({});
    expect(loader.isLoading()).toBeFalse();
  });

  it('should hide loader after error response', () => {
    http.get('/test').subscribe({ error: () => undefined });
    expect(loader.isLoading()).toBeTrue();
    httpMock.expectOne('/test').flush('fail', {
      status: 500,
      statusText: 'Server Error',
    });
    expect(loader.isLoading()).toBeFalse();
  });
});
```

- [ ] **Step 2: Run loader specs to verify they fail**

Run:

```bash
npx ng test --include=src/shared/services/loader/loader.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --include=src/shared/interceptors/loading.interceptor.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: FAIL (missing modules).

- [ ] **Step 3: Implement LoaderService, interceptor, GlobalLoader, wire app**

Create `src/shared/services/loader/loader.ts`:

```ts
import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private readonly activeCount = signal(0);

  readonly isLoading = computed(() => this.activeCount() > 0);

  show(): void {
    this.activeCount.update((count) => count + 1);
  }

  hide(): void {
    this.activeCount.update((count) => Math.max(0, count - 1));
  }
}
```

Create `src/shared/interceptors/loading.interceptor.ts`:

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LoaderService } from '../services/loader/loader';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);
  loader.show();
  return next(req).pipe(finalize(() => loader.hide()));
};
```

Create `src/shared/components/global-loader/global-loader.ts`:

```ts
import { Component, inject } from '@angular/core';

import { LoaderService } from '../../services/loader/loader';

@Component({
  selector: 'app-global-loader',
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.css',
})
export class GlobalLoader {
  readonly loader = inject(LoaderService);
}
```

Create `src/shared/components/global-loader/global-loader.html`:

```html
@if (loader.isLoading()) {
  <div class="global-loader" role="progressbar" aria-busy="true" aria-label="Loading">
    <div class="global-loader__spinner"></div>
  </div>
}
```

Create `src/shared/components/global-loader/global-loader.css`:

```css
.global-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 33, 55, 0.45);
}

.global-loader__spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-top-color: #f5a623;
  border-radius: 50%;
  animation: global-loader-spin 0.7s linear infinite;
}

@keyframes global-loader-spin {
  to {
    transform: rotate(360deg);
  }
}
```

Update `src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { loadingInterceptor } from '../shared/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor])),
  ],
};
```

Update `src/app/app.ts`:

```ts
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GlobalLoader } from '../shared/components/global-loader/global-loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('attendWebApp');
}
```

Update `src/app/app.html`:

```html
<router-outlet />
<app-global-loader />
```

- [ ] **Step 4: Run loader + interceptor specs; full suite**

```bash
npx ng test --include=src/shared/services/loader/loader.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --include=src/shared/interceptors/loading.interceptor.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --browsers=ChromeHeadless --watch=false
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/services/loader src/shared/interceptors src/shared/components/global-loader src/app/app.config.ts src/app/app.ts src/app/app.html
git commit -m "feat(http): add global loading overlay via HTTP interceptor"
```

---

### Task 4: Full verification

- [ ] **Step 1: Run full suite**

`npx ng test --browsers=ChromeHeadless --watch=false` → all PASS

- [ ] **Step 2: Manual smoke (if backends up)**

1. Invalid login → note shows API `"Invalid email or password"` (or server message), overlay appears during request
2. Valid login → dashboard sidebar shows `empName` / `empRole` / initials from session
3. Forgot-password failure → API message in note

- [ ] **Step 3: Commit fixes only if needed**

---

## Self-review checklist (plan author)

| Spec requirement | Task |
|------------------|------|
| `apiErrorMessage` + Login/Forgot wire | Task 1 |
| Sidebar empName/empRole/initials | Task 2 |
| LoaderService counter | Task 3 |
| loadingInterceptor + provideHttpClient | Task 3 |
| GlobalLoader in app.html | Task 3 |
| Full verification | Task 4 |
| No Bearer / logout | Out of scope |
