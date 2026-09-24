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

- [ ] **Step 2: Run tests â€” expect FAIL**

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

- [ ] **Step 6: Run Login tests â€” expect PASS**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/login/login.spec.ts`

Expected: All Login specs PASS. If `a[routerLink=...]` query fails, assert via `By.css('a.auth-card__link')` and `routerLink` attribute presence instead.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/login/login.ts src/pages/auth/login/login.html src/pages/auth/login/login.css src/pages/auth/login/login.spec.ts
git commit -m "feat: add login glass card matching auth UI"
```

