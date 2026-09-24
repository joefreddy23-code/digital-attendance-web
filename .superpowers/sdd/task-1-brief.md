### Task 1: Global Bootstrap + fonts

**Files:**
- Modify: `src/styles.css`
- Modify: `src/index.html`
- Test: visual / build (no unit test required for CSS import)

**Interfaces:**
- Consumes: none
- Produces: Bootstrap utilities available app-wide; `--font-brand` / `--font-ui` available via body font-family

- [ ] **Step 1: Import Bootstrap in global styles**

Replace `src/styles.css` with:

```css
@import 'bootstrap/dist/css/bootstrap.min.css';

html,
body {
  height: 100%;
  margin: 0;
}

body {
  font-family: 'DM Sans', system-ui, sans-serif;
}
```

- [ ] **Step 2: Add Google Fonts to `src/index.html`**

Inside `<head>`, after the viewport meta (keep existing favicon), add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Verify serve compiles**

Run: `npx ng build --configuration=development`

Expected: Build succeeds (exit 0). If Bootstrap import path fails, confirm `node_modules/bootstrap` exists (`npm install` if needed).

- [ ] **Step 4: Commit**

```bash
git add src/styles.css src/index.html
git commit -m "chore: add Bootstrap and auth UI fonts"
```

---

