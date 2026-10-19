export interface LoginRequest {
  empId?: string;
  email?: string;
  password: string;
}

export interface ForgotPasswordRequest {
  employeeId?: string;
  empEmail?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
