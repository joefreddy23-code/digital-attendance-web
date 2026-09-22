import { Routes } from '@angular/router';

import { Auth } from '../shared/layouts/auth/auth';
import { Main } from '../shared/layouts/main/main';

import { Login } from '../pages/auth/login/login';
import { ForgotPassword } from '../pages/auth/forgot-password/forgot-password';

import { Dashboard } from '../pages/dashboard/dashboard';
import { Attendance } from '../pages/attendance/attendance';
import { Employees } from '../pages/employees/employees';
import { Locations } from '../pages/locations/locations';
import { Reports } from '../pages/reports/reports';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Unauthenticated screens — Auth layout (no sidebar/topbar)
  {
    path: '',
    component: Auth,
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
  },

  // App screens — Main layout (sidebar + topbar + page outlet)
  {
    path: '',
    component: Main,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'attendance', component: Attendance },
      { path: 'employees', component: Employees },
      { path: 'locations', component: Locations },
      { path: 'reports', component: Reports },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
