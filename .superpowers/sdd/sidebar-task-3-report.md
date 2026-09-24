# Task 3 Report: Topbar burger

## Status

**DONE**

## Summary

Topbar burger button calls `MainLayoutService.toggleSidebar()` via click handler. Delivered via TDD (RED → GREEN).

## TDD evidence

### RED (Step 2)

Command:

```text
npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/components/topbar/topbar.spec.ts
```

Result: **1 FAILED, 1 SUCCESS** (2 total)

- `should toggle sidebar via burger` — `button.topbar__burger` missing; `triggerEventHandler` on null.

### GREEN (Step 4)

Same command after implementing `topbar.ts`, `topbar.html`, `topbar.css`.

Result: **2 SUCCESS** — exit code 0.

## Changes

| File | Purpose |
|------|---------|
| `topbar.spec.ts` | Burger click toggles `sidebarExpanded` |
| `topbar.ts` | Injects `MainLayoutService`, `toggleSidebar()` |
| `topbar.html` | Header + FA bars burger button |
| `topbar.css` | Topbar strip and burger hover styling |

## Commit

- **SHA:** `3e19ac9`
- **Message:** `feat: add topbar burger to toggle sidebar`
- **Scope:** `src/shared/components/topbar/` only (4 files)

## Self-review

- Burger uses `aria-label="Toggle sidebar"`; icon marked `aria-hidden`.
- Test uses real `MainLayoutService` (providedIn root), no mocks.

## Concerns

1. **Font Awesome** — `fa-solid fa-bars` assumes global FA CSS like sidebar; no new import in component (matches sidebar pattern).
2. **Main layout wiring** — Topbar not yet composed in `Main` layout (Task 4).

## Follow-up (out of scope)

- Compose `<app-topbar />` in main layout (Task 4).
