import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import {
  Analytics,
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  setUserProperties,
} from 'firebase/analytics';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginUserData } from '../../utils/interface/auth-response.interface';

const USER_KEY = 'auth_user';
const PARAM_MAX = 100; // GA4 limit for event parameter values
const STACK_CHUNKS = 3;

type Params = Record<string, string | number | boolean | undefined>;

/**
 * Firebase Analytics wrapper. Firebase Crashlytics has no web SDK, so errors
 * are reported as custom `app_error` events carrying user and context metadata.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly router = inject(Router);
  private analytics: Analytics | null = null;
  private user: { id: string; role: string; name: string } | null = null;
  private pending: Array<() => void> = [];

  /** Starts Firebase, restores the user from a saved session and tracks page views. */
  init(): void {
    isSupported()
      .then((ok) => {
        if (!ok) {
          return;
        }
        this.analytics = getAnalytics(initializeApp(environment.firebase));
        this.restoreUser();
        this.pending.forEach((fn) => fn());
        this.pending = [];
      })
      .catch(() => undefined);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.logEvent('page_view', {
          page_path: e.urlAfterRedirects.split('?')[0],
          page_location: window.location.href.split('?')[0],
          page_title: document.title,
        });
      });
  }

  setUser(data: LoginUserData): void {
    this.user = {
      id: String(data.empId),
      role: data.empRole ?? '',
      name: data.empName ?? '',
    };
    this.applyUser();
  }

  clearUser(): void {
    this.user = null;
    this.run(() => {
      setUserId(this.analytics!, null);
      setUserProperties(this.analytics!, { role: null, name: null });
    });
  }

  logEvent(name: string, params: Params = {}): void {
    this.run(() => logEvent(this.analytics!, name, this.withContext(params)));
  }

  /** Reports an error or crash with user, page and browser metadata. */
  logError(source: string, error: unknown, extra: Params = {}): void {
    const e = error as { message?: unknown; name?: unknown; stack?: unknown } | null;
    const message = String(e?.message ?? error ?? 'Unknown error');
    const stack = typeof e?.stack === 'string' ? e.stack : '';
    const params: Params = {
      source,
      error_name: this.cut(String(e?.name ?? 'Error')),
      error_message: this.cut(message),
      ...extra,
    };
    for (let i = 0; i < STACK_CHUNKS; i++) {
      const chunk = stack.slice(i * PARAM_MAX, (i + 1) * PARAM_MAX);
      if (chunk) {
        params[`stack_${i + 1}`] = chunk;
      }
    }
    this.logEvent('app_error', params);
  }

  private withContext(params: Params): Params {
    const ctx: Params = {
      ...params,
      user_id: this.user?.id,
      user_role: this.user?.role,
      user_name: this.cut(this.user?.name ?? ''),
      current_url: this.cut(this.router.url.split('?')[0]),
      app_version: environment.appVersion,
      user_agent: this.cut(navigator.userAgent),
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
    };
    Object.keys(ctx).forEach((k) => ctx[k] === undefined && delete ctx[k]);
    return ctx;
  }

  private applyUser(): void {
    this.run(() => {
      if (!this.user) {
        return;
      }
      setUserId(this.analytics!, this.user.id);
      setUserProperties(this.analytics!, { role: this.user.role, name: this.user.name });
    });
  }

  private restoreUser(): void {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) {
        this.setUser(JSON.parse(raw) as LoginUserData);
      }
    } catch {
      /* ignore corrupt session */
    }
  }

  /** Runs now if Firebase is ready, otherwise once it finishes initializing. */
  private run(fn: () => void): void {
    if (this.analytics) {
      fn();
    } else {
      this.pending.push(fn);
    }
  }

  private cut(value: string): string {
    return value.length > PARAM_MAX ? value.slice(0, PARAM_MAX) : value;
  }
}
