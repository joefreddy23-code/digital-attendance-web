// ── Get fields (filter dropdown master data) ───────────────────────────────────

export interface FieldRole {
  roleId: number;
  roleName: string;
}

export interface FieldDesignation {
  designationId: number;
  designationName: string;
  roleId: number;
}

export interface FieldReportingEmployee {
  employeeId: number;
  employeeName: string;
  roleId: number;
  roleName: string;
  designationId: number;
  designationName: string;
}

export interface FieldLocation {
  locationId: number;
  locationCode: string;
  locationName: string;
  /** Optional headcount used by the location multi-select UI. */
  totalemployeeCount?: number;
}

export interface FieldClient {
  clientId: number;
  clientName: string;
}

export interface GetFieldsData {
  roles: FieldRole[];
  designation: FieldDesignation[];
  reportingEmployees: FieldReportingEmployee[];
  locations: FieldLocation[];
  clients: FieldClient[];
}

export interface GetFieldsResponse {
  success: boolean;
  data?: GetFieldsData;
  message?: string;
}

// ── Employees list ─────────────────────────────────────────────────────────────

export interface GetEmployeesRequest {
  date: string;
  role?: string | number | null;
  locationId?: string | number | null;
  searchText?: string | null;
}

export interface Employee {
  id: number;
  name: string;
  mobileNumber: string;
  email: string;
  roleId: number;
  roleName: string;
  designationId: number;
  designationName: string;
  status: string;
  allocatedLocations: string[];
}

export interface GetEmployeesResponse {
  success: boolean;
  data?: Employee[];
  message?: string;
}
