import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { Auth } from './auth';
import { API_ENDPOINTS } from '../../utils/config/api.config';
import { LoginUserData } from '../../utils/interface/auth-response.interface';

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;

  const userData: LoginUserData = {
    empId: 1,
    empName: 'Vijay Sam',
    empEmail: 'joe_f@trigent.com',
    empRoleId: 1,
    empRole: 'Human Resource/ Admin',
    token: 'test-token',
    tokenType: 'Bearer',
    expiresIn: 86400,
    expiryTime: '2026-09-26T03:59:19.118Z',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideRouter([])],
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build login request with empId when identifier has no @', () => {
    expect(service.buildLoginRequest('20', 'secret1A')).toEqual({
      empId: '20',
      password: 'secret1A',
    });
  });

  it('should build login request with email when identifier contains @', () => {
    expect(
      service.buildLoginRequest('joe@example.com', 'secret1A'),
    ).toEqual({
      email: 'joe@example.com',
      password: 'secret1A',
    });
  });

  it('should build forgot-password request with employeeId or empEmail', () => {
    expect(service.buildForgotPasswordRequest('2')).toEqual({
      employeeId: '2',
    });
    expect(service.buildForgotPasswordRequest('a@b.com')).toEqual({
      empEmail: 'a@b.com',
    });
  });

  it('should POST login and return response', () => {
    const payload = { empId: '20', password: 'secret1A' };
    let result: unknown;
    service.login(payload).subscribe((res) => (result = res));

    const req = httpMock.expectOne(API_ENDPOINTS.login);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      success: true,
      message: 'Login successful',
      data: userData,
    });

    expect(result).toEqual({
      success: true,
      message: 'Login successful',
      data: userData,
    });
  });

  it('should POST forgot-password and return response', () => {
    const payload = { employeeId: '2' };
    let result: unknown;
    service.forgotPassword(payload).subscribe((res) => (result = res));

    const req = httpMock.expectOne(API_ENDPOINTS.forgotPassword);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      success: true,
      message: 'Temporary password has been sent to the employee email',
    });

    expect(result).toEqual({
      success: true,
      message: 'Temporary password has been sent to the employee email',
    });
  });

  it('should save and clear session in localStorage', () => {
    expect(service.isAuthenticated()).toBeFalse();
    service.saveSession(userData);
    expect(service.getToken()).toBe('test-token');
    expect(service.getUser()).toEqual(userData);
    expect(service.isAuthenticated()).toBeTrue();
    service.clearSession();
    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should clear all localStorage and navigate to login on logout', () => {
    localStorage.setItem('auth_token', 't');
    localStorage.setItem('other_key', 'x');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('other_key')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
