# Sign Out Clear Storage + Password Visibility Design

**Date:** 2026-09-25  
**Status:** Approved for implementation planning  
**Scope:** Topbar Sign out clears all localStorage via `Auth.logout()` and navigates to login; Login password field show/hide toggle

## Goal

On Sign out, wipe all `localStorage` and send the user to `/login` through a centralized `Auth.logout()`. On the Login form, add an eye button so the user can toggle password visibility.

## Decisions

| Decision | Choice |
|----------|--------|
| Structure | Approach 2 — `Auth.logout()` owns clear + navigate |
| Storage wipe | `localStorage.clear()` (all keys, not only auth_*) |
| Password toggle | Login only; Font Awesome `fa-eye` / `fa-eye-slash` |
| Toggle ownership | Page-local `passwordVisible` on Login component |

## Architecture

```
Topbar.signOut()
  └── Auth.logout()
        ├── localStorage.clear()
        └── Router.navigateByUrl('/login')

Login password field
  ├── passwordVisible: boolean
  ├── input [type]="passwordVisible ? 'text' : 'password'"
  └── toggle button (eye / eye-slash)
```

### Files

| Path | Role |
|------|------|
| `src/shared/services/auth/auth.ts` (+ spec) | Add `logout()` |
| `src/shared/components/topbar/topbar.ts` (+ spec) | Call `auth.logout()` |
| `src/pages/auth/login/login.ts` / `.html` / `.css` (+ spec) | Password visibility toggle |

## Auth.logout()

```ts
logout(): void {
  localStorage.clear();
  void this.router.navigateByUrl('/login');
}
```

- Inject `Router` into `Auth` (in addition to existing `HttpClient`).
- Topbar `signOut()` becomes a thin call to `this.auth.logout()` (no duplicate navigate).

Keep existing `clearSession()` (auth keys only) for any future selective clear; logout uses full wipe.

## Password visibility (Login)

| State | Input type | Icon | aria-label |
|-------|------------|------|------------|
| Hidden (default) | `password` | `fa-eye` | Show password |
| Visible | `text` | `fa-eye-slash` | Hide password |

- Wrap input + button in a relative container (e.g. `.auth-field__control`)
- Button: `type="button"` so it does not submit the form
- Input: extra right padding for the icon
- Style to match existing glass auth inputs (muted icon, hover slightly brighter)

## Testing

- Auth: `logout()` clears localStorage (including non-auth keys) and navigates `/login`
- Topbar: Sign out click invokes `Auth.logout()` (spy)
- Login: toggle flips type/icon; default is password + eye

## Out of scope

- Forgot-password field toggle
- Confirmation dialog before sign out
- Session expiry / remote logout API
