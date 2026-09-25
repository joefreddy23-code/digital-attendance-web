import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { authGuard } from './auth.guard';
import { Auth } from '../services/auth/auth';

describe('authGuard', () => {
  let auth: Auth;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
    auth = TestBed.inject(Auth);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow activation when authenticated', () => {
    spyOn(auth, 'isAuthenticated').and.returnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(result).toBeTrue();
  });

  it('should redirect to /login when not authenticated', () => {
    spyOn(auth, 'isAuthenticated').and.returnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
