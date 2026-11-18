// ── Employee monthly attendance report ──────────────────────────────────────────

/**
 * Request payload for the employee-monthly-attendance report.
 *
 * `startDate` and `endDate` (yyyy-mm-dd) are the only mandatory fields.
 * `employeeIds` and `locationIds` are sent ONLY when the user narrows the
 * filters away from "All" — when either is "All" that key is omitted entirely.
 * `generateExcel` is always false for the in-app table view.
 */
export interface MonthlyAttendanceRequest {
  startDate: string;
  endDate: string;
  employeeIds?: number[];
  locationIds?: number[];
  generateExcel: boolean;
}

/**
 * A single per-day attendance cell. The API returns one of these objects under
 * each day key on a row, e.g. "3 Oct 26": { status: "P", checkinDatetime: … }.
 *
 * `status` is a short code:
 *   - "P"  present
 *   - "L"  leave
 *   - "WO" week off
 *   - "NA" not applicable
 *   - "-"  no data / outside the working range
 *
 * `checkinDatetime` / `checkoutDatetime` are raw timestamps
 * ("2026-10-03 09:30:00.000000") or null when there is no punch.
 */
export interface DayCell {
  status: string;
  checkinDatetime: string | null;
  checkoutDatetime: string | null;
  /**
   * Location code where the person checked in that day, e.g. "BLR-1".
   * Optional: the print template also accepts `checkInLocation` / `locCode`.
   */
  checkinLocCode?: string | null;
  checkInLocation?: string | null;
  locCode?: string | null;
}

/**
 * A single report row. Alongside the known fixed fields, each row also carries
 * one dynamic key per day in the range, e.g. "1 Oct 26": { status: "L", … }.
 * Those are captured by the index signature as `DayCell` objects.
 */
export interface MonthlyAttendanceRow {
  EmpNo: number;
  EmpName: string;
  DOJ: string | null;
  Designation: string | null;
  Client: string | null;
  /** Allocated location code(s) for the employee, e.g. "BLR-1, CMB-1". */
  Location: string | null;
  /** Signature image URL (signed S3 link) or null when none on file. */
  EmployeeSignature?: string | null;
  Month: string;
  'Total Working Days': string;
  'Days Worked': string;
  /** Per-day cells ("1 Oct 26", …) plus fixed string/number/null columns. */
  [key: string]: string | number | null | DayCell | undefined;
}

export interface MonthlyAttendanceResponse {
  success: boolean;
  data?: MonthlyAttendanceRow[];
  message?: string;
}

/**
 * When the report is requested with `generateExcel: true`, the backend returns
 * the .xlsx file as a RAW base64 string in the response body (no JSON
 * envelope). The client reads it as plain text and decodes it into a Blob, so
 * no dedicated response interface is needed.
 */
