import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK = 'Unable to connect. Please try again.';

export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const message = (err.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return FALLBACK;
}
