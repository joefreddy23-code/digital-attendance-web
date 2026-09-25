import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { Auth } from '../../../shared/services/auth/auth';
import { LoginUserData } from '../../../shared/utils/interface/auth-response.interface';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let router: Router;
  let component: Login;
  let auth: jasmine.SpyObj<Auth>;

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

  beforeEach(async () => {
    auth = jasmine.createSpyObj<Auth>('Auth', [
      'login',
      'buildLoginRequest',
      'saveSession',
    ]);
    auth.buildLoginRequest.and.callFake((identifier, password) =>
      identifier.includes('@')
        ? { email: identifier, password }
        : { empId: identifier, password },
    );

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: Auth, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render welcome card with Employee ID or Email label', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Welcome back');
    expect(text).toContain('Employee ID or Email');
    expect(text).toContain('Forgot password?');
    expect(text).not.toContain('Keep me signed in');
  });

  it('should show required errors on empty submit and not call login', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Employee ID or Email is required');
    expect(text).toContain('Password is required');
    expect(auth.login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show password length and strength errors', () => {
    component.form.setValue({ identifier: 'E001', password: 'short' });
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Password must be at least 8 characters',
    );
    expect(auth.login).not.toHaveBeenCalled();

    component.form.setValue({ identifier: 'E001', password: 'longenough' });
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Password must include at least one letter and one number',
    );
  });

  it('should save session and navigate on successful login', () => {
    auth.login.and.returnValue(
      of({ success: true, message: 'Login successful', data: userData }),
    );
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(auth.buildLoginRequest).toHaveBeenCalledWith('20', 'Password1');
    expect(auth.login).toHaveBeenCalled();
    expect(auth.saveSession).toHaveBeenCalledWith(userData);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should show API message and not navigate on failed login', () => {
    auth.login.and.returnValue(
      of({ success: false, message: 'Invalid email or password' }),
    );
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Invalid email or password',
    );
    expect(auth.saveSession).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show API message from HttpErrorResponse body', () => {
    auth.login.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { success: false, message: 'Invalid email or password' },
          }),
      ),
    );
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Invalid email or password',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show fallback message on HTTP error without body message', () => {
    auth.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0, error: null })),
    );
    component.form.setValue({ identifier: '20', password: 'Password1' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to connect. Please try again.',
    );
  });

  it('should default password field to type password with show control', () => {
    const input = fixture.debugElement.query(By.css('input[formControlName="password"]'));
    expect(input.nativeElement.getAttribute('type')).toBe('password');
    const toggle = fixture.debugElement.query(By.css('button.auth-field__toggle'));
    expect(toggle).toBeTruthy();
    expect(toggle.nativeElement.getAttribute('aria-label')).toBe('Show password');
  });

  it('should toggle password visibility on eye button click', () => {
    const toggle = fixture.debugElement.query(By.css('button.auth-field__toggle'));
    toggle.triggerEventHandler('click', {});
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input[formControlName="password"]'));
    expect(input.nativeElement.getAttribute('type')).toBe('text');
    expect(toggle.nativeElement.getAttribute('aria-label')).toBe('Hide password');
    expect(toggle.nativeElement.querySelector('i.fa-eye-slash')).toBeTruthy();

    toggle.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(input.nativeElement.getAttribute('type')).toBe('password');
    expect(toggle.nativeElement.getAttribute('aria-label')).toBe('Show password');
  });
});
