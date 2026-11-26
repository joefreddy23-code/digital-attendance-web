import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import { AnalyticsService } from '../analytics/analytics';
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
} from '../../utils/interface/auth-request.interface';
import {
  ChangePasswordResponse,
  ForgotPasswordResponse,
  LoginResponse,
  LoginUserData,
} from '../../utils/interface/auth-response.interface';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(API_ENDPOINTS.login, payload);
  }

  forgotPassword(
    payload: ForgotPasswordRequest,
  ): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      API_ENDPOINTS.forgotPassword,
      payload,
    );
  }

  changePassword(
    payload: ChangePasswordRequest,
  ): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(
      API_ENDPOINTS.changePassword,
      payload,
    );
  }

  buildLoginRequest(identifier: string, password: string): LoginRequest {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return { email: trimmed, password };
    }
    return { empId: trimmed, password };
  }

  buildForgotPasswordRequest(identifier: string): ForgotPasswordRequest {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return { empEmail: trimmed };
    }
    return { employeeId: trimmed };
  }

  saveSession(data: LoginUserData): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    this.analytics.setUser(data);
    this.analytics.logEvent('login');
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.analytics.clearUser();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): LoginUserData | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as LoginUserData;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.analytics.logEvent('logout');
    this.analytics.clearUser();
    localStorage.clear();
    void this.router.navigateByUrl('/login');
  }
}

