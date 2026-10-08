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