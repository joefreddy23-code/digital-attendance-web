export interface LoginRequest {
  empId?: string;
  email?: string;
  password: string;
}

export interface ForgotPasswordRequest {
  employeeId?: string;
  empEmail?: string;
}
