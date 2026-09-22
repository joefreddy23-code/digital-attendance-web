import { TestBed } from '@angular/core/testing';

import { MainLayoutService } from './main-layout';

describe('MainLayoutService', () => {
  let service: MainLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainLayoutService);
  });

  it('should start expanded', () => {
    expect(service.sidebarExpanded()).toBeTrue();
  });

  it('should toggle sidebarExpanded', () => {
    service.toggleSidebar();
    expect(service.sidebarExpanded()).toBeFalse();
    service.toggleSidebar();
    expect(service.sidebarExpanded()).toBeTrue();
  });
});
