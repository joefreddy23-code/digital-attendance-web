import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_ENDPOINTS } from '../utils/config/api.config';
import { Auth } from '../services/auth/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: auth },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Bearer token when present', () => {
    auth.getToken.and.returnValue('abc123');

    http.get(API_ENDPOINTS.overview).subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.overview);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('should not attach Authorization when token is null', () => {
    auth.getToken.and.returnValue(null);

    http.get(API_ENDPOINTS.overview).subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.overview);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should skip Bearer on login URL', () => {
    auth.getToken.and.returnValue('abc123');

    http.post(API_ENDPOINTS.login, {}).subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.login);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should skip Bearer on forgot-password URL', () => {
    auth.getToken.and.returnValue('abc123');

    http.post(API_ENDPOINTS.forgotPassword, {}).subscribe();

    const req = httpMock.expectOne(API_ENDPOINTS.forgotPassword);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
