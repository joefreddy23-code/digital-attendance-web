import { ErrorHandler, Injectable, inject } from '@angular/core';
import { AnalyticsService } from './analytics';

/** Reports uncaught Angular errors to Analytics, then logs to the console. */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly analytics = inject(AnalyticsService);

  handleError(error: unknown): void {
    try {
      this.analytics.logError('uncaught', error);
    } catch {
      /* never let reporting break error handling */
    }
    console.error(error);
  }
}
