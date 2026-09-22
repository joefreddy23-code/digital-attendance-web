import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Auth } from './auth';

@Component({
  standalone: true,
  template: `<p>child</p>`,
})
class StubChild {}

const testRoutes: Routes = [
  {
    path: '',
    component: Auth,
    children: [
      { path: 'login', component: StubChild },
      { path: 'forgot-password', component: StubChild },
    ],
  },
];

describe('Auth', () => {
  let fixture: ComponentFixture<Auth>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [provideRouter(testRoutes)],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Auth);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render full logo brand and static left copy', async () => {
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Attendance & Compliance');
    expect(text).toContain('Every shift, verified.');
    expect(text).toContain('Employees, locations and compliance reports');
    expect(text).toContain('Employees');
    expect(text).toContain('Locations');
    expect(text).toContain('Reports');

    const logo = fixture.debugElement.query(By.css('img.auth-brand__logo'));
    expect(logo).toBeTruthy();
    expect(logo.nativeElement.getAttribute('src')).toContain('trigentLogoFullLight.png');
    expect(logo.nativeElement.getAttribute('alt')).toBe('TRIGENT');
  });

  it('should keep the same left copy on forgot-password', async () => {
    await router.navigateByUrl('/forgot-password');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Every shift, verified.');
    expect(text).not.toContain('Locked out? Happens.');
  });
});
