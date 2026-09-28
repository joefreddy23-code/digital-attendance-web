# Overview API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load Overview from `GET /web/overview`, attach Bearer via auth interceptor, bind Dashboard to typed API data, and remove all static Overview mocks.

**Architecture:** Add overview endpoint + response interfaces; `Overview` service performs GET; functional `authInterceptor` clones requests with `Authorization: Bearer <token>` (skip login/forgot); Dashboard loads on init and maps API fields into the existing UI (role-2 needs-review adapted to `supervisorQueries`).

**Tech Stack:** Angular 20 standalone, `HttpClient` / `HttpInterceptorFn` / `provideHttpClientTesting`, Jasmine + Karma, RxJS.

**Spec:** `docs/superpowers/specs/2026-09-28-overview-api-integration-design.md`

## Global Constraints

- Endpoint: `GET http://localhost:3007/web/overview` (no body)
- Auth: `Authorization: Bearer <token>` via interceptor from `Auth.getToken()`
- Skip Bearer on: `API_ENDPOINTS.login` and `API_ENDPOINTS.forgotPassword`
- Interceptor order: `authInterceptor` then `loadingInterceptor`
- Preserve API field names in interfaces (`yettoCheckIn`, `totalemployeeCount`, etc.)
- Role 1: no Needs review UI; Role 2: always show Needs review (badge can be 0)
- Query UI: name=`employeeName`, subtitle=formatted `checkinDatetime`, status/note=`issueNote`; no supervisor/location lines
- Approve/Decline remain visual-only; remove all static Overview mock data
- On Windows PowerShell use `;` not `&&`; commit with simple `-m "message"`

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/shared/utils/config/api.config.ts` (+ spec) | Add `overview` URL |
| `src/shared/utils/interface/overview-response.interface.ts` | Typed response |
| `src/shared/services/overview/overview.ts` (+ spec) | `getOverview()` |
| `src/shared/interceptors/auth.interceptor.ts` (+ spec) | Bearer header |
| `src/app/app.config.ts` | Register auth interceptor |
| `src/pages/dashboard/dashboard.ts` / `.html` / `.spec.ts` | API binding |

---

### Task 1: Overview endpoint, interfaces, and service

**Files:**
- Modify: `src/shared/utils/config/api.config.ts`
- Modify: `src/shared/utils/config/api.config.spec.ts` (create if missing)
- Create: `src/shared/utils/interface/overview-response.interface.ts`
- Create: `src/shared/services/overview/overview.ts`
- Create: `src/shared/services/overview/overview.spec.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `API_ENDPOINTS.overview: 'http://localhost:3007/web/overview'`
  - `OverviewResponse`, `OverviewData`, `EmployeesByCity`, `SupervisorQuery`
  - `Overview.getOverview(): Observable<OverviewResponse>`

- [ ] **Step 1: Write failing config + Overview service specs**

Update or create `src/shared/utils/config/api.config.spec.ts`:

```ts
import { API_ENDPOINTS } from './api.config';

describe('API_ENDPOINTS', () => {
  it('should expose login, forgot-password, and overview URLs', () => {
    expect(API_ENDPOINTS.login).toBe('http://localhost:3005/web/login');
    expect(API_ENDPOINTS.forgotPassword).toBe(
      'http://localhost:3006/web/forgot-password',
    );
    expect(API_ENDPOINTS.overview).toBe('http://localhost:3007/web/overview');
  });
});
```

Create `src/shared/services/overview/overview.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import { OverviewResponse } from '../../utils/interface/overview-response.interface';
import { Overview } from './overview';

describe('Overview', () => {
  let service: Overview;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(Overview);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET overview endpoint', () => {
    const mock: OverviewResponse = {
      success: true,
      data: {
        totalEmployees: 18,
        totalCheckedIn: 1,
        yettoCheckIn: 17,
        employeesByCity: [
          {
            city: 'Bengaluru',
            totalemployeeCount: 9,
            employeeCount: 1,
          },
        ],
      },
    };

    service.getOverview().subscribe((res) => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne(API_ENDPOINTS.overview);
    expect(req.request.method).toBe('GET');
    expect(req.request.body).toBeNull();
    req.flush(mock);
  });
});
```

