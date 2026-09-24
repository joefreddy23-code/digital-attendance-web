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

- [ ] **Step 4: Run test â€” expect FAIL**

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

- [ ] **Step 6: Run test â€” expect PASS**

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
