# Main Sidebar & Shell UI Design

**Date:** 2026-09-22  
**Status:** Approved for implementation planning  
**Scope:** Collapsible sidebar + Main layout shell + Topbar burger toggle (static profile; no dropdown actions)

## Goal

Build the post-login Main layout chrome to match the provided screenshots: a navy collapsible sidebar (icon-only vs labeled) and a topbar burger that toggles expand/collapse. Navigation uses Font Awesome icons and Angular Router links.

## Decisions

| Decision | Choice |
|----------|--------|
| Expand/collapse control | Burger button, topbar left corner |
| Expand state ownership | Shared `MainLayoutService` with `sidebarExpanded` signal |
| Nav items | Overview → `/dashboard`; Employees → `/employees`; Locations → `/locations`; Reports → `/reports` |
| Attendance | Omitted from sidebar (route may remain) |
| Icons | Font Awesome (`fa-house`, `fa-user`, `fa-location-dot`, `fa-clock`, `fa-bars`, `fa-chevron-down`) |
| Brand collapsed | `trigentLogoIcon.png` (amber mark) |
| Brand expanded | Mark + white “TRIGENT” + muted “Attendance & Compliance” (or light full logo treatment consistent with auth) |
| Profile | Static “Pooja D” / “HR Admin” / “PD” avatar; chevron visual only (no menu) |
| Default width state | Expanded on first load (matches primary screenshot); burger collapses |

## Architecture

```
Main layout
├── app-sidebar          ← reads sidebarExpanded; routerLink nav
└── main column
    ├── app-topbar       ← burger toggles sidebarExpanded
    └── <router-outlet />
```

### `MainLayoutService` (`src/shared/services/...`)

- `sidebarExpanded = signal(true)`
- `toggleSidebar(): void`
- Injected by Topbar (toggle) and Sidebar (class binding)

### Sidebar

**Collapsed (~72px)**  
- Centered amber logo mark  
- Nav icons only; active: amber icon + left amber bar + lighter navy rounded hit area  
- Bottom: amber “PD” avatar (rounded)

**Expanded (~240px)**  
- Logo mark + TRIGENT + “Attendance & Compliance”  
- Nav: icon + label; same active treatment spanning the row  
- Bottom: profile card — avatar, “Pooja D”, “HR Admin”, `fa-chevron-down`

**Active route**  
- Driven by `RouterLinkActive` (or equivalent) against current URL.

### Topbar

- Minimal bar above page content  
- Left: burger (`fa-bars`) calling `toggleSidebar()`  
- Remaining topbar chrome: minimal/placeholder only in this scope

### Main layout CSS

- Full-height flex row; sidebar width transitions `220–280ms ease`  
- Content column: `flex: 1; min-width: 0`; topbar sticky/full width of column

## Visual tokens

| Token | Approx |
|-------|--------|
| `--sidebar-bg` | `#0f2137` |
| `--sidebar-active-bg` | `rgba(255,255,255,0.08)` |
| `--sidebar-accent` | `#f5a623` |
| `--sidebar-muted` | `#a8bdd6` |
| `--sidebar-text` | `#ffffff` |
| Collapsed width | `72px` |
| Expanded width | `240px` |

## Font Awesome

Add `@fortawesome/fontawesome-free` (CSS import in `styles.css` or `index.html` link). Use Free Regular/Solid classes as appropriate for outline-style icons in the mocks.

## Files to touch

| File | Change |
|------|--------|
| `package.json` / lockfile | Add Font Awesome if via npm |
| `src/styles.css` or `index.html` | FA stylesheet |
| `src/shared/services/main-layout/main-layout.ts` (+ spec) | Expand signal + toggle |
| `src/shared/components/sidebar/*` | Full sidebar UI |
| `src/shared/components/topbar/*` | Burger + minimal bar |
| `src/shared/layouts/main/*` | Compose sidebar + topbar + outlet |
| Specs | Behavior for toggle + active nav |

## Out of scope

- Profile dropdown / logout  
- Attendance sidebar entry  
- Full topbar search/notifications polish  
- Auth guards  
- Mobile off-canvas drawer beyond width collapse (burger still toggles widths)

## Success criteria

1. Burger toggles collapsed ↔ expanded sidebar matching screenshots.  
2. Overview/Employees/Locations/Reports navigate correctly; active state is amber + left bar.  
3. Collapsed shows icons only; expanded shows labels + brand text + profile card.  
4. Font Awesome icons used for nav, burger, and chevron.  
5. Width transition is smooth (~250ms).
