import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

import { Auth } from '../../services/auth/auth';
import { LoginUserData } from '../../utils/interface/auth-response.interface';
import { MainLayoutService } from '../../services/main-layout/main-layout';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let layout: MainLayoutService;
  let router: Router;
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
    auth = jasmine.createSpyObj<Auth>('Auth', ['getUser']);
    auth.getUser.and.returnValue(userData);

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: Auth, useValue: auth },
      ],
    }).compileComponents();

    layout = TestBed.inject(MainLayoutService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render session user name, role, and initials', () => {
    expect(fixture.nativeElement.textContent).toContain('Vijay Sam');
    expect(fixture.nativeElement.textContent).toContain('Human Resource/ Admin');
    expect(fixture.nativeElement.textContent).toContain('VS');
    expect(fixture.nativeElement.textContent).not.toContain('Pooja D');
  });

  it('should render fallbacks when no session user', () => {
    auth.getUser.and.returnValue(null);
    fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('â€”');
    expect(fixture.debugElement.query(By.css('.sidebar__avatar')).nativeElement.textContent.trim()).toBe('?');
  });

  it('should show labels when expanded and hide when collapsed', () => {
    expect(fixture.nativeElement.classList.contains('sidebar--collapsed')).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Overview');
    expect(fixture.nativeElement.textContent).toContain('Attendance & Compliance');

    const expandedLogo = fixture.debugElement.query(By.css('img.sidebar__logo--full'));
    expect(expandedLogo).toBeTruthy();
    expect(expandedLogo.nativeElement.getAttribute('src')).toContain('trigentLogoFullLight.png');

    layout.sidebarExpanded.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.classList.contains('sidebar--collapsed')).toBeTrue();
    const labels = fixture.debugElement.queryAll(By.css('.sidebar__label'));
    expect(labels.length).toBe(0);
    expect(fixture.nativeElement.textContent).not.toContain('Attendance & Compliance');

    const collapsedLogo = fixture.debugElement.query(By.css('img.sidebar__logo--half'));
    expect(collapsedLogo).toBeTruthy();
    expect(collapsedLogo.nativeElement.getAttribute('src')).toContain('trigentLogoHalf.png');
  });

  it('should expose nav links for overview employees locations reports', () => {
    const hrefs = fixture.debugElement
      .queryAll(By.css('a.sidebar__link'))
      .map((el) => el.attributes['href'] || el.nativeElement.getAttribute('href'));
    expect(hrefs.join(' ')).toContain('dashboard');
    expect(hrefs.join(' ')).toContain('employees');
    expect(hrefs.join(' ')).toContain('locations');
    expect(hrefs.join(' ')).toContain('reports');
  });
});
