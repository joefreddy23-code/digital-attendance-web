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

- [ ] **Step 2: Run tests â€” expect FAIL**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/auth/auth.spec.ts`

Expected: FAIL (template still says â€œauth works!â€ / missing brand).

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
            <div class="auth-brand__tagline">Attendance &amp; Compliance Â· Admin portal</div>
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
                â€” {{ feature.detail }}
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

- [ ] **Step 6: Run Auth tests â€” expect PASS**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/auth/auth.spec.ts`

Expected: All Auth specs PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/layouts/auth/auth.ts src/shared/layouts/auth/auth.html src/shared/layouts/auth/auth.css src/shared/layouts/auth/auth.spec.ts
git commit -m "feat: build auth layout shell with route-driven copy"
```

---

