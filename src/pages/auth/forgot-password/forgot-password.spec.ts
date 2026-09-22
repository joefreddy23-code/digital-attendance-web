import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render reset card and back link', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Reset your password');
    expect(text).toContain("We'll email you a link to set a new one");
    expect(text).toContain('Remembered it?');
    expect(text).toContain('Back to sign in');

    const back = fixture.debugElement.query(By.css('a.auth-card__back'));
    expect(back).toBeTruthy();
  });
});
