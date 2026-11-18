const base = `https://8n4ktyczm8.execute-api.us-east-1.amazonaws.com/master`;

/**
 * Base URL for stored media (employee signatures, etc.). Report rows carry the
 * signature as a relative S3 object key such as
 * "signatures/2/88ac....jpg"; it is resolved against this base to a full,
 * loadable image URL. If signatures live behind a different bucket/CDN, change
 * only this value.
 */
export const MEDIA_BASE_URL =
  `https://8n4ktyczm8.execute-api.us-east-1.amazonaws.com/master/media`;

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
  addCompOff: `${base}/web/add-compoff`,
  changePassword: `${base}/web/change-password`,
  employeeMonthlyAttendance: `${base}/web/employee-monthly-attendance`
} as const;
