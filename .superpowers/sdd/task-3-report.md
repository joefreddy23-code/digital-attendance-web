# Task 3 Report: Wire Dashboard to Overview API

## Status
**Complete** — Dashboard loads from `Overview.getOverview()`; static mock data removed.

## TDD

### RED
- Replaced `dashboard.spec.ts` with API-focused specs (7 cases).
- Command: `npx ng test --include=src/pages/dashboard/dashboard.spec.ts --browsers=ChromeHeadless --watch=false`
- Result: **FAIL** — compile errors (`totalEmployees`, `employeesByCity` missing on `Dashboard`).

### GREEN
- Implemented `dashboard.ts`, `dashboard.html`, and `.overview-error` in `dashboard.css` per brief.
- Same test command.
- Result: **PASS** — 7/7 SUCCESS.

## Changes
| File | Change |
|------|--------|
| `dashboard.spec.ts` | Mock `Auth` + `Overview`; role 1/2, modal, error paths |
| `dashboard.ts` | `loadOverview()`, role-2 `showNeedsReview`, `formatCheckin()` |
| `dashboard.html` | Bind API fields; supervisor query list + modal |
| `dashboard.css` | Error alert styling |

## Commit
```
feat(overview): load dashboard from overview API
```

## Concerns
None. Interceptor and API config untouched per task scope.

---

## Final review fix: error-path specs (Important)

**Status:** Complete — no `dashboard.ts` changes required.

**Change:** Expanded `dashboard.spec.ts` with HTTP error and `success: false` cases asserting `errorMessage`, `.overview-error` DOM, numeric/array defaults, and `supervisorQueries` cleared.

**Verify:** `npx ng test --include=src/pages/dashboard/dashboard.spec.ts --browsers=ChromeHeadless --watch=false` → **8/8 SUCCESS** (2026-09-28).

**Commit:** `162f341` — `test(overview): cover dashboard error banner paths`
