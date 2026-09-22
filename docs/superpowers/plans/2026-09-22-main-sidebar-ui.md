# Main Sidebar & Shell UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a collapsible navy Main sidebar (Font Awesome icons) toggled by a topbar burger, wired through Main layout with Overview/Employees/Locations/Reports navigation.

**Architecture:** `MainLayoutService` owns `sidebarExpanded` signal. Sidebar and Topbar inject it. Main layout composes Sidebar + Topbar + `<router-outlet>` in a flex shell with width transition.

**Tech Stack:** Angular 20 standalone components, Angular Router (`RouterLink` / `RouterLinkActive`), Font Awesome Free CSS, Bootstrap already global (layout uses custom flex, not Bootstrap sidebar).

**Spec:** `docs/superpowers/specs/2026-09-22-main-sidebar-ui-design.md`

## Global Constraints

- Burger on topbar left toggles expand/collapse.
- Nav: Overview→`/dashboard`, Employees→`/employees`, Locations→`/locations`, Reports→`/reports`; no Attendance item.
- Icons: Font Awesome `fa-house`, `fa-user`, `fa-location-dot`, `fa-clock`, `fa-bars`, `fa-chevron-down`.
- Collapsed ~72px (icons only); expanded ~240px (labels + brand text + profile card).
- Colors: `--sidebar-bg #0f2137`, accent `#f5a623`, muted `#a8bdd6`.
- Default: expanded on load.
- Profile static: Pooja D / HR Admin / PD; chevron visual only.
- Brand collapsed: `trigentLogoIcon.png`; expanded: mark + TRIGENT + “Attendance & Compliance”.
- Width transition ~250ms ease.
- Work on branch `feat/auth-login-ui` (or current feature branch); commit only files listed per task.

---

## File structure

| File | Responsibility |
|------|----------------|
| `package.json` / lockfile | `@fortawesome/fontawesome-free` dependency |
| `src/styles.css` | Import FA CSS |
| `src/shared/services/main-layout/main-layout.ts` | `sidebarExpanded` + `toggleSidebar` |
| `src/shared/services/main-layout/main-layout.spec.ts` | Service unit tests |
| `src/shared/components/sidebar/*` | Collapsible sidebar UI |
| `src/shared/components/topbar/*` | Burger + minimal bar |
| `src/shared/layouts/main/*` | Shell composition |

---

### Task 1: Font Awesome + MainLayoutService

**Files:**
- Modify: `package.json` (via npm install), `package-lock.json`, `src/styles.css`
- Create: `src/shared/services/main-layout/main-layout.ts`
- Create: `src/shared/services/main-layout/main-layout.spec.ts`

**Interfaces:**
- Consumes: none
- Produces: `MainLayoutService` with `readonly sidebarExpanded = signal(true)` and `toggleSidebar(): void`

- [ ] **Step 1: Install Font Awesome**

Run:

```bash
npm install @fortawesome/fontawesome-free
```

- [ ] **Step 2: Import FA in `src/styles.css`**

Ensure file contains (keep existing Bootstrap/body rules):

```css
@import 'bootstrap/dist/css/bootstrap.min.css';
@import '@fortawesome/fontawesome-free/css/all.min.css';

html,
body {
  height: 100%;
  margin: 0;
}

body {
  font-family: 'DM Sans', system-ui, sans-serif;
}
```

- [ ] **Step 3: Write failing service test**

Create `src/shared/services/main-layout/main-layout.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';

import { MainLayoutService } from './main-layout';

describe('MainLayoutService', () => {
  let service: MainLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainLayoutService);
  });

  it('should start expanded', () => {
    expect(service.sidebarExpanded()).toBeTrue();
  });

  it('should toggle sidebarExpanded', () => {
    service.toggleSidebar();
    expect(service.sidebarExpanded()).toBeFalse();
    service.toggleSidebar();
    expect(service.sidebarExpanded()).toBeTrue();
  });
});
```

- [ ] **Step 4: Run test — expect FAIL**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/services/main-layout/main-layout.spec.ts`

Expected: FAIL (service missing).

- [ ] **Step 5: Implement service**

Create `src/shared/services/main-layout/main-layout.ts`:

```ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MainLayoutService {
  readonly sidebarExpanded = signal(true);

  toggleSidebar(): void {
    this.sidebarExpanded.update((v) => !v);
  }
}
```

- [ ] **Step 6: Run test — expect PASS**

Run same command as Step 4. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/styles.css src/shared/services/main-layout/main-layout.ts src/shared/services/main-layout/main-layout.spec.ts
git commit -m "feat: add Font Awesome and main layout sidebar state service"
```

