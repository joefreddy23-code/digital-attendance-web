import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MainLayoutService } from '../../services/main-layout/main-layout';
import { Topbar } from './topbar';

describe('Topbar', () => {
  let fixture: ComponentFixture<Topbar>;
  let layout: MainLayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
    }).compileComponents();

    layout = TestBed.inject(MainLayoutService);
    fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle sidebar via burger', () => {
    expect(layout.sidebarExpanded()).toBeTrue();
    const btn = fixture.debugElement.query(By.css('button.topbar__burger'));
    btn.triggerEventHandler('click', {});
    expect(layout.sidebarExpanded()).toBeFalse();
  });
});
