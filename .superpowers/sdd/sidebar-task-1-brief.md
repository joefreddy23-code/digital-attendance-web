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