---

### Task 2: Sidebar component

**Files:**
- Modify: `src/shared/components/sidebar/sidebar.ts`
- Modify: `src/shared/components/sidebar/sidebar.html`
- Modify: `src/shared/components/sidebar/sidebar.css`
- Modify: `src/shared/components/sidebar/sidebar.spec.ts`

**Interfaces:**
- Consumes: `MainLayoutService.sidebarExpanded`
- Produces: Nav links to `/dashboard`, `/employees`, `/locations`, `/reports` with `RouterLinkActive`

- [ ] **Step 1: Write failing Sidebar tests**

Replace `sidebar.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { MainLayoutService } from '../../services/main-layout/main-layout';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let layout: MainLayoutService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    layout = TestBed.inject(MainLayoutService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show labels when expanded and hide when collapsed', () => {
    expect(fixture.nativeElement.classList.contains('sidebar--collapsed')).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Overview');
    expect(fixture.nativeElement.textContent).toContain('TRIGENT');

    layout.sidebarExpanded.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.classList.contains('sidebar--collapsed')).toBeTrue();
    const labels = fixture.debugElement.queryAll(By.css('.sidebar__label'));
    expect(labels.length).toBe(0);
  });

  it('should expose nav links for overview employees locations reports', () => {
    const hrefs = fixture.debugElement
      .queryAll(By.css('a.sidebar__link'))
      .map((el) => el.attributes['href'] || el.nativeElement.getAttribute('href'));
    expect(hrefs.join(' ')).toContain('dashboard');
    expect(hrefs.join(' ')).toContain('employees');
    expect(hrefs.join(' ')).toContain('locations');
    expect(hrefs.join(' ')).toContain('reports');
  });
});
```

Note: Host class binding — put `sidebar` / `sidebar--collapsed` on `:host` via `host` bindings so `fixture.nativeElement` is the host.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/components/sidebar/sidebar.spec.ts`

- [ ] **Step 3: Implement Sidebar TypeScript**

Replace `sidebar.ts`:

```ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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

  readonly navItems = [
    { label: 'Overview', path: '/dashboard', icon: 'fa-house' },
    { label: 'Employees', path: '/employees', icon: 'fa-user' },
    { label: 'Locations', path: '/locations', icon: 'fa-location-dot' },
    { label: 'Reports', path: '/reports', icon: 'fa-clock' },
  ] as const;
}
```

- [ ] **Step 4: Implement Sidebar template**

Replace `sidebar.html`:

```html
<div class="sidebar__brand">
  <img class="sidebar__mark" src="trigentLogoIcon.png" alt="" width="36" height="36" />
  @if (layout.sidebarExpanded()) {
    <div class="sidebar__brand-text">
      <div class="sidebar__brand-name">TRIGENT</div>
      <div class="sidebar__brand-tag">Attendance &amp; Compliance</div>
    </div>
  }
</div>

