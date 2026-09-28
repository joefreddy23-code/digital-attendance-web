import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_ENDPOINTS } from '../utils/config/api.config';
import { Auth } from '../services/auth/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
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
  );
};
