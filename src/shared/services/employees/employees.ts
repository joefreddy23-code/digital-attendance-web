import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import {
  GetEmployeeRequest,
  GetEmployeeResponse,
  GetEmployeesRequest,
  GetEmployeesResponse,
  GetFieldsResponse,
  UploadProfileImageRequest,
  UploadProfileImageResponse,
  UpsertEmployeeRequest,
  UpsertEmployeeResponse,
  DeactivateEmployeeRequest,
  DeactivateEmployeeResponse,
  AddCompOffRequest,
  AddCompOffResponse,
} from '../../utils/interface/employees-response.interface';

@Injectable({
  providedIn: 'root',
})
export class EmployeesService {
  private readonly http = inject(HttpClient);

  getFields(): Observable<GetFieldsResponse> {
    return this.http.get<GetFieldsResponse>(API_ENDPOINTS.getFields);
  }

  getEmployees(payload: GetEmployeesRequest): Observable<GetEmployeesResponse> {
    let params = new HttpParams().set('date', payload.date);

    if (payload.role != null && payload.role !== '') {
      params = params.set('role', String(payload.role));
    }
    if (payload.locationId != null && payload.locationId !== '') {
      params = params.set('locationId', String(payload.locationId));
    }
    if (payload.searchText != null && payload.searchText.trim() !== '') {
      params = params.set('searchText', payload.searchText.trim());
    }

    return this.http.get<GetEmployeesResponse>(API_ENDPOINTS.getEmployees, {
      params,
    });
  }

  /**
   * Fetches a single employee's full details.
   *
   * Edit modal (no attendance):
   *   GET /web/employee?employeeId=<id>
   *
   * Detail / view screen (recent attendance):
   *   GET /web/employee?employeeId=<id>&attendanceFetch=true&date=<yyyy-mm-dd>
   *
   * `attendanceFetch` and `date` are sent together ONLY when attendance is
   * requested; the API then returns that date plus the four preceding days.
   * The bearer token is attached by the auth interceptor.
   */
  getEmployee(payload: GetEmployeeRequest): Observable<GetEmployeeResponse> {
    let params = new HttpParams().set(
      'employeeId',
      String(payload.employeeId),
    );

    if (payload.attendanceFetch) {
      params = params.set('attendanceFetch', 'true');
      if (payload.date != null && payload.date !== '') {
        params = params.set('date', payload.date);
      }
    }

    return this.http.get<GetEmployeeResponse>(API_ENDPOINTS.getEmployee, {
      params,
    });
  }

  /**
   * Uploads a profile image (base64) to S3 for an employee and returns the
   * stored `s3Key` / absolute path. This must be called before upsertEmployee
   * whenever a new image is chosen; the returned `s3Key` is then passed as the
   * upsert payload's `profileImgPath`. The bearer token is attached by the
   * auth interceptor.
   *
   * POST /web/profile-img-url  { empId, imageBase64 }
   */
  uploadProfileImage(
    payload: UploadProfileImageRequest,
  ): Observable<UploadProfileImageResponse> {
    return this.http.post<UploadProfileImageResponse>(
      API_ENDPOINTS.profileImgUrl,
      payload,
    );
  }

  /**
   * Creates or updates an employee. The same endpoint handles both: the
   * backend decides insert vs update from the payload's `empId`. The bearer
   * token is attached by the auth interceptor.
   *
   * POST /web/upsertemployee
   */
  upsertEmployee(
    payload: UpsertEmployeeRequest,
  ): Observable<UpsertEmployeeResponse> {
    return this.http.post<UpsertEmployeeResponse>(
      API_ENDPOINTS.upsertEmployee,
      payload,
    );
  }

  /**
   * Deactivates (relieves) an employee. The bearer token is attached by the
   * auth interceptor.
   *
   * POST /web/deactivate-employee  { employeeId, relievingDate }
   */
  deactivateEmployee(
    payload: DeactivateEmployeeRequest,
  ): Observable<DeactivateEmployeeResponse> {
    return this.http.post<DeactivateEmployeeResponse>(
      API_ENDPOINTS.deactivateEmployee,
      payload,
    );
  }

  /**
   * Adds a compensatory off (comp-off) for an employee on a past date. Only
   * available when the employee's status is on leave ("L"). The bearer token
   * is attached by the auth interceptor.
   *
   * POST /web/add-compoff  { empId, date }
   */
  addCompOff(payload: AddCompOffRequest): Observable<AddCompOffResponse> {
    return this.http.post<AddCompOffResponse>(
      API_ENDPOINTS.addCompOff,
      payload,
    );
  }
}
