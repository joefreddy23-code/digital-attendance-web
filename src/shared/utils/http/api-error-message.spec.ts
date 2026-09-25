import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it('should return API message from HttpErrorResponse body', () => {
    const err = new HttpErrorResponse({
      status: 401,
      error: { success: false, message: 'Invalid email or password' },
    });
    expect(apiErrorMessage(err)).toBe('Invalid email or password');
  });

  it('should return fallback when body has no message', () => {
    const err = new HttpErrorResponse({ status: 0, error: null });
    expect(apiErrorMessage(err)).toBe('Unable to connect. Please try again.');
  });

  it('should return fallback for non-HTTP errors', () => {
    expect(apiErrorMessage(new Error('boom'))).toBe(
      'Unable to connect. Please try again.',
    );
  });
});
