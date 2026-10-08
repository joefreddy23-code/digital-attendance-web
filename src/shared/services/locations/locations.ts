import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import {
  DeactivateLocationRequest,
  DeactivateLocationResponse,
  GetLocationRequest,
  GetLocationResponse,
  LocationsResponse,
  UpsertLocationRequest,
  UpsertLocationResponse,
} from '../../utils/interface/locations-response.interface';

@Injectable({
  providedIn: 'root',
})
export class LocationsService {
  private readonly http = inject(HttpClient);

  getLocations(): Observable<LocationsResponse> {
    return this.http.get<LocationsResponse>(API_ENDPOINTS.getLocations);
  }

  getLocation(payload: GetLocationRequest): Observable<GetLocationResponse> {
    return this.http.post<GetLocationResponse>(
      API_ENDPOINTS.getLocation,
      payload,
    );
  }

  upsertLocation(
    payload: UpsertLocationRequest,
  ): Observable<UpsertLocationResponse> {
    return this.http.post<UpsertLocationResponse>(
      API_ENDPOINTS.upsertLocation,
      payload,
    );
  }

  deactivateLocation(
    payload: DeactivateLocationRequest,
  ): Observable<DeactivateLocationResponse> {
    return this.http.post<DeactivateLocationResponse>(
      API_ENDPOINTS.deactivateLocation,
      payload,
    );
  }
}
