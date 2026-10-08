import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

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
