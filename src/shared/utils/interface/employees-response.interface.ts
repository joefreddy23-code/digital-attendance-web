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

export interface FieldEmployee {
  employeeId: number;
  employeeName: string;
}

export interface GetFieldsData {
  roles: FieldRole[];
  designation: FieldDesignation[];
  reportingEmployees: FieldReportingEmployee[];
  locations: FieldLocation[];
  clients: FieldClient[];
  /** Flat employee list used to populate the reports employees multi-select. */
  employees?: FieldEmployee[];
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
  /** 1 = active employee, 0 = disabled/deactivated. */
  active: number;
}

export interface GetEmployeesResponse {
  success: boolean;
  data?: Employee[];
  message?: string;
}

// ── Get one employee (edit modal details) ───────────────────────────────────────

export interface GetEmployeeRequest {
  employeeId: number;
  /**
   * When true, the response also includes the employee's recent attendance
   * (the selected date + the previous four days). Defaults to false.
   *
   * Only the detail (employees/view) screen sets this; the edit modal fetches
   * the employee without attendance.
   */
  attendanceFetch?: boolean;
  /**
   * The reference date (yyyy-mm-dd) the attendance window ends on. Sent only
   * alongside `attendanceFetch=true`; the API returns that day plus the four
   * preceding days. Carried over from the employees list filter date.
   */
  date?: string | null;
}

export interface EmployeeDetail {
  id: number;
  name: string;
  mobileNumber: string;
  email: string;
  clientId: number | null;
  clientName: string | null;
  joiningDate: string | null;
  profileImgPath: string | null;
  roleId: number | null;
  roleName: string | null;
  designationId: number | null;
  designationName: string | null;
  supervisorId: number | null;
  accountManagerId: number | null;
  /** Location ids come back as strings from the API, e.g. ["2", "13"]. */
  allocatedLocationIds: string[];
  allocatedLocations: string[];
}

/**
 * A single day's attendance record. Returned only when the request is made
 * with `attendanceFetch=true`.
 */
export interface AttendanceRecord {
  /** ISO datetime for the day, e.g. "2026-10-12T00:00:00.000Z". */
  date: string;
  attendanceId: number | null;
  /** Location where the person checked in, e.g. "CHN-2". */
  checkInLocation: string | null;
  checkinLatitude: number | null;
  checkinLongitude: number | null;
  checkinDatetime: string | null;
  /** Location where the person checked out, e.g. "CHN-2". */
  checkOutLocation: string | null;
  checkoutLatitude: number | null;
  checkoutLongitude: number | null;
  checkoutDatetime: string | null;
  /** Worked duration as "HH:mm:ss", e.g. "08:12:00". */
  hours: string;
  /** Status code, e.g. "P" (present), "L" (leave), "WO" (week off). */
  status: string;
  /** 1 when the person was present (checked in) on the day, else null/0. */
  isPresent?: number | null;
  imgSrcPath: string | null;
  /**
   * Whether the check-out was recorded manually (1) rather than captured by the
   * mobile app (0). Shown as a "Manual entry" badge on the check-out panel.
   */
  manualEntry?: number | null;
  /**
   * Whether the day was recorded as a compensatory off (1) rather than a
   * regular attendance (0). Shown as a navy "Comp off" badge on the check-in
   * panel.
   */
  compOff?: number | null;
  /** Id of the user who performed the manual entry / comp-off. */
  approvedBy?: number | null;
  /** Name of that user; present only when manualEntry or compOff is 1. */
  approvedByName?: string | null;
}

export interface GetEmployeeData {
  employee: EmployeeDetail;
  /**
   * Present only when the request was made with `attendanceFetch=true`.
   * Contains today's record followed by the previous four days.
   */
  attendance?: AttendanceRecord[];
}

export interface GetEmployeeResponse {
  success: boolean;
  data?: GetEmployeeData;
  message?: string;
}

// ── Upload profile image (S3) ───────────────────────────────────────────────────

export interface UploadProfileImageRequest {
  /** Employee id (add → entered employee no, edit → existing id). */
  empId: number;
  /** Full base64 data URL, e.g. "data:image/png;base64,iVBOR...". */
  imageBase64: string;
}

export interface UploadProfileImageData {
  empId: number;
  /** Relative S3 key stored against the employee, e.g. "profile_image/5/123.png". */
  s3Key: string;
  /** Absolute S3 URL to the uploaded image. */
  profileImgPath: string;
}

export interface UploadProfileImageResponse {
  success: boolean;
  message?: string;
  data?: UploadProfileImageData;
}

// ── Upsert employee (add + edit share one endpoint) ─────────────────────────────

export interface UpsertEmployeeRequest {
  /**
   * Employee number / id. On add this is the new employee number entered in
   * the form; on edit it is the existing employee id. The backend uses it to
   * decide whether to insert or update.
   */
  empId: number;
  fullName: string;
  joiningDate: string;
  email: string;
  mobileNumber: string;
  roleId: number;
  /** null for an Account Manager (role 2), who has no designation. */
  designationId: number | null;
  supervisorId: number | null;
  accountManagerId: number | null;
  /**
   * The employee's profile image reference. Set to the `s3Key` returned by the
   * profile-img-url upload ONLY when a new image was chosen (add, or edit with
   * a replacement). It is null when no new image was picked — on edit this
   * leaves the stored image untouched, so the backend never re-saves the
   * returned presigned URL in place of the key.
   */
  profileImgPath: string | null;
  clientId: number;
  locationIds: number[];
}

export interface UpsertEmployeeData {
  empId: number;
  message: string;
}

export interface UpsertEmployeeResponse {
  success: boolean;
  data?: UpsertEmployeeData;
  message?: string;
}

// ── Deactivate employee ─────────────────────────────────────────────────────────

export interface DeactivateEmployeeRequest {
  employeeId: number;
  /** Relieving date as yyyy-mm-dd. */
  relievingDate: string;
}

/**
 * Note: unlike the other endpoints, this response is flat — `message` and
 * `employeeId` sit at the top level rather than under `data`.
 */
export interface DeactivateEmployeeResponse {
  success: boolean;
  message?: string;
  employeeId?: number;
}

// ── Add comp-off ─────────────────────────────────────────────────────────────

export interface AddCompOffRequest {
  /** Employee id the comp-off is being added for. */
  empId: number;
  /** The comp-off date as yyyy-mm-dd. Must be a past date. */
  date: string;
  /** 1 = manual entry (toggle off, default), 0 = comp-off (toggle on). */
  manualEntry: 0 | 1;
}

export interface AddCompOffData {
  attendanceId: number;
  empId: number;
  approverId: number;
  date: string;
  isPresent: number;
  compOff: number;
  manualEntry: number;
}

export interface AddCompOffResponse {
  success: boolean;
  message?: string;
  data?: AddCompOffData;
}
