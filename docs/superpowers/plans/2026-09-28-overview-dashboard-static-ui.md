# Overview Dashboard Static UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `Dashboard` stub with a static Overview page matching the screenshots: summary cards, attendance-by-location progress bars, role-gated “Needs review today”, and a pure-UI missed check-outs modal.

**Architecture:** Single standalone `Dashboard` component reads `Auth.getUser()?.empRoleId`. Static arrays drive the UI. `empRoleId === 2` shows the needs-review card and can open/close a modal; Approve/Decline have no handlers. Shell (sidebar/topbar) is unchanged.

**Tech Stack:** Angular 20 standalone, Font Awesome (already loaded), Jasmine + Karma, DM Sans / existing design tokens.

**Spec:** `docs/superpowers/specs/2026-09-28-overview-dashboard-static-ui-design.md`

## Global Constraints

- Role source: `Auth.getUser()?.empRoleId` only (screenshot `roleId`)
- Role `1` (or missing user/role): summary + locations only — hide needs-review and modal trigger
- Role `2`: full UI including needs-review + Take action modal
- Approve/Decline: visual only — no click handlers, no list mutation
- Modal: `openModal()` / `closeModal()`; Close button and backdrop dismiss
- No Overview API, no new routes/services, no sidebar/topbar changes
- ASCII-safe UI strings; match screenshot look (navy `#0f2137`, accent `#f5a623` / orange, page bg `#f4f6fa`)

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/pages/dashboard/dashboard.ts` | Auth inject, static data, `empRoleId`, modal open/close |
| `src/pages/dashboard/dashboard.html` | Summary, locations, needs-review `@if`, modal |
| `src/pages/dashboard/dashboard.css` | Screenshot-matching page styles |
| `src/pages/dashboard/dashboard.spec.ts` | Role visibility + modal open/close + static labels |

---

### Task 1: Dashboard logic + role/modal specs

**Files:**
- Modify: `src/pages/dashboard/dashboard.ts`
- Modify: `src/pages/dashboard/dashboard.html`
- Modify: `src/pages/dashboard/dashboard.spec.ts`

**Interfaces:**
- Consumes: `Auth.getUser(): LoginUserData | null` (`empRoleId: number`)
- Produces:
  - `empRoleId: number | null`
  - `showNeedsReview: boolean` (true only when `empRoleId === 2`)
  - `summary: { totalEmployees: number; checkedIn: number; yetToCheckIn: number }`
  - `locations: { city: string; present: number; total: number }[]`
  - `reviewItems: { name: string; location: string; status: string }[]`
  - `modalItems: { name: string; location: string; supervisor: string; note: string }[]`
  - `isModalOpen: boolean`
  - `openModal(): void` / `closeModal(): void`
  - `percentPresent(present: number, total: number): number`

- [ ] **Step 1: Write failing Dashboard specs**

Replace `src/pages/dashboard/dashboard.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Auth } from '../../shared/services/auth/auth';
import { LoginUserData } from '../../shared/utils/interface/auth-response.interface';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let auth: jasmine.SpyObj<Auth>;

  const baseUser: LoginUserData = {
    empId: 1,
    empName: 'Joseph J',
    empEmail: 'joe_f@trigent.com',
    empRoleId: 1,
    empRole: 'Human Resource/ Admin',
    token: 'test-token',
    tokenType: 'Bearer',
    expiresIn: 86400,
    expiryTime: '2026-09-26T03:59:19.118Z',
  };

  async function setup(user: LoginUserData | null): Promise<void> {
    auth = jasmine.createSpyObj<Auth>('Auth', ['getUser']);
    auth.getUser.and.returnValue(user);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [{ provide: Auth, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup(baseUser);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show summary and locations for role 1 and hide needs review', async () => {
    await setup({ ...baseUser, empRoleId: 1 });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('207');
    expect(text).toContain('Total Employees');
    expect(text).toContain('188');
    expect(text).toContain('Checked In');
    expect(text).toContain('19');
    expect(text).toContain('Yet to Check In');
    expect(text).toContain('Attendance by location');
    expect(text).toContain('Bangalore');
    expect(text).toContain('72 of 78 present');
    expect(text).not.toContain('Needs review today');
    expect(text).not.toContain('Take action');
  });

  it('should hide needs review when user is missing', async () => {
    await setup(null);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Attendance by location');
    expect(text).not.toContain('Needs review today');
  });

  it('should show needs review for role 2 and open/close modal', async () => {
    await setup({
      ...baseUser,
      empRoleId: 2,
      empRole: 'Account Manager',
    });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Needs review today');
    expect(text).toContain('John Mathew');
    expect(text).toContain('Missed check-out');

    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();

    const takeAction = fixture.debugElement.query(By.css('button.overview-review__action'));
    takeAction.triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.overview-modal'))).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Missed check-outs · supervisor notes',
    );
    expect(fixture.nativeElement.textContent).toContain('Sneha Iyer');

    const closeBtn = fixture.debugElement.query(By.css('button.overview-modal__close'));
    closeBtn.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();
  });

  it('should close modal when backdrop is clicked', async () => {
    await setup({
      ...baseUser,
      empRoleId: 2,
      empRole: 'Account Manager',
    });

    fixture.componentInstance.openModal();
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(By.css('.overview-modal-backdrop'));
    backdrop.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();
  });
});
```

- [ ] **Step 2: Run specs to verify they fail**

```bash
npx ng test --include=src/pages/dashboard/dashboard.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: FAIL (stub template / no Auth / missing selectors).

