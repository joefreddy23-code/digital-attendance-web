import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let router: Router;
  let component: Login;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
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

  it('should render welcome card without keep-signed-in', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Welcome back');
    expect(text).toContain('Sign in to the HR admin portal');
    expect(text).toContain('Forgot password?');
    expect(text).toContain('Employee ID');
    expect(text).not.toContain('Keep me signed in');

    const forgot = fixture.debugElement.query(
      By.css('a[href="/forgot-password"], a[routerLink="/forgot-password"]'),
    );
    expect(forgot).toBeTruthy();
  });

  it('should show required errors on empty submit and not navigate', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Employee ID is required');
    expect(text).toContain('Password is required');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show password length and strength errors', () => {
    component.form.setValue({ employeeId: 'E001', password: 'short' });
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Password must be at least 8 characters',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    component.form.setValue({ employeeId: 'E001', password: 'longenough' });
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Password must include at least one letter and one number',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should navigate to dashboard on valid submit', () => {
    component.form.setValue({ employeeId: 'E001', password: 'Password1' });
    component.onSubmit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
