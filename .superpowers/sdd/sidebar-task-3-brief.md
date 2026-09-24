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

- [ ] **Step 2: Run â€” expect FAIL**

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

- [ ] **Step 4: Run â€” expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/topbar/
git commit -m "feat: add topbar burger to toggle sidebar"
```

---

