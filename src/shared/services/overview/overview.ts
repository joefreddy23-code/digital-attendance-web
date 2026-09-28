import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../utils/config/api.config';
import { OverviewResponse } from '../../utils/interface/overview-response.interface';

@Injectable({
  providedIn: 'root',
})
export class Overview {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<OverviewResponse> {
    return this.http.get<OverviewResponse>(API_ENDPOINTS.overview);
  }
}
