# Task 4 Report: Wire Main layout shell

## Status

**DONE**

## Summary

Main layout composes `Sidebar`, `Topbar`, and `RouterOutlet` in a full-height flex shell for child routes. Delivered via TDD (spec updated first, then implementation).

## TDD evidence

### RED (Step 2)

Prior stub (`<p>main works!</p>`, empty imports) would fail `should render sidebar and topbar` — no `app-sidebar`, `app-topbar`, or `router-outlet` in DOM.

### GREEN (Step 4)

Command:

```text
npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/layouts/main/main.spec.ts
```

Result: **2 SUCCESS** — exit code 0.

## Changes

| File | Purpose |
|------|---------|
| `main.spec.ts` | Router + stub child; asserts sidebar, topbar, outlet |
| `main.ts` | Imports `Sidebar`, `Topbar`, `RouterOutlet` |
| `main.html` | Shell markup with content column and page area |
| `main.css` | Full-height flex layout and page padding |

## Commit

- **SHA:** `1122e9a`
- **Message:** `feat: compose main layout with sidebar and topbar`
- **Scope:** `src/shared/layouts/main/` only (4 files)

## Self-review

- Matches brief structure: sidebar column + topbar over routed `<main>`.
- `min-width: 0` on content column avoids flex overflow with sidebar.

## Concerns

1. **Child route rendering** — Spec does not navigate to `dashboard`; outlet presence only (stub routes configured for future extension).
2. **Visual integration** — No e2e; sidebar/topbar spacing relies on each component’s CSS.

## Follow-up (out of scope)

- End-to-end check of main routes with real page components.