- [ ] **Step 2: Run specs to verify they fail**

```bash
npx ng test --include=src/shared/utils/config/api.config.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --include=src/shared/services/overview/overview.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: FAIL (missing `overview` key / missing service).

- [ ] **Step 3: Implement config, interfaces, service**

`src/shared/utils/config/api.config.ts`:

```ts
export const API_ENDPOINTS = {
  login: 'http://localhost:3005/web/login',
  forgotPassword: 'http://localhost:3006/web/forgot-password',
  overview: 'http://localhost:3007/web/overview',
} as const;
```

`src/shared/utils/interface/overview-response.interface.ts`:

```ts
export interface EmployeesByCity {
  city: string;
  totalemployeeCount: number;
  employeeCount: number;
}

export interface SupervisorQuery {
  exceptionId: number;
  employeeId: number;
  employeeName: string;
  attendanceId: number;
  issueNote: string;
  checkinDatetime: string;
}

export interface OverviewData {
  totalEmployees: number;
  totalCheckedIn: number;
  yettoCheckIn: number;
  employeesByCity: EmployeesByCity[];
  supervisorQueries?: SupervisorQuery[];
}

export interface OverviewResponse {
  success: boolean;
  data?: OverviewData;
  message?: string;
}
```

`src/shared/services/overview/overview.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import { OverviewResponse } from '../../utils/interface/overview-response.interface';

@Injectable({
  providedIn: 'root',
})
export class Overview {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<OverviewResponse> {
    return this.http.get<OverviewResponse>(API_ENDPOINTS.overview);
  }
}
```

- [ ] **Step 4: Run specs to verify they pass**

```bash
npx ng test --include=src/shared/utils/config/api.config.spec.ts --browsers=ChromeHeadless --watch=false
npx ng test --include=src/shared/services/overview/overview.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/config/api.config.ts src/shared/utils/config/api.config.spec.ts src/shared/utils/interface/overview-response.interface.ts src/shared/services/overview/overview.ts src/shared/services/overview/overview.spec.ts
git commit -m "feat(overview): add overview endpoint, types, and service"
```

---

### Task 2: Bearer auth interceptor

**Files:**
- Create: `src/shared/interceptors/auth.interceptor.ts`
- Create: `src/shared/interceptors/auth.interceptor.spec.ts`
- Modify: `src/app/app.config.ts`

**Interfaces:**
- Consumes: `Auth.getToken(): string | null`, `API_ENDPOINTS.login`, `API_ENDPOINTS.forgotPassword`
- Produces: `authInterceptor: HttpInterceptorFn` registered before `loadingInterceptor`

- [ ] **Step 1: Write failing interceptor specs**

Create `src/shared/interceptors/auth.interceptor.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_ENDPOINTS } from '../utils/config/api.config';
import { Auth } from '../services/auth/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: auth },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Bearer token when present', () => {
    auth.getToken.and.returnValue('abc123');

    http.get(API_ENDPOINTS.overview).subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.overview);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('should not attach Authorization when token is null', () => {
    auth.getToken.and.returnValue(null);

    http.get(API_ENDPOINTS.overview).subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.overview);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should skip Bearer on login URL', () => {
    auth.getToken.and.returnValue('abc123');

    http.post(API_ENDPOINTS.login, {}).subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.login);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should skip Bearer on forgot-password URL', () => {
    auth.getToken.and.returnValue('abc123');

    http.post(API_ENDPOINTS.forgotPassword, {}).subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.forgotPassword);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
```

- [ ] **Step 2: Run specs to verify they fail**

```bash
npx ng test --include=src/shared/interceptors/auth.interceptor.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: FAIL (interceptor missing).

