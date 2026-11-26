import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AnalyticsService } from '../services/analytics/analytics';

/** Reports failed HTTP calls to Analytics (method, path, status). */
export const errorTrackingInterceptor: HttpInterceptorFn = (req, next) => {
  const analytics = inject(AnalyticsService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        let path = req.url;
        try {
          path = new URL(req.url).pathname;
        } catch {
          /* relative url */
        }
        analytics.logError('http', error, {
          http_method: req.method,
          http_path: path.slice(0, 100),
          http_status: error.status,
        });
      }
      return throwError(() => error);
    }),
  );
};
