import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import { OverviewResponse } from '../../utils/interface/overview-response.interface';
import { Overview } from './overview';

describe('Overview', () => {
  let service: Overview;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(Overview);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET overview endpoint', () => {
    const mock: OverviewResponse = {
      success: true,
      data: {
        totalEmployees: 18,
        totalCheckedIn: 1,
        yettoCheckIn: 17,
        employeesByCity: [
          {
            city: 'Bengaluru',
            totalemployeeCount: 9,
            employeeCount: 1,
          },
        ],
      },
    };

    service.getOverview().subscribe((res) => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne(API_ENDPOINTS.overview);
    expect(req.request.method).toBe('GET');
    expect(req.request.body).toBeNull();
    req.flush(mock);
  });
});
