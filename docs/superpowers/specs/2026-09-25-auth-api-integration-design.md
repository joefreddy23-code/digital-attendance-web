# Auth API Integration Design

**Date:** 2026-09-25  
**Status:** Approved for implementation planning  
**Scope:** API config, auth request/response interfaces, Auth service (login + forgot password), localStorage session, page wiring, simple auth guard

## Goal

Integrate the existing Login and Forgot Password screens with real backend APIs. Centralize endpoints in a config file, type requests/responses under `src/shared/utils/interface`, implement the empty `Auth` service, persist session in `localStorage`, navigate to dashboard only after successful login, and protect Main layout routes with a simple auth guard.

## Decisions

| Decision | Choice |
|----------|--------|
| Structure | Approach 1 — flat API config + single Auth service |
| Session storage | `localStorage` (`auth_token`, `auth_user`) |
| Identifier UI | One field; detect email vs ID and map payload |
| Email detection | Field value contains `@` → email; otherwise → employee ID |
| Route protection | `authGuard` on Main layout; redirect to `/login` if no token |
| HTTP interceptor | Out of scope (no Bearer header attachment yet) |
| Logout UI | Out of scope |

## Architecture

```
Login / ForgotPassword page
├── Form validation (existing Reactive Forms)
├── Identifier mapping (email vs ID)
├── Auth.login() / Auth.forgotPassword()
│   ├── HttpClient POST → API_ENDPOINTS.*
│   └── Typed request/response interfaces
└── On login success
    ├── Auth.saveSession(data) → localStorage
    └── navigate /dashboard

Main layout routes
└── canActivate: [authGuard]
    └── Auth.isAuthenticated() ? allow : redirect /login
```

### Files

| Path | Role |
|------|------|
| `src/shared/utils/config/api.config.ts` | Full endpoint URLs |
| `src/shared/utils/interface/auth-request.interface.ts` | Login + forgot-password request types |
| `src/shared/utils/interface/auth-response.interface.ts` | Login + forgot-password response types |
| `src/shared/services/auth/auth.ts` | HTTP + session helpers |
| `src/shared/guards/auth.guard.ts` | Redirect if no token |
| `src/app/app.config.ts` | `provideHttpClient()` |
| `src/app/app.routes.ts` | Guard on Main layout |
| `src/pages/auth/login/*` | Call API, show errors, navigate on success |
| `src/pages/auth/forgot-password/*` | Call API, show success/error message |

## API config

```ts
export const API_ENDPOINTS = {
  login: 'http://localhost:3005/web/login',
  forgotPassword: 'http://localhost:3006/web/forgot-password',
} as const;
```

Full URLs are used because login and forgot-password run on different ports.

## Interfaces

### Login request

```ts
interface LoginRequest {
  empId?: string;
  email?: string;
  password: string;
}
```

Send either `empId` or `email`, plus `password`.

### Forgot password request

```ts
interface ForgotPasswordRequest {
  employeeId?: string;
  empEmail?: string;
}
```

Send either `employeeId` or `empEmail`. Field names match the backend (not unified with login).

### Login response

```ts
interface LoginResponse {
  success: boolean;
  message: string;
  data?: LoginUserData;
}

interface LoginUserData {
  empId: number;
  empName: string;
  empEmail: string;
  empRoleId: number;
  empRole: string;
  token: string;
  tokenType: string;
  expiresIn: number;
  expiryTime: string;
}
```

### Forgot password response

```ts
interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}
```

## Payload mapping

Both pages keep a single identifier control. Rename the form control from `employeeId` to `identifier`, with label **Employee ID or Email**.

| Form value | Login payload key | Forgot-password payload key |
|------------|-------------------|-----------------------------|
| Contains `@` | `email` | `empEmail` |
| Otherwise | `empId` | `employeeId` |

Validation: `identifier` remains `Validators.required` only. Password rules on Login stay unchanged (required, minLength 8, letter + number). Update auth layout forgot-password `data.description` so it no longer implies Employee ID only.

## Auth service

| Method | Behavior |
|--------|----------|
| `login(payload)` | `POST` `API_ENDPOINTS.login`; return `Observable<LoginResponse>` |
| `forgotPassword(payload)` | `POST` `API_ENDPOINTS.forgotPassword`; return `Observable<ForgotPasswordResponse>` |
| `saveSession(data)` | Store `data.token` as `auth_token` and full `data` as `auth_user` in `localStorage` |
| `clearSession()` | Remove both keys |
| `getToken()` | Read `auth_token` |
| `getUser()` | Parse `auth_user` |
| `isAuthenticated()` | `!!getToken()` |

On login success (`success === true` and `data` present), the **Login page** calls `saveSession(data)` then navigates. The Auth service HTTP methods do not write to `localStorage` themselves.

## Page behavior

### Login

1. On submit: set `submitted = true`; if invalid, stop.
2. Build `LoginRequest` from identifier + password.
3. Set loading; disable submit.
4. Call `Auth.login()`.
5. If `success` and `data`: `saveSession(data)` → navigate `/dashboard`.
6. If `success === false` or HTTP error: show `message` (or fallback “Login failed”) above the form; do not navigate.
7. Clear loading when the request completes.

### Forgot password

1. On submit: set `submitted = true`; if invalid, stop.
2. Build `ForgotPasswordRequest` from identifier.
3. Set loading; disable submit.
4. Call `Auth.forgotPassword()`.
5. If `success`: show API success message; stay on page.
6. If `success === false` or HTTP error: show `message` (or fallback).
7. Clear loading when the request completes.

## Auth guard

- Functional guard on the Main layout parent route (`canActivate`).
- If `Auth.isAuthenticated()` → allow.
- Else → redirect to `/login`.
- Auth layout routes (`/login`, `/forgot-password`) remain public.

## Error handling

| Case | UI |
|------|-----|
| API `success: false` | Show `message` from body |
| HTTP/network error | Show fallback string (e.g. “Unable to connect. Please try again.”) |
| Validation errors | Existing inline field messages only |

## Out of scope

- HTTP interceptor / attaching `Authorization: Bearer` to other APIs
- Logout button / clear-session UI
- Token refresh / expiry checks beyond presence of token
- Prod environment file swaps (hardcoded localhost URLs for this POC)

## Testing notes

- Update Auth service specs for login/forgotPassword with `HttpClientTestingModule`.
- Update Login / Forgot Password specs to mock `Auth` and assert navigate / message / storage behavior.
- Guard unit test: authenticated vs unauthenticated.
