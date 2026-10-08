# Task 2 Report: Bearer auth interceptor

## Status

**DONE**

## Summary

Added functional `authInterceptor` that attaches `Authorization: Bearer <token>` from `Auth.getToken()` for non-auth endpoints, skips login and forgot-password URLs, and registered it before `loadingInterceptor` in `app.config.ts`.

## TDD

| Phase | Command | Result |
|-------|---------|--------|
| RED | `npx ng test --include=src/shared/interceptors/auth.interceptor.spec.ts --browsers=ChromeHeadless --watch=false` | FAIL — `Cannot find module './auth.interceptor'` (build error) |
| GREEN | Same command after implementation | PASS — 4/4 SUCCESS |

## Changes

- **Create:** `src/shared/interceptors/auth.interceptor.ts`
- **Create:** `src/shared/interceptors/auth.interceptor.spec.ts` (4 cases: attach token, null token, skip login, skip forgot-password)
- **Modify:** `src/app/app.config.ts` — `withInterceptors([authInterceptor, loadingInterceptor])`

## Commit

- **Message:** `feat(http): add Bearer auth interceptor`
- **Files:** interceptor + spec + `app.config.ts` only

## Verification

- Dashboard untouched (Task 3 scope).
- URL matching uses strict equality on `API_ENDPOINTS.login` / `forgotPassword` (no prefix handling for absolute vs relative URLs).

## Concerns

- If requests use a full base URL while `API_ENDPOINTS` are path-only, skip/attach logic may not match; current services use endpoint constants as-is.
