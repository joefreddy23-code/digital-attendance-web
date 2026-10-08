const base = `https://8n4ktyczm8.execute-api.us-east-1.amazonaws.com/master`;


export const API_ENDPOINTS = {
  login: `${base}/web/login`,
  forgotPassword: `${base}/web/forgot-password`,
  overview: `${base}/web/overview`,
  getLocations: `${base}/web/getlocations`,
  deactivateLocation: `${base}/web/deactivate-location`,
  getLocation: `${base}/web/location`,
  upsertLocation: `${base}/web/upsertlocation`,
  getFields: `${base}/web/get-fields`,
  getEmployees: `${base}/web/employees`,
} as const;