- [ ] **Step 3: Implement Dashboard TypeScript + template hooks**

Replace `src/pages/dashboard/dashboard.ts` with:

```ts
import { Component, inject } from '@angular/core';

import { Auth } from '../../shared/services/auth/auth';

export interface OverviewLocationRow {
  city: string;
  present: number;
  total: number;
}

export interface OverviewReviewItem {
  name: string;
  location: string;
  status: string;
}

export interface OverviewModalItem {
  name: string;
  location: string;
  supervisor: string;
  note: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly auth = inject(Auth);

  readonly summary = {
    totalEmployees: 207,
    checkedIn: 188,
    yetToCheckIn: 19,
  };

  readonly locations: OverviewLocationRow[] = [
    { city: 'Bangalore', present: 72, total: 78 },
    { city: 'Chennai', present: 34, total: 36 },
    { city: 'Mumbai', present: 28, total: 32 },
    { city: 'Pune', present: 21, total: 23 },
    { city: 'Hyderabad', present: 19, total: 22 },
    { city: 'Gurgaon', present: 14, total: 16 },
  ];

  readonly reviewItems: OverviewReviewItem[] = [
    {
      name: 'John Mathew',
      location: 'Bangalore · BLR 3',
      status: 'Missed check-out',
    },
    {
      name: 'Vikram R',
      location: 'Chennai · CHN 1',
      status: 'Missed check-out',
    },
    {
      name: 'Deepa Nair',
      location: 'Mumbai · BOM 2',
      status: 'Missed check-out',
    },
  ];

  readonly modalItems: OverviewModalItem[] = [
    {
      name: 'John Mathew',
      location: 'Bangalore · BLR 3',
      supervisor: 'Sneha Iyer',
      note: 'Left site at 6:15 PM for a client call. Confirmed by gate register.',
    },
    {
      name: 'Vikram R',
      location: 'Chennai · CHN 1',
      supervisor: 'Karthik Menon',
      note: 'Phone battery died on site. Verified by team lead.',
    },
    {
      name: 'Deepa Nair',
      location: 'Mumbai · BOM 2',
      supervisor: 'Priya Desai',
      note: 'Left early for a family emergency. Approved verbally.',
    },
  ];

  isModalOpen = false;

  get empRoleId(): number | null {
    return this.auth.getUser()?.empRoleId ?? null;
  }

  get showNeedsReview(): boolean {
    return this.empRoleId === 2;
  }

  percentPresent(present: number, total: number): number {
    if (total <= 0) {
      return 0;
    }
    return Math.round((present / total) * 100);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}
```

