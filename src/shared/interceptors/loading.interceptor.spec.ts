import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { loadingInterceptor } from './loading.interceptor';
import { LoaderService } from '../services/loader/loader';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loader: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loader = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show loader during request and hide after response', () => {
    expect(loader.isLoading()).toBeFalse();
    http.get('/test').subscribe();
    expect(loader.isLoading()).toBeTrue();
    httpMock.expectOne('/test').flush({});
    expect(loader.isLoading()).toBeFalse();
  });

  it('should hide loader after error response', () => {
    http.get('/test').subscribe({ error: () => undefined });
    expect(loader.isLoading()).toBeTrue();
    httpMock.expectOne('/test').flush('fail', {
      status: 500,
      statusText: 'Server Error',
    });
    expect(loader.isLoading()).toBeFalse();
  });
});
