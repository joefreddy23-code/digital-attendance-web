import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;
  let component: ForgotPassword;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render reset card with Employee ID copy and back link', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Reset your password');
    expect(text).toContain("Enter your Employee ID and we'll send a reset link");
    expect(text).toContain('Employee ID');
    expect(text).toContain('Remembered it?');
    expect(text).toContain('Back to sign in');
    expect(text).not.toContain('Work email');
    expect(text).not.toContain("We'll email you a link to set a new one");

    const back = fixture.debugElement.query(By.css('a.auth-card__back'));
    expect(back).toBeTruthy();
  });

  it('should show Employee ID required error on empty submit', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Employee ID is required');
    expect(component.form.invalid).toBeTrue();
  });

  it('should accept a valid Employee ID submit without throwing', () => {
    component.form.setValue({ employeeId: 'E001' });
    expect(() => component.onSubmit()).not.toThrow();
    expect(component.form.valid).toBeTrue();
  });
});
