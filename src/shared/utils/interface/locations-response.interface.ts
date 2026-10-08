// ── Locations list ────────────────────────────────────────────────────────────

export interface Location {
  id: number;
  name: string;
  code: string;
  radiusInMeters: number;
  clientName: string;
  totalemployeeCount: number;
}

export interface LocationsData {
  locations: Location[];
}

export interface LocationsResponse {
  success: boolean;
  data?: LocationsData;
  message?: string;
}

// ── Get single location ────────────────────────────────────────────────────────

export interface GetLocationRequest {
  locationId: number;
}

export interface LocationDetail {
  id: number;
  code: string;
  physicalAddress: string;
  city: string;
  radiusInMeters: number;
  latitude: string;
  longitude: string;
}

export interface GetLocationData {
  location: LocationDetail;
}

export interface GetLocationResponse {
  success: boolean;
  data?: GetLocationData;
  message?: string;
}

// ── Deactivate location ───────────────────────────────────────────────────────

export interface DeactivateLocationRequest {
  locationId: number;
}

export interface DeactivateLocationData {
  locationId: number;
  message: string;
}

export interface DeactivateLocationResponse {
  success: boolean;
  data?: DeactivateLocationData;
  message?: string;
}


export interface UpsertLocationRequest {
  locationId: number | null;
  code: string;
  name: string;
  city: string;
  radiusInMeters: number;
  latitude: string;
  longitude: string;
}

export interface UpsertLocationData {
  locationId: number;
  message: string;
}

export interface UpsertLocationResponse {
  success: boolean;
  data?: UpsertLocationData;
  message?: string;
}
