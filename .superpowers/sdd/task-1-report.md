# Task 1 Report: Global Bootstrap + fonts

## Status

**DONE**

## Summary

Implemented global Bootstrap CSS import and Google Fonts (DM Sans, Instrument Serif) per the task brief. Verified with a successful development build.

## Changes

### `src/styles.css`

- Replaced placeholder comment with `@import 'bootstrap/dist/css/bootstrap.min.css'`.
- Set `html, body` to full height with zero margin.
- Set `body` font-family to `'DM Sans', system-ui, sans-serif`.

### `src/index.html`

- Added three Google Fonts `<link>` tags immediately after the viewport meta tag.
- Preserved existing favicon link to `trigentLogoIcon.png`.

## Verification

| Check | Result |
|-------|--------|
| `npx ng build --configuration=development` | Exit 0 |
| Bundle `styles.css` size | ~277 kB (Bootstrap included) |

## Commit

- **SHA:** `80afd60`
- **Message:** `chore: add Bootstrap and auth UI fonts`
- **Files:** `src/styles.css`, `src/index.html` only (no unrelated WIP staged)

## Self-review

- Matches task brief Step 1 and Step 2 verbatim.
- Bootstrap resolves from `node_modules/bootstrap` without extra install.
- Font preconnect + stylesheet URLs match the plan exactly.
- Favicon unchanged as required.

## Concerns

1. **Interface vs implementation:** The task brief “Produces” line mentions `--font-brand` / `--font-ui` CSS variables, but Step 1 CSS does not define them—only body `font-family`. Instrument Serif is loaded in HTML but not referenced in global CSS yet; likely deferred to a later auth UI task. No action taken beyond the brief.

## Follow-up (out of scope)

- Later tasks may add CSS custom properties for brand/UI fonts and auth shell styling.

## Review fix (2026-09-22)

### Favicon / branding

**Finding:** Review suggested restoring `favicon.ico`.

**Resolution:** Intentionally **not** restoring `favicon.ico`. That file is removed in this repo; the design/spec success criteria require Trigent branding. The document icon remains `href="trigentLogoIcon.png"` with `type="image/png"` (was `image/x-icon`, which was inaccurate for a PNG asset).

### Verification (post-fix)

| Check | Result |
|-------|--------|
| `npx ng build --configuration=development` | Exit 0 |
