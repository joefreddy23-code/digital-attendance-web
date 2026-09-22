import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render welcome card without keep-signed-in', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Welcome back');
    expect(text).toContain('Sign in to the HR admin portal');
    expect(text).toContain('Forgot password?');
    expect(text).not.toContain('Keep me signed in');

    const forgot = fixture.debugElement.query(By.css('a[href="/forgot-password"], a[routerLink="/forgot-password"]'));
    expect(forgot).toBeTruthy();
  });

  it('should navigate to dashboard on submit', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