<nav class="sidebar__nav" aria-label="Main">
  @for (item of navItems; track item.path) {
    <a
      class="sidebar__link"
      [routerLink]="item.path"
      routerLinkActive="sidebar__link--active"
      [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
    >
      <i class="fa-solid {{ item.icon }} sidebar__icon" aria-hidden="true"></i>
      @if (layout.sidebarExpanded()) {
        <span class="sidebar__label">{{ item.label }}</span>
      }
    </a>
  }
</nav>

<div class="sidebar__profile">
  <div class="sidebar__avatar" aria-hidden="true">PD</div>
  @if (layout.sidebarExpanded()) {
    <div class="sidebar__profile-text">
      <div class="sidebar__profile-name">Pooja D</div>
      <div class="sidebar__profile-role">HR Admin</div>
    </div>
    <i class="fa-solid fa-chevron-down sidebar__chevron" aria-hidden="true"></i>
  }
</div>
```

- [ ] **Step 5: Implement Sidebar CSS**

Replace `sidebar.css`:

```css
:host {
  --sidebar-bg: #0f2137;
  --sidebar-active-bg: rgba(255, 255, 255, 0.08);
  --sidebar-accent: #f5a623;
  --sidebar-muted: #a8bdd6;
  --sidebar-text: #ffffff;
  --sidebar-width-collapsed: 72px;
  --sidebar-width-expanded: 240px;

  display: flex;
  flex-direction: column;
  width: var(--sidebar-width-expanded);
  min-height: 100vh;
  padding: 1.25rem 0.75rem 1rem;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  font-family: 'DM Sans', system-ui, sans-serif;
  transition: width 250ms ease;
  overflow: hidden;
}

:host(.sidebar--collapsed) {
  width: var(--sidebar-width-collapsed);
  padding-inline: 0.65rem;
  align-items: center;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0.5rem 1.5rem;
  min-height: 3.25rem;
}

:host(.sidebar--collapsed) .sidebar__brand {
  justify-content: center;
  padding-inline: 0;
}

.sidebar__mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.sidebar__brand-name {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  line-height: 1.1;
}

.sidebar__brand-tag {
  margin-top: 0.15rem;
  font-size: 0.7rem;
  color: var(--sidebar-muted);
  white-space: nowrap;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.sidebar__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-height: 2.75rem;
  padding: 0.55rem 0.85rem;
  border-radius: 0.65rem;
  color: var(--sidebar-muted);
  text-decoration: none;
  transition:
    background 160ms ease,
    color 160ms ease;
}

:host(.sidebar--collapsed) .sidebar__link {
  justify-content: center;
  width: 2.75rem;
  padding-inline: 0;
  margin-inline: auto;
}

.sidebar__link:hover {
  color: var(--sidebar-text);
  background: rgba(255, 255, 255, 0.04);
}

.sidebar__link--active {
  color: var(--sidebar-accent);
  background: var(--sidebar-active-bg);
}

.sidebar__link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--sidebar-accent);
}

.sidebar__icon {
  width: 1.15rem;
  text-align: center;
  font-size: 1rem;
}

.sidebar__label {
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.sidebar__profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
  padding: 0.65rem 0.7rem;
  border-radius: 0.75rem;
  background: var(--sidebar-active-bg);
}

:host(.sidebar--collapsed) .sidebar__profile {
  justify-content: center;
  width: 2.75rem;
  padding: 0.35rem;
  background: transparent;
}

.sidebar__avatar {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.55rem;
  background: var(--sidebar-accent);
  color: #0b1220;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.sidebar__profile-name {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
}

.sidebar__profile-role {
  font-size: 0.75rem;
  color: var(--sidebar-muted);
}

.sidebar__profile-text {
  flex: 1;
  min-width: 0;
}

.sidebar__chevron {
  font-size: 0.7rem;
  color: var(--sidebar-muted);
}
```

- [ ] **Step 6: Fix tests if host/href assertions need adjustment**

If `href` is null in unit tests (RouterLink), assert `routerLink` attribute via `el.attributes['ng-reflect-router-link']` or query by `By.css('a[routerLink]')` — Angular 20 may expose `routerLink` differently. Prefer:

```ts
const paths = fixture.componentInstance.navItems.map((i) => i.path);
expect(paths).toEqual(['/dashboard', '/employees', '/locations', '/reports']);
const anchors = fixture.debugElement.queryAll(By.css('a.sidebar__link'));
expect(anchors.length).toBe(4);
```

Update the spec accordingly if the original href assertion fails while UI is correct.

- [ ] **Step 7: Run tests — expect PASS**

- [ ] **Step 8: Commit**

```bash
git add src/shared/components/sidebar/
git commit -m "feat: build collapsible main sidebar with Font Awesome nav"
```

---

### Task 3: Topbar burger

**Files:**
- Modify: `src/shared/components/topbar/topbar.ts`
- Modify: `src/shared/components/topbar/topbar.html`
- Modify: `src/shared/components/topbar/topbar.css`
- Modify: `src/shared/components/topbar/topbar.spec.ts`

**Interfaces:**
- Consumes: `MainLayoutService.toggleSidebar`
- Produces: Burger button in top-left

- [ ] **Step 1: Write failing Topbar test**

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MainLayoutService } from '../../services/main-layout/main-layout';
import { Topbar } from './topbar';

describe('Topbar', () => {
  let fixture: ComponentFixture<Topbar>;
  let layout: MainLayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
    }).compileComponents();

    layout = TestBed.inject(MainLayoutService);
    fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle sidebar via burger', () => {
    expect(layout.sidebarExpanded()).toBeTrue();
    const btn = fixture.debugElement.query(By.css('button.topbar__burger'));
    btn.triggerEventHandler('click', {});
    expect(layout.sidebarExpanded()).toBeFalse();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/components/topbar/topbar.spec.ts`

