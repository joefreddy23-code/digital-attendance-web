# Auth UX: API Errors, Sidebar Session, Global Loader Design

**Date:** 2026-09-25  
**Status:** Approved for implementation planning  
**Scope:** Show API error messages on auth forms; drive sidebar profile from localStorage session; full-screen HTTP loader via interceptor

## Goal

When login/forgot-password fail with an API error body, surface that `message` in the existing inline error note (not a generic connect failure). After successful login, sidebar profile uses stored `empName` / `empRole`. All `HttpClient` calls show a full-screen overlay spinner via a loading interceptor.

## Decisions

| Decision | Choice |
|----------|--------|
| Structure | Approach 1 — focused page/sidebar fixes + `LoaderService` + interceptor + overlay |
| Loader UI | Full-screen semi-transparent overlay + centered spinner |
| Loader tracking | In-flight request counter (not boolean) |
| Auth button state | Keep disabled-while-in-flight; visual loading from overlay |
| Error message source | Prefer `HttpErrorResponse.error.message`, else fallback connect string |
| Sidebar data | `Auth.getUser()` → `empName`, `empRole`, initials from name |
| Bearer interceptor | Out of scope |

## Architecture

```
HttpClient
  └── loadingInterceptor
        ├── LoaderService.show() on start
        └── LoaderService.hide() on finalize
              └── GlobalLoader overlay (app.html) when activeCount > 0

Login / ForgotPassword
  └── subscribe error → error.error?.message ?? fallback

Sidebar
  └── Auth.getUser() → name, role, initials
```

### Files

| Path | Role |
|------|------|
| `src/pages/auth/login/login.ts` (+ specs) | Extract API message from HTTP errors |
| `src/pages/auth/forgot-password/forgot-password.ts` (+ specs) | Same error extraction |
| `src/shared/components/sidebar/sidebar.ts` (+ html, specs) | Bind session user |
| `src/shared/services/loader/loader.ts` | In-flight counter signal |
| `src/shared/interceptors/loading.interceptor.ts` | Wire LoaderService to HTTP |
| `src/shared/components/global-loader/*` | Overlay UI |
| `src/app/app.ts` / `app.html` | Host overlay |
| `src/app/app.config.ts` | `withInterceptors([loadingInterceptor])` |
| `src/shared/utils/http/api-error-message.ts` | Shared `apiErrorMessage()` helper |

Shared helper: `src/shared/utils/http/api-error-message.ts` exporting `apiErrorMessage(err: unknown): string` — used by Login and Forgot Password.

## API error messages

**HTTP error path** (typical invalid credentials when server returns 4xx with body):

```json
{ "success": false, "message": "Invalid email or password" }
```

Display that `message` in the existing `apiError` / `apiMessage` note.

**Priority:**
1. `(err as HttpErrorResponse).error?.message` if string
2. `"Unable to connect. Please try again."`

**200 + `success: false`:** unchanged — use `res.message`.

Apply the same logic on Forgot Password.

## Sidebar session display

| UI element | Source |
|------------|--------|
| Profile name | `user.empName` |
| Profile role | `user.empRole` |
| Avatar initials | From `empName`: first letter of first + last word; one word → first two letters (uppercase) |

Fallback when `getUser()` is null: name `"—"`, role `""`, initials `"?"`.

Read via `Auth.getUser()` (already persisted as `auth_user` on login success). No new storage keys.

## Global loader

**`LoaderService`**
- `activeCount` signal (number)
- `show()` → increment
- `hide()` → decrement (floor at 0)
- `isLoading` → `activeCount() > 0`

**`loadingInterceptor`** (functional interceptor)
- Call `show()` when the request starts
- Pipe `finalize(() => hide())` on the returned observable so success and error both decrement
- Signature: `(req, next) => { …; return next(req).pipe(finalize(…)); }`

**`GlobalLoader`**
- Full viewport overlay, dimmed backdrop, centered spinner
- Rendered from `app.html` when `loader.isLoading()`
- `aria-busy` / visually polite (non-interactive cover)

**Registration**

```ts
provideHttpClient(withInterceptors([loadingInterceptor]))
```

## Out of scope

- Attaching `Authorization: Bearer` header
- Logout UI
- Changing endpoint URLs or request/response interfaces
- Replacing form validation messages

## Testing notes

- Login/Forgot: HTTP error with body `{ message: 'Invalid email or password' }` → that text in the note; network-style error without body → fallback
- Sidebar: with mocked `Auth.getUser()` returning sample login data → name/role/initials; null user → fallbacks
- LoaderService: show/hide counter behavior
- Interceptor: show called once per request; hide after flush (optional focused test)
