import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { ForgotPassword } from './forgot-password';
import { Auth } from '../../../shared/services/auth/auth';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;
  let component: ForgotPassword;
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<Auth>('Auth', [
      'forgotPassword',
      'buildForgotPasswordRequest',
    ]);
    auth.buildForgotPasswordRequest.and.callFake((identifier) =>
      identifier.includes('@')
        ? { empEmail: identifier }
        : { employeeId: identifier },
    );

    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([]), { provide: Auth, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render reset card with identifier copy and back link', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Reset your password');
    expect(text).toContain(
      "Enter your Employee ID or Email and we'll send a reset link",
    );
    expect(text).toContain('Employee ID or Email');
    expect(text).toContain('Back to sign in');

    const back = fixture.debugElement.query(By.css('a.auth-card__back'));
    expect(back).toBeTruthy();
  });

  it('should show required error on empty submit and not call API', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Employee ID or Email is required',
    );
    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('should show success message from API', () => {
    auth.forgotPassword.and.returnValue(
      of({
        success: true,
        message: 'Temporary password has been sent to the employee email',
      }),
    );
    component.form.setValue({ identifier: '2' });
    component.onSubmit();
    fixture.detectChanges();

    expect(auth.buildForgotPasswordRequest).toHaveBeenCalledWith('2');
    expect(fixture.nativeElement.textContent).toContain(
      'Temporary password has been sent to the employee email',
    );
  });

  it('should show failure message from API', () => {
    auth.forgotPassword.and.returnValue(
      of({
        success: false,
        message: 'Invalid employee ID or employee is inactive',
      }),
    );
    component.form.setValue({ identifier: '2' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Invalid employee ID or employee is inactive',
    );
  });

  it('should show API message from HttpErrorResponse body', () => {
    auth.forgotPassword.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { success: false, message: 'Invalid email or password' },
          }),
      ),
    );
    component.form.setValue({ identifier: '2' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Invalid email or password',
    );
  });

  it('should show fallback message on HTTP error without body message', () => {
    auth.forgotPassword.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0, error: null })),
    );
    component.form.setValue({ identifier: '2' });
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to connect. Please try again.',
    );
  });
});
