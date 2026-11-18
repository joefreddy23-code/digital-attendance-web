export interface EmployeesByCity {
  city: string;
  totalemployeeCount: number;
  employeeCount: number;
}

export interface ExceptionNote {
  exceptionId: number;
  employeeId: number;
  employeeName: string;
  roleName: string;
  attendanceId: number;
  issueNote: string;
  /** ISO date; null when the exception is for a missed check-in. */
  attendanceDate: string | null;
  /** 1 when the employee missed check-in, otherwise 0. */
  missedCheckIn: number;
  /** null when there is no check-in (missed check-in). */
  checkinDatetime: string | null;
  checkinLocCode: string | null;
}

export interface OverviewData {
  totalEmployees: number;
  totalCheckedIn: number;
  yettoCheckIn: number;
  employeesByCity: EmployeesByCity[];
  exceptionNotes?: ExceptionNote[];
}

export interface OverviewResponse {
  success: boolean;
  data?: OverviewData;
  message?: string;
}

// ── Take action (approve a supervisor exception / missed check-out) ─────────────

export interface TakeActionRequest {
  exceptionId: number;
  attendanceId: number;
  /**
   * "YYYY-MM-DD HH:mm:ss" - same date as the check-in, time picked by the
   * supervisor. null when marking a missed check-in note as read.
   */
  checkOutTime: string | null;
  /** 1 for a missed check-in (manual entry) note, 0 for a missed check-out. */
  manualEntry: 0 | 1;
}

export interface TakeActionResponse {
  success: boolean;
  data?: {
    message?: string;
  };
  message?: string;
  /** Detail returned on failure, e.g. "Checkout time must be greater than check-in time". */
  error?: string;
}