Replace `src/pages/dashboard/dashboard.html` with a functional (not yet fully styled) structure:

```html
<section class="overview">
  <div class="overview-summary">
    <article class="overview-summary__card overview-summary__card--total">
      <div class="overview-summary__value">{{ summary.totalEmployees }}</div>
      <div class="overview-summary__label">Total Employees</div>
    </article>
    <article class="overview-summary__card overview-summary__card--checked">
      <div class="overview-summary__value">{{ summary.checkedIn }}</div>
      <div class="overview-summary__label">Checked In</div>
    </article>
    <article class="overview-summary__card overview-summary__card--pending">
      <div class="overview-summary__value">{{ summary.yetToCheckIn }}</div>
      <div class="overview-summary__label">Yet to Check In</div>
    </article>
  </div>

  <div
    class="overview-grid"
    [class.overview-grid--single]="!showNeedsReview"
  >
    <section class="overview-card overview-locations">
      <h2 class="overview-card__title">Attendance by location</h2>
      <ul class="overview-locations__list">
        @for (row of locations; track row.city) {
          <li class="overview-locations__row">
            <div class="overview-locations__meta">
              <span class="overview-locations__city">{{ row.city }}</span>
              <span class="overview-locations__count"
                >{{ row.present }} of {{ row.total }} present</span
              >
            </div>
            <div class="overview-locations__track" aria-hidden="true">
              <div
                class="overview-locations__fill"
                [style.width.%]="percentPresent(row.present, row.total)"
              ></div>
            </div>
          </li>
        }
      </ul>
    </section>

    @if (showNeedsReview) {
      <section class="overview-card overview-review">
        <div class="overview-review__header">
          <h2 class="overview-card__title">Needs review today</h2>
          <span class="overview-review__badge">{{ reviewItems.length }}</span>
        </div>
        <ul class="overview-review__list">
          @for (item of reviewItems; track item.name) {
            <li class="overview-review__item">
              <div class="overview-review__person">
                <div class="overview-review__name">{{ item.name }}</div>
                <div class="overview-review__location">{{ item.location }}</div>
              </div>
              <div class="overview-review__status">{{ item.status }}</div>
            </li>
          }
        </ul>
        <div class="overview-review__footer">
          <button
            type="button"
            class="overview-review__action"
            (click)="openModal()"
          >
            Take action
          </button>
        </div>
      </section>
    }
  </div>
</section>

@if (isModalOpen) {
  <div
    class="overview-modal-backdrop"
    (click)="closeModal()"
    role="presentation"
  ></div>
  <div
    class="overview-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="overview-modal-title"
    (click)="$event.stopPropagation()"
  >
    <div class="overview-modal__header">
      <h2 id="overview-modal-title" class="overview-modal__title">
        Missed check-outs · supervisor notes
      </h2>
      <p class="overview-modal__subtitle">{{ modalItems.length }} employees</p>
    </div>
    <ul class="overview-modal__list">
      @for (item of modalItems; track item.name) {
        <li class="overview-modal__item">
          <div class="overview-modal__name">{{ item.name }}</div>
          <div class="overview-modal__location">{{ item.location }}</div>
          <div class="overview-modal__note">
            <div class="overview-modal__supervisor">
              SUPERVISOR · {{ item.supervisor }}
            </div>
            <p class="overview-modal__note-text">{{ item.note }}</p>
          </div>
          <div class="overview-modal__actions">
            <button type="button" class="overview-modal__decline">Decline</button>
            <button type="button" class="overview-modal__approve">Approve</button>
          </div>
        </li>
      }
    </ul>
    <div class="overview-modal__footer">
      <button
        type="button"
        class="overview-modal__close"
        (click)="closeModal()"
      >
        Close
      </button>
    </div>
  </div>
}
```

Keep `dashboard.css` empty or minimal for this task (full styles in Task 2).

- [ ] **Step 4: Run specs to verify they pass**

