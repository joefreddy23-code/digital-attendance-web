# Task 5 Report: Forgot-password glass card

## Status
**Complete** — Forgot-password glass card implemented per brief; all ForgotPassword unit tests passing.

## Commits
- `feat: add forgot-password glass card matching auth UI` (4 files: `forgot-password.ts`, `forgot-password.html`, `forgot-password.css`, `forgot-password.spec.ts`)

## TDD Evidence

### RED (Step 2)
Command:
```
npx ng test --no-watch --browsers=ChromeHeadless --include=src/pages/auth/forgot-password/forgot-password.spec.ts
```
Result: **1 spec FAILED**, 1 SUCCESS. Failures matched expectation:
- `should render reset card and back link` — text was `forgot-password works!`, missing reset copy, footer copy, and `a.auth-card__back`.

### GREEN (Step 6)
Same command after implementing TS/HTML/CSS:
```
TOTAL: 2 SUCCESS
```
- `should create` — PASS
- `should render reset card and back link` — PASS

## Implementation Notes
- **TypeScript:** `FormsModule`, `RouterLink`, default email `pooja@company.com`, `onSubmit()` no-op (static UI).
- **Template:** Glass card with reset title/subtitle, email field, submit button, footer with back link to `/login`.
- **CSS:** Copied auth card rules from `login.css`; appended `.auth-card__footer` and `.auth-card__back` styles per brief.

## Self-Review
| Area | Assessment |
|------|------------|
| Requirements | Reset copy, email field, submit, back link to login; no API |
| Tests | Cover create, copy assertions, back link selector |
| Scope | Only four forgot-password files committed |
| Risk | Submit has no feedback (POC static UI) |
| Follow-up | Wire reset API and success/error states (later tasks) |

## Concerns
- Karma ChromeHeadless shutdown may log SIGKILL warnings on Windows; tests still exit 0.
- Login and forgot-password duplicate CSS; shared auth styles could reduce drift in a later refactor.
