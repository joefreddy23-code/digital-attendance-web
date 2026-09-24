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

- [ ] **Step 2: Run tests â€” expect FAIL**

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
    // Static UI only â€” no API in this POC
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

- [ ] **Step 6: Run ForgotPassword tests â€” expect PASS**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/forgot-password/forgot-password.spec.ts`

Expected: All specs PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/forgot-password/forgot-password.ts src/pages/auth/forgot-password/forgot-password.html src/pages/auth/forgot-password/forgot-password.css src/pages/auth/forgot-password/forgot-password.spec.ts
git commit -m "feat: add forgot-password glass card matching auth UI"
```

---

