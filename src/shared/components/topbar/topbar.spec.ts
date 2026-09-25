import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';

import { Auth } from '../../services/auth/auth';
import { MainLayoutService } from '../../services/main-layout/main-layout';
import { Topbar } from './topbar';

describe('Topbar', () => {
  let fixture: ComponentFixture<Topbar>;
  let layout: MainLayoutService;
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['logout']);
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: Auth, useValue: auth },
      ],
    }).compileComponents();

    layout = TestBed.inject(MainLayoutService);
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

  it('should show Overview title and call Auth.logout on sign out', () => {
    expect(fixture.nativeElement.textContent).toContain('Overview');
    const signOut = fixture.debugElement.query(By.css('button.topbar__signout'));
    signOut.triggerEventHandler('click', {});
    expect(auth.logout).toHaveBeenCalled();
  });
});