- [ ] **Step 3: Implement interceptor and register in app.config**

`src/shared/interceptors/auth.interceptor.ts`:

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_ENDPOINTS } from '../utils/config/api.config';
import { Auth } from '../services/auth/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const isAuthEndpoint =
    req.url === API_ENDPOINTS.login ||
    req.url === API_ENDPOINTS.forgotPassword;

  if (isAuthEndpoint) {
    return next(req);
  }

  const token = auth.getToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
```

Update `src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from '../shared/interceptors/auth.interceptor';
import { loadingInterceptor } from '../shared/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor])),
  ],
};
```

- [ ] **Step 4: Run interceptor specs to verify they pass**

```bash
npx ng test --include=src/shared/interceptors/auth.interceptor.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/interceptors/auth.interceptor.ts src/shared/interceptors/auth.interceptor.spec.ts src/app/app.config.ts
git commit -m "feat(http): add Bearer auth interceptor"
```

---

### Task 3: Wire Dashboard to Overview API

**Files:**
- Modify: `src/pages/dashboard/dashboard.ts`
- Modify: `src/pages/dashboard/dashboard.html`
- Modify: `src/pages/dashboard/dashboard.spec.ts`

**Interfaces:**
- Consumes: `Overview.getOverview()`, `OverviewResponse` / `OverviewData` / `EmployeesByCity` / `SupervisorQuery`, `Auth.getUser()`
- Produces: Dashboard bound to API; no static mock arrays

- [ ] **Step 1: Rewrite failing Dashboard specs for API data**

Replace `src/pages/dashboard/dashboard.spec.ts` with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { Auth } from '../../shared/services/auth/auth';
import { Overview } from '../../shared/services/overview/overview';
import { LoginUserData } from '../../shared/utils/interface/auth-response.interface';
import { OverviewResponse } from '../../shared/utils/interface/overview-response.interface';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let auth: jasmine.SpyObj<Auth>;
  let overview: jasmine.SpyObj<Overview>;

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

  const overviewFixture: OverviewResponse = {
    success: true,
    data: {
      totalEmployees: 18,
      totalCheckedIn: 1,
      yettoCheckIn: 17,
      employeesByCity: [
        {
          city: 'Bengaluru',
          totalemployeeCount: 9,
          employeeCount: 1,
        },
        {
          city: 'Chennai',
          totalemployeeCount: 13,
          employeeCount: 0,
        },
      ],
      supervisorQueries: [
        {
          exceptionId: 8,
          employeeId: 3,
          employeeName: 'Joe Rosario freddy',
          attendanceId: 22,
          issueNote: 'Left early because of personal reasons,',
          checkinDatetime: '2026-09-28T04:00:00.000Z',
        },
      ],
    },
  };

  async function setup(
    user: LoginUserData | null,
    response: OverviewResponse | null = overviewFixture,
  ): Promise<void> {
    TestBed.resetTestingModule();
    auth = jasmine.createSpyObj<Auth>('Auth', ['getUser']);
    auth.getUser.and.returnValue(user);
    overview = jasmine.createSpyObj<Overview>('Overview', ['getOverview']);
    if (response) {
      overview.getOverview.and.returnValue(of(response));
    } else {
      overview.getOverview.and.returnValue(
        throwError(() => new Error('network')),
      );
    }

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Overview, useValue: overview },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  }

  it('should create and load overview', async () => {
    await setup(baseUser);
    expect(fixture.componentInstance).toBeTruthy();
    expect(overview.getOverview).toHaveBeenCalled();
  });

  it('should show API summary and cities for role 1 and hide needs review', async () => {
    await setup({ ...baseUser, empRoleId: 1 });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('18');
    expect(text).toContain('Total Employees');
    expect(text).toContain('1');
    expect(text).toContain('Checked In');
    expect(text).toContain('17');
    expect(text).toContain('Yet to Check In');
    expect(text).toContain('Bengaluru');
    expect(text).toContain('1 of 9 present');
    expect(text).toContain('Chennai');
    expect(text).not.toContain('Needs review today');
    expect(text).not.toContain('Take action');
  });

  it('should hide needs review when user is missing', async () => {
    await setup(null);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Attendance by location');
    expect(text).not.toContain('Needs review today');
  });

  it('should show needs review for role 2 from supervisorQueries and open modal', async () => {
    await setup({
      ...baseUser,
      empRoleId: 2,
      empRole: 'Account Manager',
    });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Needs review today');
    expect(text).toContain('Joe Rosario freddy');
    expect(text).toContain('Left early because of personal reasons,');

    const takeAction = fixture.debugElement.query(
      By.css('button.overview-review__action'),
    );
    takeAction.triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.overview-modal'))).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Missed check-outs · supervisor notes',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Left early because of personal reasons,',
    );
    expect(fixture.nativeElement.textContent).not.toContain('SUPERVISOR ·');

    const closeBtn = fixture.debugElement.query(
      By.css('button.overview-modal__close'),
    );
    closeBtn.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();
  });

  it('should show needs review badge 0 when supervisorQueries empty for role 2', async () => {
    await setup(
      {
        ...baseUser,
        empRoleId: 2,
        empRole: 'Account Manager',
      },
      {
        success: true,
        data: {
          totalEmployees: 18,
          totalCheckedIn: 1,
          yettoCheckIn: 17,
          employeesByCity: [],
          supervisorQueries: [],
        },
      },
    );

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Needs review today');
    const badge = fixture.debugElement.query(By.css('.overview-review__badge'));
    expect(badge.nativeElement.textContent.trim()).toBe('0');
  });

  it('should close modal when backdrop is clicked', async () => {
    await setup({
      ...baseUser,
      empRoleId: 2,
      empRole: 'Account Manager',
    });

    fixture.componentInstance.openModal();
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(
      By.css('.overview-modal-backdrop'),
    );
    backdrop.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();
  });

  it('should keep empty defaults when overview request fails', async () => {
    await setup({ ...baseUser, empRoleId: 1 }, null);

    expect(fixture.componentInstance.totalEmployees).toBe(0);
    expect(fixture.componentInstance.employeesByCity.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run specs to verify they fail**

```bash
npx ng test --include=src/pages/dashboard/dashboard.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: FAIL (still static data / no Overview inject).

