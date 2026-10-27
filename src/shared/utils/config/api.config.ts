const base = `https://8n4ktyczm8.execute-api.us-east-1.amazonaws.com/master`;


export const API_ENDPOINTS = {
  login: `${base}/web/login`,
  forgotPassword: `${base}/web/forgot-password`,
  overview: `${base}/web/overview`,
  takeAction: `${base}/web/take-action`,
  getLocations: `${base}/web/getlocations`,
  deactivateLocation: `${base}/web/deactivate-location`,
  getLocation: `${base}/web/location`,
  upsertLocation: `${base}/web/upsertlocation`,
  getFields: `${base}/web/get-fields`,
  getEmployees: `${base}/web/employees`,
  getEmployee: `${base}/web/employee`,
  profileImgUrl: `${base}/web/profile-img-url`,
  upsertEmployee: `${base}/web/upsertemployee`,
  deactivateEmployee: `${base}/web/deactivate-employee`,
  changePassword: `${base}/web/change-password`,
  employeeMonthlyAttendance: `${base}/web/employee-monthly-attendance`,
} as const;
