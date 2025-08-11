export class ApiError extends Error {
  constructor(code, message, hint) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.hint = hint;
  }
}

export const toApiError = (err, fallbackMessage = 'Error desconocido') => {
  if (err instanceof ApiError) return err;
  const message = err?.message || fallbackMessage;
  let code = 'UNKNOWN';
  if (/401/.test(message)) code = 'UNAUTHORIZED';
  else if (/404/.test(message)) code = 'NOT_FOUND';
  else if (/500/.test(message)) code = 'INTERNAL';
  else if (/network|fetch/i.test(message)) code = 'NETWORK';
  return new ApiError(code, message);
};
