# Task 2 Report: Route data for left-panel copy

## Status

**DONE**

## Summary

Added `data.headline` and `data.description` to the Auth layout’s `login` and `forgot-password` child routes in `src/app/app.routes.ts`, using the exact strings from the task brief. Main layout and wildcard routes unchanged.

## Changes

### `src/app/app.routes.ts`

**Login route**

- `headline`: `Every shift, verified.`
- `description`: `Employees, locations and compliance reports for the whole workforce.`

**Forgot-password route**

- `headline`: `Locked out? Happens.`
- `description`: `Enter the email you sign in with and we'll send a reset link.` (apostrophe in `we'll` per brief)

## Verification

| Check | Result |
|-------|--------|
| Strings match task brief Step 1 | Yes |
| Other routes unchanged vs in-file structure | Yes (Main children and redirects as in working tree) |
| Automated tests | Deferred to Task 3 per brief |

## Commit

- **SHA:** `3582357`
- **Message:** `feat: add auth route data for left-panel copy`
- **Files:** `src/app/app.routes.ts` only

## Self-review

- Auth children match the brief’s snippet (paths, components, `data` keys and copy).
- No edits to Main layout children or global redirects beyond what was already in the working copy of the file.
- Commit scope limited to `src/app/app.routes.ts` as instructed; other WIP left unstaged.

## Concerns

1. **Commit diff vs task scope:** Git’s previous tracked version of `app.routes.ts` was an empty `routes` array. This commit therefore includes the full routing tree (Auth/Main layouts, imports, redirects), not only the two `data` blocks. Task intent was data-only; the file had to be committed in its current working form to deliver route data on real child routes.
2. **Consumption:** Auth layout does not yet read `ActivatedRoute` / `data` (Task 3). Route data is present but unused until then.

## Follow-up (out of scope)

- Task 3: Auth layout tests and binding left-panel copy from route `data`.
