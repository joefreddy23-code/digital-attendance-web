import { Routes } from '@angular/router';

import { authGuard, guestGuard } from '../shared/guards/auth.guard';
import { Auth } from '../shared/layouts/auth/auth';
import { Main } from '../shared/layouts/main/main';

import { Login } from '../pages/auth/login/login';
import { ForgotPassword } from '../pages/auth/forgot-password/forgot-password';

import { Dashboard } from '../pages/dashboard/dashboard';
import { Attendance } from '../pages/attendance/attendance';
import { Employees } from '../pages/employees/employees';
import { EmployeeDetailPage } from '../pages/employee-detail/employee-detail';
import { Locations } from '../pages/locations/locations';
import { LocationForm } from '../pages/location-form/location-form';
import { Reports } from '../pages/reports/reports';
import { Profile } from '../pages/profile/profile';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Unauthenticated screens — Auth layout (no sidebar/topbar)
  {
    path: '',
    component: Auth,
    canActivate: [guestGuard],
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
            "Enter the Employee ID or Email you sign in with and we'll send a reset link.",
        },
      },
    ],
  },

  // App screens — Main layout (sidebar + topbar + page outlet)
  {
    path: '',
    component: Main,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'attendance', component: Attendance },
      { path: 'employees', component: Employees },
      { path: 'employees/view/:id', component: EmployeeDetailPage },
      { path: 'locations', component: Locations },
      { path: 'locations/new', component: LocationForm },
      { path: 'locations/edit/:id', component: LocationForm },
      { path: 'reports', component: Reports },
      { path: 'profile', component: Profile },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
