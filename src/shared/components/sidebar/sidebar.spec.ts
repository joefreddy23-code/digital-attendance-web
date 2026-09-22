import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { MainLayoutService } from '../../services/main-layout/main-layout';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let layout: MainLayoutService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    layout = TestBed.inject(MainLayoutService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
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