- [ ] **Step 3: Implement Dashboard TS + HTML**

Replace `src/pages/dashboard/dashboard.ts` with:

```ts
import { Component, OnInit, inject } from '@angular/core';

import { Auth } from '../../shared/services/auth/auth';
import { Overview } from '../../shared/services/overview/overview';
import {
  EmployeesByCity,
  SupervisorQuery,
} from '../../shared/utils/interface/overview-response.interface';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(Auth);
  private readonly overview = inject(Overview);

  totalEmployees = 0;
  totalCheckedIn = 0;
  yettoCheckIn = 0;
  employeesByCity: EmployeesByCity[] = [];
  supervisorQueries: SupervisorQuery[] = [];
  errorMessage = '';

  isModalOpen = false;

  get empRoleId(): number | null {
    return this.auth.getUser()?.empRoleId ?? null;
  }

  get showNeedsReview(): boolean {
    return this.empRoleId === 2;
  }

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.overview.getOverview().subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.resetData();
          this.errorMessage = res.message?.trim() || 'Unable to load overview.';
          return;
        }
        this.errorMessage = '';
        this.totalEmployees = res.data.totalEmployees;
        this.totalCheckedIn = res.data.totalCheckedIn;
        this.yettoCheckIn = res.data.yettoCheckIn;
        this.employeesByCity = res.data.employeesByCity ?? [];
        this.supervisorQueries = res.data.supervisorQueries ?? [];
      },
      error: () => {
        this.resetData();
        this.errorMessage = 'Unable to load overview.';
      },
    });
  }

  percentPresent(present: number, total: number): number {
    if (total <= 0) {
      return 0;
    }
    return Math.round((present / total) * 100);
  }

  formatCheckin(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleString();
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  private resetData(): void {
    this.totalEmployees = 0;
    this.totalCheckedIn = 0;
    this.yettoCheckIn = 0;
    this.employeesByCity = [];
    this.supervisorQueries = [];
  }
}
```

