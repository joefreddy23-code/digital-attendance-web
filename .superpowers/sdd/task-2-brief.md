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