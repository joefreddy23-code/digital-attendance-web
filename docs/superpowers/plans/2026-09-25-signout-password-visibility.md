# Sign Out + Password Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Auth.logout()` that wipes all localStorage and navigates to `/login`; wire Topbar Sign out to it; add Login password show/hide eye toggle.

**Architecture:** Approach 2 — `Auth.logout()` owns `localStorage.clear()` + navigate; Topbar delegates; Login keeps a local `passwordVisible` flag with Font Awesome eye icons.

**Tech Stack:** Angular 20 standalone, Font Awesome (already loaded), Jasmine + Karma.

**Spec:** `docs/superpowers/specs/2026-09-25-signout-password-visibility-design.md`

## Global Constraints

- Logout: `localStorage.clear()` (all keys), then `/login`
- Keep `clearSession()` unchanged (auth keys only)
- Password toggle: Login only; default hidden; `fa-eye` / `fa-eye-slash`; `type="button"`
- Prefer existing auth/topbar patterns; ASCII-safe UI strings

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/shared/services/auth/auth.ts` (+ spec) | `logout()` |
| `src/shared/components/topbar/topbar.ts` (+ spec) | Call `auth.logout()` |
| `src/pages/auth/login/login.ts` / `.html` / `.css` (+ spec) | Password visibility |

---

### Task 1: Auth.logout() + Topbar Sign out

**Files:**
- Modify: `src/shared/services/auth/auth.ts`
- Modify: `src/shared/services/auth/auth.spec.ts`
- Modify: `src/shared/components/topbar/topbar.ts`
- Modify: `src/shared/components/topbar/topbar.spec.ts`
- Modify: `src/shared/layouts/main/main.spec.ts` (add `logout` to Auth spy if needed)

**Interfaces:**
- Produces: `Auth.logout(): void`

- [ ] **Step 1: Write failing Auth logout + Topbar specs**

Add to `auth.spec.ts` (ensure `provideRouter([])` and spy on `navigateByUrl`):

```ts
  it('should clear all localStorage and navigate to login on logout', () => {
    localStorage.setItem('auth_token', 't');
    localStorage.setItem('other_key', 'x');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('other_key')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
```

Update Auth `beforeEach` to include `provideRouter([])` if missing.

Replace Topbar sign-out test to spy `Auth.logout`:

```ts
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['logout']);
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: Auth, useValue: auth },
      ],
    }).compileComponents();
    // ...
  });

  it('should show Overview title and call Auth.logout on sign out', () => {
    expect(fixture.nativeElement.textContent).toContain('Overview');
    const signOut = fixture.debugElement.query(By.css('button.topbar__signout'));
    signOut.triggerEventHandler('click', {});
    expect(auth.logout).toHaveBeenCalled();
  });
```

In `main.spec.ts`, add `'logout'` to the Auth spy method list so injection stays safe.

- [ ] **Step 2: Run specs to verify they fail**

```bash
npx ng test --include=src/shared/services/auth/auth.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --include=src/shared/components/topbar/topbar.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: FAIL (no `logout` / still navigates from Topbar only).

- [ ] **Step 3: Implement**

In `auth.ts`:

```ts
import { Router } from '@angular/router';

export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // ... existing methods ...

  logout(): void {
    localStorage.clear();
    void this.router.navigateByUrl('/login');
  }
}
```

In `topbar.ts`:

```ts
import { Auth } from '../../services/auth/auth';

export class Topbar {
  private readonly layout = inject(MainLayoutService);
  private readonly auth = inject(Auth);
  // remove unused router if only used for signOut — keep if still used for pageTitle

  signOut(): void {
    this.auth.logout();
  }
}
```

Keep Router inject for `pageTitle` (still needed).

- [ ] **Step 4: Run specs to verify they pass**

Same includes + `main.spec.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/services/auth/auth.ts src/shared/services/auth/auth.spec.ts src/shared/components/topbar/topbar.ts src/shared/components/topbar/topbar.spec.ts src/shared/layouts/main/main.spec.ts
git commit -m "feat(auth): clear all localStorage on logout via Auth.logout"
```

