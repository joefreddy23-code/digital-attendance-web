import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../utils/config/api.config';
import { Auth } from '../services/auth/auth';
import { SessionExpired } from '../services/session-expired/session-expired';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const sessionExpired = inject(SessionExpired);
  const isAuthEndpoint =
    req.url === API_ENDPOINTS.login ||
    req.url === API_ENDPOINTS.forgotPassword;

  if (isAuthEndpoint) {
    return next(req);
  }

  const token = auth.getToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ).pipe(
    catchError((error) => {
      if (error?.status === HttpStatusCode.Unauthorized) {
        // Clear session first, then navigate to /login, then show the modal.
        // The modal lives on the Auth layout so it will be present after redirect.
        auth.logout();
        sessionExpired.show();
      }
      return throwError(() => error);
    }),
  );
};
