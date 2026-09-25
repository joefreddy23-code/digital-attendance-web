import { API_ENDPOINTS } from './api.config';

describe('API_ENDPOINTS', () => {
  it('should expose login and forgot-password URLs', () => {
    expect(API_ENDPOINTS.login).toBe('http://localhost:3005/web/login');
    expect(API_ENDPOINTS.forgotPassword).toBe(
      'http://localhost:3006/web/forgot-password',
    );
  });
});
