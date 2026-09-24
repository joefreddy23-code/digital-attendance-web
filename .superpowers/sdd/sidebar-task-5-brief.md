### Task 5: End-to-end verification

**Files:** none (verify only)

- [ ] **Step 1: Run focused tests**

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include=src/shared/services/main-layout/main-layout.spec.ts --include=src/shared/components/sidebar/sidebar.spec.ts --include=src/shared/components/topbar/topbar.spec.ts --include=src/shared/layouts/main/main.spec.ts
```

If multiple `--include` unsupported, run sequentially. Expected: all PASS.

- [ ] **Step 2: Build**

`npx ng build --configuration=development` â€” exit 0.

- [ ] **Step 3: Manual check**

`npx ng serve`, open `/dashboard` (after Sign In):

1. Sidebar expanded by default with TRIGENT + labels + profile card.  
2. Burger collapses to icon-only (~72px) with smooth width transition.  
3. Active Overview amber + left bar; navigate Employees/Locations/Reports.  
4. Font Awesome icons visible.

- [ ] **Step 4: Polish commit only if needed**

```bash
git commit -m "fix: polish main sidebar shell to match screenshots"
```

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| FA dependency + icons | 1, 2, 3 |
| MainLayoutService signal/toggle | 1 |
| Sidebar collapsed/expanded UI | 2 |
| Nav routes + active state | 2 |
| Topbar burger | 3 |
| Main composition | 4 |
| Width transition | 2 CSS |
| Manual verification | 5 |
