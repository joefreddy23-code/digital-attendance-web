# Overview API Integration Design

**Date:** 2026-09-28  
**Status:** Approved for implementation planning  
**Scope:** Wire Overview (`/dashboard`) to `GET /web/overview`, typed response interfaces, Bearer auth interceptor, remove static mock data. No Approve/Decline APIs.

## Goal

Load Overview from the backend on page init. Attach the session Bearer token via an HTTP interceptor. Bind summary cards, attendance-by-city bars, and (for `empRoleId === 2`) Needs review / modal from the API response. Remove all hardcoded Overview mock data.

## Decisions

| Decision | Choice |
|----------|--------|
| Structure | Approach A — `Overview` service + `authInterceptor` + dashboard binding |
| Endpoint | `GET http://localhost:3007/web/overview` (no body) |
| Auth header | `Authorization: Bearer <token>` via interceptor from `Auth.getToken()` |
| Skip Bearer on | Login and forgot-password URLs (`API_ENDPOINTS.login`, `API_ENDPOINTS.forgotPassword`) |
| Interceptor order | `authInterceptor` then `loadingInterceptor` |
| Role gating | Unchanged: Needs review UI only when `empRoleId === 2` |
| Empty queries (role 2) | Still show Needs review card; badge `0` |
| Query UI mapping | Name = `employeeName`; subtitle = formatted `checkinDatetime`; status/note = `issueNote`; no supervisor/location lines |
| Approve/Decline | Visual only (unchanged) |
| Static data | Remove from `Dashboard` |

## API contract

### Response envelope

```ts
interface OverviewResponse {
  success: boolean;
  data?: OverviewData;
  message?: string;
}
```

### `OverviewData`

| Field | Type | Notes |
|-------|------|--------|
| `totalEmployees` | `number` | Summary |
| `totalCheckedIn` | `number` | Summary “Checked In” |
| `yettoCheckIn` | `number` | Summary “Yet to Check In” (API spelling preserved) |
| `employeesByCity` | `EmployeesByCity[]` | Progress list |
| `supervisorQueries` | `SupervisorQuery[]` \| omitted | Present for role 2; treat missing as `[]` |

### `EmployeesByCity`

| Field | Maps to UI |
|-------|------------|
| `city` | City label |
| `employeeCount` | Present count |
| `totalemployeeCount` | Total count |

Label: `{employeeCount} of {totalemployeeCount} present`. Fill % = `employeeCount / totalemployeeCount` (0 if total ≤ 0).

### `SupervisorQuery`

| Field | Maps to UI |
|-------|------------|
| `exceptionId` | Track key |
| `employeeName` | Name |
| `checkinDatetime` | Subtitle (formatted) |
| `issueNote` | List status text + modal note body |
| `employeeId`, `attendanceId` | Kept on model for future actions; not displayed now |

## UI binding

| Block | Source |
|-------|--------|
| Total Employees | `data.totalEmployees` |
| Checked In | `data.totalCheckedIn` |
| Yet to Check In | `data.yettoCheckIn` |
| Attendance by location | `data.employeesByCity` |
| Needs review list / badge / modal | `data.supervisorQueries ?? []` when `empRoleId === 2` |

Datetime display: `Date` parse of ISO string → `toLocaleString()` (same for list + modal).

Modal title stays “Missed check-outs · supervisor notes”; subtitle “{n} employees”. Drop “SUPERVISOR · …” block; show note text only (from `issueNote`).

## Architecture

```
Dashboard ngOnInit
  └── Overview.getOverview()
        └── HttpClient GET API_ENDPOINTS.overview
              ├── authInterceptor → Authorization: Bearer <token>
              └── loadingInterceptor → global loader

Auth.getUser()?.empRoleId === 2
  └── show Needs review + Take action modal (queries from API)
```

### Files

| Path | Change |
|------|--------|
| `src/shared/utils/config/api.config.ts` | Add `overview` URL |
| `src/shared/utils/interface/overview-response.interface.ts` | Create response types |
| `src/shared/services/overview/overview.ts` (+ spec) | `getOverview()` |
| `src/shared/interceptors/auth.interceptor.ts` (+ spec) | Bearer header |
| `src/app/app.config.ts` | Register auth interceptor |
| `src/pages/dashboard/dashboard.ts` / `.html` / `.spec.ts` | Load API; remove mocks; adapt review/modal markup |

No shell/route changes.

## Error handling

- Before load / on HTTP error: summary `0`, empty city/query arrays; template safe.
- Optional short inline error string on the page if request fails (no new toast system).
- Missing `data` or `success: false`: treat as empty defaults (use `message` for inline error when present).

## Testing

- Auth interceptor: attaches Bearer when token set; does not attach for login/forgot URLs; no header when token null.
- Overview service: GET called with overview URL.
- Dashboard: role 1 — no Needs review; role 2 — card visible with badge from fixture length (including 0); city/summary text from mocked response.

## Out of scope

- Approve/Decline / exception action APIs
- Polling / refresh controls
- Changing login ports or other endpoints
- Role-based route guards beyond page `@if`
