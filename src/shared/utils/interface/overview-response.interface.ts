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
