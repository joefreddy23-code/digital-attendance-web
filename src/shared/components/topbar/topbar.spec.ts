import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { MainLayoutService } from '../../services/main-layout/main-layout';
import { Topbar } from './topbar';

describe('Topbar', () => {
  let fixture: ComponentFixture<Topbar>;
  let layout: MainLayoutService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [provideRouter([])],
    }).compileComponents();

    layout = TestBed.inject(MainLayoutService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle sidebar via burger', () => {
    layout.sidebarExpanded.set(true);
    expect(layout.sidebarExpanded()).toBeTrue();
    const btn = fixture.debugElement.query(By.css('button.topbar__burger'));
    btn.triggerEventHandler('click', {});
    expect(layout.sidebarExpanded()).toBeFalse();
  });

  it('should show Overview title and sign out to login', () => {
    expect(fixture.nativeElement.textContent).toContain('Overview');
    expect(fixture.nativeElement.textContent).toContain('Sign out');

    const signOut = fixture.debugElement.query(By.css('button.topbar__signout'));
    signOut.triggerEventHandler('click', {});
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
