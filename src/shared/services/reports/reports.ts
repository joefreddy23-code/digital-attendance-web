import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import {
  MonthlyAttendanceRequest,
  MonthlyAttendanceResponse,
} from '../../utils/interface/reports-response.interface';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly http = inject(HttpClient);

  /**
   * Fetches the employee monthly attendance report.
   *
   * `startDate`/`endDate` are mandatory; `employeeIds`/`locationIds` are only
   * included on the payload when the caller narrows the filter (they are
   * omitted when "All" is selected). The bearer token is attached by the auth
   * interceptor.
   *
   * POST /web/employee-monthly-attendance
   */
  getMonthlyAttendance(
    payload: MonthlyAttendanceRequest,
  ): Observable<MonthlyAttendanceResponse> {
    return this.http.post<MonthlyAttendanceResponse>(
      API_ENDPOINTS.employeeMonthlyAttendance,
      payload,
    );
  }

  /**
   * Requests the same report with `generateExcel: true`. The backend responds
   * with the .xlsx file as a RAW base64 string in the body (not a JSON
   * envelope), so we read it as plain text and let the caller decode it. The
   * bearer token is attached by the auth interceptor.
   *
   * POST /web/employee-monthly-attendance  { ..., generateExcel: true }
   */
  downloadMonthlyAttendanceExcel(
    payload: MonthlyAttendanceRequest,
  ): Observable<string> {
    return this.http.post(
      API_ENDPOINTS.employeeMonthlyAttendance,
      { ...payload, generateExcel: true },
      { responseType: 'text' },
    );
  }
}