---

### Task 2: Login password visibility toggle

**Files:**
- Modify: `src/pages/auth/login/login.ts`
- Modify: `src/pages/auth/login/login.html`
- Modify: `src/pages/auth/login/login.css`
- Modify: `src/pages/auth/login/login.spec.ts`

**Interfaces:**
- Produces: `passwordVisible: boolean`, `togglePasswordVisibility(): void`

- [ ] **Step 1: Write failing Login visibility specs**

Add to `login.spec.ts`:

```ts
  it('should default password field to type password with show control', () => {
    const input = fixture.debugElement.query(By.css('input[formControlName="password"]'));
    expect(input.nativeElement.getAttribute('type')).toBe('password');
    const toggle = fixture.debugElement.query(By.css('button.auth-field__toggle'));
    expect(toggle).toBeTruthy();
    expect(toggle.nativeElement.getAttribute('aria-label')).toBe('Show password');
  });

  it('should toggle password visibility on eye button click', () => {
    const toggle = fixture.debugElement.query(By.css('button.auth-field__toggle'));
    toggle.triggerEventHandler('click', {});
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input[formControlName="password"]'));
    expect(input.nativeElement.getAttribute('type')).toBe('text');
    expect(toggle.nativeElement.getAttribute('aria-label')).toBe('Hide password');
    expect(toggle.nativeElement.querySelector('i.fa-eye-slash')).toBeTruthy();

    toggle.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(input.nativeElement.getAttribute('type')).toBe('password');
    expect(toggle.nativeElement.getAttribute('aria-label')).toBe('Show password');
  });
```

- [ ] **Step 2: Run Login specs to verify they fail**

`npx ng test --include=src/pages/auth/login/login.spec.ts --browsers=ChromeHeadless --watch=false`

Expected: FAIL (no toggle).

- [ ] **Step 3: Implement toggle**

In `login.ts` add:

```ts
  passwordVisible = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
```

Replace password field block in `login.html`:

```html
    <label class="auth-field">
      <span class="auth-field__label">Password</span>
      <div class="auth-field__control">
        <input
          class="auth-field__input auth-field__input--with-toggle"
          [class.auth-field__input--invalid]="showError('password')"
          [type]="passwordVisible ? 'text' : 'password'"
          formControlName="password"
          autocomplete="current-password"
        />
        <button
          type="button"
          class="auth-field__toggle"
          (click)="togglePasswordVisibility()"
          [attr.aria-label]="passwordVisible ? 'Hide password' : 'Show password'"
        >
          <i
            class="fa-solid"
            [class.fa-eye]="!passwordVisible"
            [class.fa-eye-slash]="passwordVisible"
            aria-hidden="true"
          ></i>
        </button>
      </div>
      @if (passwordErrorMessage(); as message) {
        <span class="auth-field__error">{{ message }}</span>
      }
    </label>
```

Append to `login.css`:

```css
.auth-field__control {
  position: relative;
  display: block;
}

.auth-field__input--with-toggle {
  padding-right: 2.75rem;
}

.auth-field__toggle {
  position: absolute;
  top: 50%;
  right: 0.65rem;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: 0;
  background: transparent;
  color: var(--auth-muted);
  cursor: pointer;
}

.auth-field__toggle:hover {
  color: var(--auth-text);
}
```

- [ ] **Step 4: Run Login specs to verify they pass**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth/login/login.ts src/pages/auth/login/login.html src/pages/auth/login/login.css src/pages/auth/login/login.spec.ts
git commit -m "feat(login): add password visibility toggle"
```

---

### Task 3: Full verification

- [ ] **Step 1:** `npx ng test --browsers=ChromeHeadless --watch=false` → all PASS  
- [ ] **Step 2:** Manual: Sign out clears storage + lands on login; eye toggles password  
- [ ] **Step 3:** Commit fixes only if needed  

---

## Self-review checklist

| Spec item | Task |
|-----------|------|
| `Auth.logout` clear all + navigate | Task 1 |
| Topbar calls logout | Task 1 |
| Password eye toggle | Task 2 |
| Full verify | Task 3 |