```bash
npx ng test --include=src/pages/dashboard/dashboard.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: PASS (all Dashboard specs).

- [ ] **Step 5: Commit**

```bash
git add src/pages/dashboard/dashboard.ts src/pages/dashboard/dashboard.html src/pages/dashboard/dashboard.spec.ts
git commit -m "feat(overview): add static dashboard data, role gating, and modal"
```

---

### Task 2: Screenshot-matching styles

**Files:**
- Modify: `src/pages/dashboard/dashboard.css`
- Modify: `src/pages/dashboard/dashboard.html` (only if a class/wrapper is needed for layout fidelity)

**Interfaces:**
- Consumes: class names from Task 1 (`overview-*`)
- Produces: visual match to screenshots 1–3

- [ ] **Step 1: Implement `dashboard.css`**

Replace `src/pages/dashboard/dashboard.css` with:

```css
:host {
  --overview-navy: #0f2137;
  --overview-muted: #6b7280;
  --overview-border: rgba(15, 33, 55, 0.1);
  --overview-accent: #f5a623;
  --overview-accent-text: #c2410c;
  --overview-checked-bg: #fff7ed;
  --overview-pending-bg: #fef2f2;
  --overview-pending-text: #b91c1c;
  --overview-approve-bg: #ecfdf5;
  --overview-approve-text: #047857;
  --overview-decline: #dc2626;
  --overview-card-bg: #ffffff;
  --overview-track: #e8edf5;

  display: block;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--overview-navy);
}

.overview {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.overview-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.overview-summary__card {
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--overview-border);
  border-radius: 0.85rem;
  background: var(--overview-card-bg);
}

.overview-summary__card--checked {
  background: var(--overview-checked-bg);
  border-color: rgba(245, 166, 35, 0.35);
}

.overview-summary__card--pending {
  background: var(--overview-pending-bg);
  border-color: rgba(185, 28, 28, 0.25);
}

.overview-summary__value {
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--overview-navy);
}

.overview-summary__card--checked .overview-summary__value {
  color: var(--overview-accent);
}

.overview-summary__card--pending .overview-summary__value {
  color: var(--overview-pending-text);
}

.overview-summary__label {
  margin-top: 0.35rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--overview-muted);
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
  gap: 1rem;
  align-items: start;
}

.overview-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.overview-card {
  padding: 1.25rem 1.35rem 1.35rem;
  border: 1px solid var(--overview-border);
  border-radius: 0.9rem;
  background: var(--overview-card-bg);
}

.overview-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--overview-navy);
}

.overview-locations__list {
  list-style: none;
  margin: 1.1rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
}

.overview-locations__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.45rem;
}

.overview-locations__city {
  font-weight: 700;
  font-size: 0.95rem;
}

.overview-locations__count {
  font-size: 0.88rem;
  color: var(--overview-muted);
  white-space: nowrap;
}

.overview-locations__track {
  height: 0.55rem;
  border-radius: 999px;
  background: var(--overview-track);
  overflow: hidden;
}

.overview-locations__fill {
  height: 100%;
  border-radius: inherit;
  background: var(--overview-accent);
}

.overview-review__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.overview-review__badge {
  display: inline-grid;
  place-items: center;
  min-width: 1.55rem;
  height: 1.55rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: #ffedd5;
  color: #c2410c;
  font-size: 0.8rem;
  font-weight: 700;
}

.overview-review__list {
  list-style: none;
  margin: 0.85rem 0 0;
  padding: 0;
}

.overview-review__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  border-top: 1px solid var(--overview-border);
}

.overview-review__item:first-child {
  border-top: 0;
  padding-top: 0.35rem;
}

.overview-review__name {
  font-weight: 700;
  font-size: 0.95rem;
}

.overview-review__location {
  margin-top: 0.2rem;
  font-size: 0.85rem;
  color: var(--overview-muted);
}

.overview-review__status {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--overview-accent-text);
  white-space: nowrap;
}