Replace `src/pages/dashboard/dashboard.html` with:

```html
<section class="overview">
  @if (errorMessage) {
    <p class="overview-error" role="alert">{{ errorMessage }}</p>
  }

  <div class="overview-summary">
    <article class="overview-summary__card overview-summary__card--total">
      <div class="overview-summary__value">{{ totalEmployees }}</div>
      <div class="overview-summary__label">Total Employees</div>
    </article>
    <article class="overview-summary__card overview-summary__card--checked">
      <div class="overview-summary__value">{{ totalCheckedIn }}</div>
      <div class="overview-summary__label">Checked In</div>
    </article>
    <article class="overview-summary__card overview-summary__card--pending">
      <div class="overview-summary__value">{{ yettoCheckIn }}</div>
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
        @for (row of employeesByCity; track row.city) {
          <li class="overview-locations__row">
            <div class="overview-locations__meta">
              <span class="overview-locations__city">{{ row.city }}</span>
              <span class="overview-locations__count"
                >{{ row.employeeCount }} of {{ row.totalemployeeCount }} present</span
              >
            </div>
            <div class="overview-locations__track" aria-hidden="true">
              <div
                class="overview-locations__fill"
                [style.width.%]="percentPresent(row.employeeCount, row.totalemployeeCount)"
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
          <span class="overview-review__badge">{{ supervisorQueries.length }}</span>
        </div>
        <ul class="overview-review__list">
          @for (item of supervisorQueries; track item.exceptionId) {
            <li class="overview-review__item">
              <div class="overview-review__person">
                <div class="overview-review__name">{{ item.employeeName }}</div>
                <div class="overview-review__location">
                  {{ formatCheckin(item.checkinDatetime) }}
                </div>
              </div>
              <div class="overview-review__status">{{ item.issueNote }}</div>
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
      <p class="overview-modal__subtitle">
        {{ supervisorQueries.length }} employees
      </p>
    </div>
    <ul class="overview-modal__list">
      @for (item of supervisorQueries; track item.exceptionId) {
        <li class="overview-modal__item">
          <div class="overview-modal__name">{{ item.employeeName }}</div>
          <div class="overview-modal__location">
            {{ formatCheckin(item.checkinDatetime) }}
          </div>
          <div class="overview-modal__note">
            <p class="overview-modal__note-text">{{ item.issueNote }}</p>
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

Add minimal error style at the top of `dashboard.css` (keep existing styles):

```css
.overview-error {
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgba(185, 28, 28, 0.25);
  border-radius: 0.65rem;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.9rem;
  font-weight: 500;
}
```

- [ ] **Step 4: Run Dashboard specs to verify they pass**

```bash
npx ng test --include=src/pages/dashboard/dashboard.spec.ts --browsers=ChromeHeadless --watch=false
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/dashboard/dashboard.ts src/pages/dashboard/dashboard.html src/pages/dashboard/dashboard.css src/pages/dashboard/dashboard.spec.ts
git commit -m "feat(overview): load dashboard from overview API"
```

---

## Plan self-review

**Spec coverage**
- Endpoint + interfaces → Task 1
- Overview service GET → Task 1
- Bearer interceptor + skip auth URLs + order → Task 2
- Dashboard binding, remove static, role gating, empty badge 0, API field mapping, error defaults → Task 3
- Approve/Decline visual-only → Task 3 HTML (no handlers)

**Placeholders:** None.

**Type consistency:** `yettoCheckIn`, `totalemployeeCount`, `employeeCount`, `supervisorQueries`, `exceptionId`, `getOverview()` used consistently across tasks.
