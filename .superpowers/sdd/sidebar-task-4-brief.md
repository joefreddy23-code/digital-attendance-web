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

- [ ] **Step 2: Run â€” expect FAIL**

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

- [ ] **Step 4: Run â€” expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shared/layouts/main/
git commit -m "feat: compose main layout with sidebar and topbar"
```

---