.overview-review__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.overview-review__action {
  border: 0;
  border-radius: 0.55rem;
  padding: 0.55rem 1rem;
  background: var(--overview-accent);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.overview-review__action:hover {
  filter: brightness(0.96);
}

.overview-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(15, 33, 55, 0.45);
}

.overview-modal {
  position: fixed;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(560px, calc(100vw - 2rem));
  max-height: min(85vh, 720px);
  overflow: auto;
  padding: 1.35rem 1.4rem 1.15rem;
  border-radius: 0.95rem;
  background: #fff;
  box-shadow: 0 18px 50px rgba(15, 33, 55, 0.22);
}

.overview-modal__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}

.overview-modal__subtitle {
  margin: 0.3rem 0 0;
  font-size: 0.88rem;
  color: var(--overview-muted);
}

.overview-modal__list {
  list-style: none;
  margin: 1.15rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.overview-modal__name {
  font-weight: 700;
  font-size: 0.98rem;
}

.overview-modal__location {
  margin-top: 0.15rem;
  font-size: 0.85rem;
  color: var(--overview-muted);
}

.overview-modal__note {
  margin-top: 0.65rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.65rem;
  background: #f4f6fa;
}

.overview-modal__supervisor {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--overview-muted);
  text-transform: uppercase;
}

.overview-modal__note-text {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--overview-navy);
}

.overview-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
  margin-top: 0.7rem;
}

.overview-modal__decline,
.overview-modal__approve,
.overview-modal__close {
  border-radius: 0.5rem;
  padding: 0.4rem 0.85rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: default;
}

.overview-modal__decline {
  border: 1px solid var(--overview-decline);
  background: #fff;
  color: var(--overview-decline);
}

.overview-modal__approve {
  border: 1px solid transparent;
  background: var(--overview-approve-bg);
  color: var(--overview-approve-text);
}

.overview-modal__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.15rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--overview-border);
}

.overview-modal__close {
  border: 1px solid rgba(15, 33, 55, 0.18);
  background: #fff;
  color: var(--overview-navy);
  cursor: pointer;
}

.overview-modal__close:hover {
  background: #f7f8fb;
}

@media (max-width: 900px) {
  .overview-summary {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}
```

Note: Approve/Decline use `cursor: default` because they are visual-only (no handlers). Close keeps `pointer` + click handler.

- [ ] **Step 2: Visual check against screenshots**

With `ng serve` running, log in (or set `auth_user` in localStorage) and verify:

1. `empRoleId: 1` — screenshot 3: three summary cards + full-width location card; no needs-review
2. `empRoleId: 2` — screenshot 1: two-column layout with needs-review + Take action
3. Take action — screenshot 2: modal with supervisor notes, Decline/Approve styling, Close works

Quick localStorage shape for manual role switch (DevTools):

```js
const u = JSON.parse(localStorage.getItem('auth_user'));
u.empRoleId = 2; // or 1
localStorage.setItem('auth_user', JSON.stringify(u));
location.reload();
```

- [ ] **Step 3: Re-run Dashboard specs**

```bash
npx ng test --include=src/pages/dashboard/dashboard.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/dashboard/dashboard.css src/pages/dashboard/dashboard.html
git commit -m "style(overview): match static dashboard screenshot UI"
```

---

## Plan self-review

**Spec coverage**
- Summary cards → Task 1 template + Task 2 styles
- Attendance by location + progress % → Task 1
- Needs review role gating → Task 1 (`showNeedsReview`)
- Modal open/close + backdrop → Task 1
- Approve/Decline visual only → Task 1 (no handlers) + Task 2 (`cursor: default`)
- Missing user → Task 1 spec + `empRoleId` null fallback
- No API / shell changes → respected

**Placeholders:** None — supervisor names for Vikram/Deepa are concrete static copy aligned with screenshot intent (John/Sneha note is verbatim from screenshot).

**Type consistency:** `showNeedsReview`, `openModal` / `closeModal`, `overview-modal` / `overview-review__action` / `overview-modal__close` / `overview-modal-backdrop` used consistently across tasks and specs.
