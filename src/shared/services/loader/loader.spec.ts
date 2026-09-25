import { TestBed } from '@angular/core/testing';

import { LoaderService } from './loader';

describe('LoaderService', () => {
  let loader: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    loader = TestBed.inject(LoaderService);
  });

  it('should start not loading', () => {
    expect(loader.isLoading()).toBeFalse();
  });

  it('should track nested show/hide with a counter', () => {
    loader.show();
    expect(loader.isLoading()).toBeTrue();
    loader.show();
    expect(loader.isLoading()).toBeTrue();
    loader.hide();
    expect(loader.isLoading()).toBeTrue();
    loader.hide();
    expect(loader.isLoading()).toBeFalse();
  });

  it('should not go below zero on hide', () => {
    loader.hide();
    expect(loader.isLoading()).toBeFalse();
  });
});
