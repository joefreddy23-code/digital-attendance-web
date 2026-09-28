# Overview Dashboard Static UI Design

**Date:** 2026-09-28  
**Status:** Approved for implementation planning  
**Scope:** Static Overview (`/dashboard`) UI matching screenshots, with role-based visibility and a pure-UI missed check-outs modal. No API integration.

## Goal

Replace the `Dashboard` stub with a static Overview page that matches the provided screenshots. On init, visibility of the “Needs review today” section depends on the logged-in user’s `empRoleId`. Role `2` can open a supervisor-notes modal via **Take action**. Approve/Decline are visual only. API wiring comes later.

## Decisions

| Decision | Choice |
|----------|--------|
| Structure | Approach A — single `Dashboard` page with inline static data + modal |
| Role field | `Auth.getUser()?.empRoleId` (maps to screenshot `roleId`) |
| Role `1` | Summary cards + Attendance by location only |
| Role `2` | Same as role `1`, plus Needs review today + Take action modal |
| Modal actions | Open/close only; Approve/Decline have no click handlers |
| Data | Hardcoded arrays/objects in the component (swap for API later) |
| Shell | Unchanged (sidebar/topbar already provide chrome) |
| Styling | Page-scoped `dashboard.css`; match screenshots and existing tokens (`#0f2137`, amber/orange accents, `#f4f6fa` page bg, DM Sans) |

## Layout & role visibility

| Block | `empRoleId === 1` | `empRoleId === 2` |
|--------|-------------------|-------------------|
| Summary cards (Total / Checked In / Yet to Check In) | Yes | Yes |
| Attendance by location (progress bars) | Yes | Yes |
| Needs review today + Take action | Hidden | Yes |
| Missed check-outs modal | N/A | Open via Take action; Close / backdrop dismisses |

- Summary: three-card horizontal row.
- Role `2` content: two-column grid — location card left, needs-review card right.
- Role `1`: location card full width (no needs-review column).

## Static data

### Summary

| Metric | Value | Visual |
|--------|-------|--------|
| Total Employees | 207 | White card, navy number |
| Checked In | 188 | Cream/orange card, orange number |
| Yet to Check In | 19 | Pink/red card, red number |

### Attendance by location

| City | Present | Total |
|------|---------|-------|
| Bangalore | 72 | 78 |
| Chennai | 34 | 36 |
| Mumbai | 28 | 32 |
| Pune | 21 | 23 |
| Hyderabad | 19 | 22 |
| Gurgaon | 14 | 16 |

- Label format: `{present} of {total} present`
- Progress fill width: `(present / total) * 100%`
- Bar: orange fill on light gray track

### Needs review today (role `2`)

- Badge count: `3`
- Items:
  - John Mathew — Bangalore · BLR 3 — Missed check-out
  - Vikram R — Chennai · CHN 1 — Missed check-out
  - Deepa Nair — Mumbai · BOM 2 — Missed check-out
- **Take action** opens the modal

### Modal content

- Title: `Missed check-outs · supervisor notes`
- Subtitle: `3 employees`
- Entries (each with Decline + Approve buttons, styled only). Use screenshot 2 copy verbatim for supervisor names and note text:
  1. **John Mathew** (Bangalore · BLR 3) — Supervisor · Sneha Iyer — “Left site at 6:15 PM for a client call. Confirmed by gate register.”
  2. **Vikram R** (Chennai · CHN 1) — supervisor note about dead phone battery verified by team lead
  3. **Deepa Nair** (Mumbai · BOM 2) — supervisor note about family emergency approved verbally
- Footer: **Close** button
- Backdrop click also closes

## Architecture

```
Main layout (existing)
└── Dashboard (/dashboard)
    ├── Auth.getUser()?.empRoleId
    ├── summary cards (static)
    ├── attendance by location (static)
    ├── needs review card (@if empRoleId === 2)
    └── missed-checkout modal (isModalOpen)
```

### Component API (`Dashboard`)

- Inject `Auth`
- Expose `empRoleId` (number | null/undefined-safe fallback that hides role-2-only UI)
- Static: `summary`, `locations`, `reviewItems` (or equivalent)
- `isModalOpen` + `openModal()` / `closeModal()`
- No Approve/Decline methods

### Files

| Path | Change |
|------|--------|
| `src/pages/dashboard/dashboard.ts` | Role read, static data, modal open/close |
| `src/pages/dashboard/dashboard.html` | Full Overview markup |
| `src/pages/dashboard/dashboard.css` | Screenshot-matching styles |
| `src/pages/dashboard/dashboard.spec.ts` | Role visibility + modal open/close |

No new shared services or routes in this scope.

## Error handling

- If `getUser()` is null or `empRoleId` is missing: show the role-`1` layout (summary + locations only). Do not show needs-review.
- No HTTP errors in this scope (static only).

## Testing

- `empRoleId === 1`: needs-review section and Take action absent; summary and location rows present.
- `empRoleId === 2`: needs-review visible; Take action opens modal; Close hides modal.
- Static labels/counts from mock data appear in the rendered template.

## Out of scope

- Overview API / attendance endpoints
- Approve/Decline side effects, toasts, list mutation
- Changes to sidebar, topbar, or routing
- Role-based route guards beyond page-level `@if`

## Future API swap

Keep template structure and role `@if`s. Replace component static arrays with a service response; modal open/close and visual Approve/Decline can stay until action APIs exist.
