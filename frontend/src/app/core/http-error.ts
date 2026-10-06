import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models/customer.model';

/** Turn an HttpErrorResponse into a message that is safe to show the user. */
export function describeHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0 || err.status === 502 || err.status === 504) {
      return 'Cannot reach customer-service. Is it running?';
    }
    const body = err.error as Partial<ApiError> | null;
    if (body?.error) return body.error;
  }
  return 'Something went wrong. Please try again.';
}

/** Per-field messages from a 400/409 API response, if any. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof HttpErrorResponse)) return {};
  return ((err.error as Partial<ApiError> | null)?.fields ?? {}) as Record<string, string>;
}
