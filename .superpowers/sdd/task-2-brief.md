### Task 2: Route data for left-panel copy

**Files:**
- Modify: `src/app/app.routes.ts`
- Test: covered by Auth layout tests in Task 3

**Interfaces:**
- Consumes: existing `Login` / `ForgotPassword` route components
- Produces: child routes expose `data.headline: string` and `data.description: string`

- [ ] **Step 1: Add route data to auth children**

Update the Auth children in `src/app/app.routes.ts` to:

```ts
children: [
  {
    path: 'login',
    component: Login,
    data: {
      headline: 'Every shift, verified.',
      description:
        'Employees, locations and compliance reports for the whole workforce.',
    },
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
    data: {
      headline: 'Locked out? Happens.',
      description:
        "Enter the email you sign in with and we'll send a reset link.",
    },
  },
],
```

Leave all other routes unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/app/app.routes.ts
git commit -m "feat: add auth route data for left-panel copy"
```

---

