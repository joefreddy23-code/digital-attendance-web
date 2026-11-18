import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import {
  OverviewResponse,
  TakeActionRequest,
  TakeActionResponse,
} from '../../utils/interface/overview-response.interface';

@Injectable({
  providedIn: 'root',
})
export class Overview {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<OverviewResponse> {
    return this.http.get<OverviewResponse>(API_ENDPOINTS.overview);
  }

  /**
   * Takes action on a supervisor exception. The bearer token is attached by
   * the auth interceptor.
   *
   * POST /web/take-action  { exceptionId, attendanceId, checkOutTime, manualEntry }
   * - Missed check-in (mark as read): checkOutTime null, manualEntry 1.
   * - Missed check-out (approve): checkOutTime set, manualEntry 0.
   */
  takeAction(payload: TakeActionRequest): Observable<TakeActionResponse> {
    return this.http.post<TakeActionResponse>(
      API_ENDPOINTS.takeAction,
      payload,
    );
  }
}
