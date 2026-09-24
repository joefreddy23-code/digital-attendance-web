# Task 3 Report: Auth layout shell

## Status
**Complete** — Auth layout shell implemented per brief; all Auth unit tests passing.

## Commits
- `feat: build auth layout shell with route-driven copy` (4 files: `auth.ts`, `auth.html`, `auth.css`, `auth.spec.ts`)

## TDD Evidence

### RED (Step 2)
Command:
```
npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/auth/auth.spec.ts
```
Result: **2 specs FAILED** (plus duplicate Electron launcher runs in environment). Failures matched expectation:
- `should render brand and login left copy from route data` — text was `auth works!`, missing TRIGENT/headline/features; logo query null.
- `should swap left copy on forgot-password route` — expected forgot-password copy, got `auth works!`.

### GREEN (Step 6)
Same command after implementing TS/HTML/CSS:
```
TOTAL: 3 SUCCESS
```
- `should create` — PASS
- `should render brand and login left copy from route data` — PASS
- `should swap left copy on forgot-password route` — PASS

## Implementation Notes
- **TypeScript:** `toSignal` + `NavigationEnd`/`startWith(null)` pipeline on child route `data`; lean `imports: [RouterOutlet]` only (no `AsyncPipe`).
- **Deviation from brief snippet:** `return child?.snapshot?.data ?? {}` — brief had `child?.snapshot.data`, which throws when `snapshot` is absent during early navigation (`Cannot read properties of undefined (reading 'data')`).
- **Template:** Brand (`trigentLogoIcon.png`), feature list, `headline()` / `description()` signals, `<router-outlet />`.
- **CSS:** Dark shell, glows, feature icon SVG data-URLs, outlet max-width per spec.

## Self-Review
| Area | Assessment |
|------|------------|
| Requirements | Matches brief for markup, copy, features, route-driven headline/description |
| Tests | Cover create, login data binding, forgot-password swap |
| Scope | Only four auth layout files committed; no unrelated WIP staged |
| Risk | Initial load before first `NavigationEnd` may show empty headline until navigation; `startWith(null)` emits once — acceptable for auth child routes |
| Follow-up | Wire `Auth` in app routes if not already (out of Task 3 scope) |

## Concerns
- Karma may launch both ChromeHeadless and Electron in some environments (RED showed 4 FAILED / 2 SUCCESS totals); filter to ChromeHeadless for clean counts.
- Logo path is relative `trigentLogoIcon.png` (public asset); verify at runtime when auth routes are mounted.
