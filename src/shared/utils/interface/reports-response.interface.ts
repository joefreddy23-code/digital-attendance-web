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
 * A single report row. Alongside the known fixed fields, each row also carries
 * one dynamic key per day in the range, e.g. "1 Oct 26": "L". Those are
 * captured by the index signature.
 */
export interface MonthlyAttendanceRow {
  EmpNo: number;
  EmpName: string;
  DOJ: string | null;
  Designation: string | null;
  Client: string | null;
  /** Allocated location code(s) for the employee, e.g. "BLR-1, CMB-1". */
  Location: string | null;
  Month: string;
  'Total Working Days': string;
  'Days Worked': string;
  /** Per-day status cells ("1 Oct 26", "2 Oct 26", …) plus any other columns. */
  [key: string]: string | number | null;
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
