import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import {
  GetEmployeesRequest,
  GetEmployeesResponse,
  GetFieldsResponse,
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
}