- [ ] **Step 3: Implement Topbar**

`topbar.ts`:

```ts
import { Component, inject } from '@angular/core';

import { MainLayoutService } from '../../services/main-layout/main-layout';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly layout = inject(MainLayoutService);

  toggleSidebar(): void {
    this.layout.toggleSidebar();
  }
}
```

`topbar.html`:

```html
<header class="topbar">
  <button
    type="button"
    class="topbar__burger"
    (click)="toggleSidebar()"
    aria-label="Toggle sidebar"
  >
    <i class="fa-solid fa-bars" aria-hidden="true"></i>
  </button>
</header>
```

`topbar.css`:

```css
:host {
  display: block;
}

.topbar {
  display: flex;
  align-items: center;
  min-height: 3.5rem;
  padding: 0.5rem 1.25rem;
  background: #ffffff;
  border-bottom: 1px solid rgba(15, 33, 55, 0.08);
}

.topbar__burger {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: #0f2137;
  font-size: 1.15rem;
  cursor: pointer;
}

.topbar__burger:hover {
  background: rgba(15, 33, 55, 0.06);
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/topbar/
git commit -m "feat: add topbar burger to toggle sidebar"
```

---

### Task 4: Wire Main layout shell

**Files:**
- Modify: `src/shared/layouts/main/main.ts`
- Modify: `src/shared/layouts/main/main.html`
- Modify: `src/shared/layouts/main/main.css`
- Modify: `src/shared/layouts/main/main.spec.ts`

**Interfaces:**
- Consumes: `Sidebar`, `Topbar`, `RouterOutlet`
- Produces: Full-height app chrome for Main child routes

- [ ] **Step 1: Write failing Main test**

```ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Main } from './main';

@Component({ standalone: true, template: `<p>page</p>` })
class StubPage {}

const routes: Routes = [
  {
    path: '',
    component: Main,
    children: [{ path: 'dashboard', component: StubPage }],
  },
];

describe('Main', () => {
  let fixture: ComponentFixture<Main>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Main],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Main);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render sidebar and topbar', () => {
    expect(fixture.debugElement.query(By.css('app-sidebar'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-topbar'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('router-outlet'))).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/main/main.spec.ts`

- [ ] **Step 3: Implement Main**

`main.ts`:

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../../components/sidebar/sidebar';
import { Topbar } from '../../components/topbar/topbar';

@Component({
  selector: 'app-main',
  imports: [Sidebar, Topbar, RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
```

`main.html`:

```html
<div class="main-shell">
  <app-sidebar />
  <div class="main-shell__content">
    <app-topbar />
    <main class="main-shell__page">
      <router-outlet />
    </main>
  </div>
</div>
```

`main.css`:

```css
:host {
  display: block;
  min-height: 100vh;
}

.main-shell {
  display: flex;
  min-height: 100vh;
  background: #f4f6fa;
}

.main-shell__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.main-shell__page {
  flex: 1;
  padding: 1.25rem 1.5rem;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shared/layouts/main/
git commit -m "feat: compose main layout with sidebar and topbar"
```

---

### Task 5: End-to-end verification

**Files:** none (verify only)

- [ ] **Step 1: Run focused tests**

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/services/main-layout/main-layout.spec.ts --include=src/shared/components/sidebar/sidebar.spec.ts --include=src/shared/components/topbar/topbar.spec.ts --include=src/shared/layouts/main/main.spec.ts
```

If multiple `--include` unsupported, run sequentially. Expected: all PASS.

- [ ] **Step 2: Build**

`npx ng build --configuration=development` — exit 0.

- [ ] **Step 3: Manual check**

`npx ng serve`, open `/dashboard` (after Sign In):

1. Sidebar expanded by default with TRIGENT + labels + profile card.  
2. Burger collapses to icon-only (~72px) with smooth width transition.  
3. Active Overview amber + left bar; navigate Employees/Locations/Reports.  
4. Font Awesome icons visible.

- [ ] **Step 4: Polish commit only if needed**

```bash
git commit -m "fix: polish main sidebar shell to match screenshots"
```

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| FA dependency + icons | 1, 2, 3 |
| MainLayoutService signal/toggle | 1 |
| Sidebar collapsed/expanded UI | 2 |
| Nav routes + active state | 2 |
| Topbar burger | 3 |
| Main composition | 4 |
| Width transition | 2 CSS |
| Manual verification | 5 |
