import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { Auth } from '../services/auth/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  void router.navigateByUrl('/login');
  return false;
};

// Prevents authenticated users from reaching login / forgot-password.
// If a session is already active, redirect straight to the dashboard.
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    void router.navigateByUrl('/dashboard');
    return false;
  }

  return true;
};

// Roles restricted to a fixed set of top-level screens. Roles not listed here
// have full access.
export const RESTRICTED_ROLE_PATHS: Readonly<Record<number, readonly string[]>> = {
  5: ['dashboard', 'reports', 'profile'],
};

export function isPathAllowedForRole(
  roleId: number | null | undefined,
  path: string,
): boolean {
  const allowed = roleId == null ? undefined : RESTRICTED_ROLE_PATHS[roleId];
  if (!allowed) {
    return true;
  }
  const first = path.replace(/^\/+/, '').split(/[/?#]/)[0];
  return allowed.includes(first);
}

export const roleGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (isPathAllowedForRole(auth.getUser()?.empRoleId, state.url)) {
    return true;
  }
  void router.navigateByUrl('/dashboard');
  return false;
};