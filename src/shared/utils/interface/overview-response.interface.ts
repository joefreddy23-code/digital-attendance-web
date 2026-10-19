export interface EmployeesByCity {
  city: string;
  totalemployeeCount: number;
  employeeCount: number;
}

export interface SupervisorQuery {
  exceptionId: number;
  employeeId: number;
  employeeName: string;
  attendanceId: number;
  issueNote: string;
  checkinDatetime: string;
  checkinLocCode: string;
}

export interface OverviewData {
  totalEmployees: number;
  totalCheckedIn: number;
  yettoCheckIn: number;
  employeesByCity: EmployeesByCity[];
  supervisorQueries?: SupervisorQuery[];
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
}

export interface TakeActionResponse {
  success: boolean;
  data?: {
    message?: string;
  };
  message?: string;
}
