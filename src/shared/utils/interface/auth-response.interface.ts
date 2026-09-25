export interface LoginUserData {
  empId: number;
  empName: string;
  empEmail: string;
  empRoleId: number;
  empRole: string;
  token: string;
  tokenType: string;
  expiresIn: number;
  expiryTime: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: LoginUserData;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}
