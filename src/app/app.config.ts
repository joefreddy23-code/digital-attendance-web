import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from '../shared/interceptors/auth.interceptor';
import { loadingInterceptor } from '../shared/interceptors/loading.interceptor';
import { errorTrackingInterceptor } from '../shared/interceptors/error-tracking.interceptor';
import { AnalyticsService } from '../shared/services/analytics/analytics';
import { GlobalErrorHandler } from '../shared/services/analytics/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor, errorTrackingInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(() => inject(AnalyticsService).init()),
  ],
};

