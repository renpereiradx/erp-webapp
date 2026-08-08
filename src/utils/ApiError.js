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

// Map HTTP status → ApiError code. Used as a deterministic fallback when the
// response body doesn't carry an explicit code. The backend's sale/cash-register
// handlers serialize errors as {success:false, error_code:"CONFLICT", message}
// (snake_case, flat) — toApiError reads error_code first, then falls back here.
const STATUS_TO_CODE = {
  400: 'VALIDATION',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'VALIDATION',
  409: 'CONFLICT',
  429: 'RATE_LIMIT',
  500: 'INTERNAL',
  502: 'NETWORK',
  503: 'NETWORK',
  504: 'NETWORK',
};

export const toApiError = (err, fallbackMessage = 'Error desconocido', correlationId, httpStatus) => {
  if (err instanceof ApiError) return err;

  // Extraer información del backend si existe la estructura err.error
  const backendError = err?.error || {};
  // Soportar formatos comunes: {error:{message}}, {message}, {detail} (FastAPI),
  // {errors:[...]}, y el shape plano del backend de sale/cash-register:
  // {success:false, error_code:"CONFLICT", message:"..."}.
  const detailMessage = Array.isArray(err?.detail)
    ? err.detail.map(d => d?.msg || d?.message || JSON.stringify(d)).join('; ')
    : err?.detail;
  const message =
    (typeof err?.error === 'string' ? err.error : backendError.message) ||
    err?.message ||
    detailMessage ||
    fallbackMessage;
  // Code sources, in priority order: nested err.error.code (legacy/estándar),
  // err.error_code (backend sale/cash-register, snake_case plano), err.code.
  let code = backendError.code || err?.error_code || err?.code || 'UNKNOWN';

  // Si el código sigue siendo UNKNOWN, inferirlo del status HTTP si lo tenemos
  // (determinístico, no depende del texto del mensaje).
  if (code === 'UNKNOWN' && httpStatus && STATUS_TO_CODE[httpStatus]) {
    code = STATUS_TO_CODE[httpStatus];
  }

  // Última resort: inferir del mensaje (legacy / errores de red sin status).
  if (code === 'UNKNOWN') {
    if (/401/.test(message)) code = 'UNAUTHORIZED';
    else if (/403/.test(message)) code = 'FORBIDDEN';
    else if (/404/.test(message)) code = 'NOT_FOUND';
    else if (/500/.test(message)) code = 'INTERNAL';
    else if (/network|fetch/i.test(message)) code = 'NETWORK';
    else if (/validation/i.test(message)) code = 'VALIDATION';
    else if (/rate limit|429/i.test(message)) code = 'RATE_LIMIT';
    else if (/conflict|409/i.test(message)) code = 'CONFLICT';
  }

  const meta = ERROR_CODES[code] || ERROR_CODES.UNKNOWN;
  return new ApiError(code, message, meta.hint || backendError.hint, correlationId);
};
