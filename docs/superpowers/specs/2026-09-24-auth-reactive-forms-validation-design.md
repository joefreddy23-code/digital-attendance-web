# Auth Reactive Forms Validation Design

**Date:** 2026-09-24  
**Status:** Approved for implementation planning  
**Scope:** Angular Reactive Forms + field validation/error messages on Login and Forgot Password; replace email with Employee ID on both screens

## Goal

Upgrade the existing Auth form cards from template-driven (`ngModel`) inputs to Angular Reactive Forms with submit-time validation and inline error messages. Login and Forgot Password identify the user by **Employee ID** (not email). Keep auth APIs and guards out of scope.

## Decisions

| Decision | Choice |
|----------|--------|
| Form model | Angular Reactive Forms (`ReactiveFormsModule`, `FormGroup`, `Validators`) |
| Structure | Approach 1 — each page owns its own `FormGroup` (no shared form service) |
| Employee ID rules | Required only |
| Password rules | Required + min length 8 + at least one letter and one number |
| Error timing | Show errors only after the user attempts submit |
| Error UI | Inline message under each invalid field + error border on the input |
| Login success (POC) | Navigate to `/dashboard` when form is valid |
| Forgot password success (POC) | No API; valid submit is a no-op (static UI) |
| Auth APIs / guards | Out of scope |

## Architecture

```
Login / ForgotPassword page
├── ReactiveFormsModule
├── FormGroup (page-owned)
│   ├── employeeId: Validators.required
│   └── password (login only): required + minLength(8) + pattern(letter+number)
├── submitted flag (set true on submit)
├── showError(controlName) → submitted && control.invalid
└── onSubmit()
    ├── set submitted = true
    ├── invalid → show messages; do not navigate
    └── valid → login navigates /dashboard; forgot-password no-ops
```

No shared auth-form service. Password pattern may live inline on the Login component.

## Fields & copy

### Login (`src/pages/auth/login`)

| Control | Type | Label |
|---------|------|-------|
| `employeeId` | text | Employee ID |
| `password` | password | Password |

- Card title/subtitle unchanged: “Welcome back” / “Sign in to the HR admin portal”
- Remove any email binding (`email` property / `type="email"`)
- “Forgot password?” link unchanged → `/forgot-password`

### Forgot password (`src/pages/auth/forgot-password`)

| Control | Type | Label |
|---------|------|-------|
| `employeeId` | text | Employee ID |

- Subtitle: “Enter your Employee ID and we'll send a reset link”
- Remove hardcoded demo email default (`pooja@company.com`)
- Footer / back link unchanged → `/login`

### Auth layout route data

Update forgot-password route `data.description` so left-panel copy no longer mentions email, e.g.:

> Enter the Employee ID you sign in with and we'll send a reset link.

Login route data unchanged.

## Validation & error messages

Errors appear only after submit (`submitted === true` and control invalid).

| Field | Validator | Message |
|-------|-----------|---------|
| Employee ID | `required` | Employee ID is required |
| Password | `required` | Password is required |
| Password | `minLength(8)` | Password must be at least 8 characters |
| Password | `pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)` | Password must include at least one letter and one number |

Password message priority when multiple errors: show `required` first if empty; otherwise show `minlength` if too short; otherwise show `pattern`.

## Implementation notes

- Replace `FormsModule` with `ReactiveFormsModule` in Login and ForgotPassword.
- Bind with `[formGroup]` and `formControlName`.
- Add a small error style (e.g. `.auth-field__error`, `.auth-field__input--invalid`) in page CSS or shared auth card styles — match existing glass/muted palette; error text should be readable (soft red/amber), not a new card chrome.
- Update specs that assert email-based copy (`auth.spec.ts`, `forgot-password.spec.ts`, `login.spec.ts` as needed).

## Files to touch

| File | Change |
|------|--------|
| `src/pages/auth/login/login.ts` | `FormGroup`, validators, submit gate, `submitted` |
| `src/pages/auth/login/login.html` | Reactive bindings, Employee ID field, error messages |
| `src/pages/auth/login/login.css` | Error text / invalid input styles |
| `src/pages/auth/login/login.spec.ts` | Validation + navigate-on-valid cases |
| `src/pages/auth/forgot-password/forgot-password.ts` | `FormGroup`, required Employee ID, clear email default |
| `src/pages/auth/forgot-password/forgot-password.html` | Reactive bindings, copy, error message |
| `src/pages/auth/forgot-password/forgot-password.css` | Error styles |
| `src/pages/auth/forgot-password/forgot-password.spec.ts` | Required validation + copy assertions |
| `src/app/app.routes.ts` | Forgot-password `data.description` (Employee ID) |
| `src/shared/layouts/auth/auth.spec.ts` | Assert updated left-panel description |

## Out of scope

- Real login / password-reset API integration
- Auth guards / session handling
- Shared form helper library or form service
- Live validation while typing / on blur (submit-only only)
- Changing Auth layout visual chrome beyond copy updates

## Success criteria

1. Login and Forgot Password use Reactive Forms (not `ngModel`).
2. Both screens collect Employee ID instead of email; labels, types, and route copy match.
3. Invalid submit shows the agreed inline messages and does not navigate.
4. Valid login submit navigates to `/dashboard`.
5. Existing auth layout / navigation smoke tests pass with updated copy assertions.
6. Unit tests cover required Employee ID, password rules, and submit gating.
