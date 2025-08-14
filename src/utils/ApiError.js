import { ERROR_CODES } from '@/utils/errorCodes';

export class ApiError extends Error {
  constructor(code, message, hint, correlationId) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.hint = hint;
    this.correlationId = correlationId;
  }
}

export const toApiError = (err, fallbackMessage = 'Error desconocido', correlationId) => {
  if (err instanceof ApiError) return err;
  const message = err?.message || fallbackMessage;
  let code = 'UNKNOWN';
  if (/401/.test(message)) code = 'UNAUTHORIZED';
  else if (/404/.test(message)) code = 'NOT_FOUND';
  else if (/500/.test(message)) code = 'INTERNAL';
  else if (/network|fetch/i.test(message)) code = 'NETWORK';
  else if (/validation/i.test(message)) code = 'VALIDATION';
  else if (/rate limit|429/i.test(message)) code = 'RATE_LIMIT';
  else if (/conflict|409/i.test(message)) code = 'CONFLICT';
  const meta = ERROR_CODES[code] || ERROR_CODES.UNKNOWN;
  return new ApiError(code, message, meta.hint, correlationId);
};
