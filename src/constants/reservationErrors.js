/**
 * Códigos de error estandarizados para el sistema de reservas
 * Siguiendo convenciones establecidas en Suppliers/Products
 */

/**
 * @typedef {Object} ReservationErrorCodes
 */
export const RESERVATION_ERROR_CODES = {
  // Errores de red y conectividad
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  OFFLINE: 'OFFLINE',
  
  // Errores de validación
  VALIDATION: 'VALIDATION',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_TIME: 'INVALID_TIME',
  INVALID_DURATION: 'INVALID_DURATION',
  
  // Errores de disponibilidad
  SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT',
  SCHEDULE_NOT_AVAILABLE: 'SCHEDULE_NOT_AVAILABLE',
  PRODUCT_NOT_AVAILABLE: 'PRODUCT_NOT_AVAILABLE',
  
  // Errores de autorización
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  JWT_EXPIRED: 'JWT_EXPIRED',
  JWT_INVALID: 'JWT_INVALID',
  
  // Errores de recursos
  NOT_FOUND: 'NOT_FOUND',
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
  
  // Errores de estado
  RESERVATION_CANCELLED: 'RESERVATION_CANCELLED',
  RESERVATION_COMPLETED: 'RESERVATION_COMPLETED',
  INVALID_STATUS: 'INVALID_STATUS',
  STATUS_TRANSITION_INVALID: 'STATUS_TRANSITION_INVALID',
  
  // Errores del servidor
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  
  // Errores de circuit breaker
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Errores de concurrencia
  OPTIMISTIC_LOCK: 'OPTIMISTIC_LOCK',
  RESOURCE_BUSY: 'RESOURCE_BUSY',
  
  // Errores generales
  UNKNOWN: 'UNKNOWN',
  CANCELLED: 'CANCELLED'
};

/**
 * Mapeo de códigos de error a claves de traducción para hints contextuales
 */
export const RESERVATION_ERROR_HINTS = {
  [RESERVATION_ERROR_CODES.NETWORK]: 'errors.hint.network',
  [RESERVATION_ERROR_CODES.TIMEOUT]: 'errors.hint.timeout',
  [RESERVATION_ERROR_CODES.OFFLINE]: 'errors.hint.offline',
  
  [RESERVATION_ERROR_CODES.VALIDATION]: 'errors.hint.validation',
  [RESERVATION_ERROR_CODES.REQUIRED_FIELD]: 'errors.hint.required_field',
  [RESERVATION_ERROR_CODES.INVALID_FORMAT]: 'errors.hint.invalid_format',
  [RESERVATION_ERROR_CODES.INVALID_DATE]: 'errors.hint.invalid_date',
  [RESERVATION_ERROR_CODES.INVALID_TIME]: 'errors.hint.invalid_time',
  [RESERVATION_ERROR_CODES.INVALID_DURATION]: 'errors.hint.invalid_duration',
  
  [RESERVATION_ERROR_CODES.SCHEDULE_CONFLICT]: 'errors.hint.schedule_conflict',
  [RESERVATION_ERROR_CODES.SCHEDULE_NOT_AVAILABLE]: 'errors.hint.schedule_not_available',
  [RESERVATION_ERROR_CODES.PRODUCT_NOT_AVAILABLE]: 'errors.hint.product_not_available',
  
  [RESERVATION_ERROR_CODES.UNAUTHORIZED]: 'errors.hint.unauthorized',
  [RESERVATION_ERROR_CODES.FORBIDDEN]: 'errors.hint.forbidden',
  [RESERVATION_ERROR_CODES.JWT_EXPIRED]: 'errors.hint.jwt_expired',
  [RESERVATION_ERROR_CODES.JWT_INVALID]: 'errors.hint.jwt_invalid',
  
  [RESERVATION_ERROR_CODES.NOT_FOUND]: 'errors.hint.not_found',
  [RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND]: 'errors.hint.reservation_not_found',
  [RESERVATION_ERROR_CODES.PRODUCT_NOT_FOUND]: 'errors.hint.product_not_found',
  [RESERVATION_ERROR_CODES.CLIENT_NOT_FOUND]: 'errors.hint.client_not_found',
  
  [RESERVATION_ERROR_CODES.RESERVATION_CANCELLED]: 'errors.hint.reservation_cancelled',
  [RESERVATION_ERROR_CODES.RESERVATION_COMPLETED]: 'errors.hint.reservation_completed',
  [RESERVATION_ERROR_CODES.INVALID_STATUS]: 'errors.hint.invalid_status',
  [RESERVATION_ERROR_CODES.STATUS_TRANSITION_INVALID]: 'errors.hint.status_transition_invalid',
  
  [RESERVATION_ERROR_CODES.SERVER_ERROR]: 'errors.hint.server_error',
  [RESERVATION_ERROR_CODES.DATABASE_ERROR]: 'errors.hint.database_error',
  [RESERVATION_ERROR_CODES.INTEGRATION_ERROR]: 'errors.hint.integration_error',
  
  [RESERVATION_ERROR_CODES.CIRCUIT_OPEN]: 'errors.hint.circuit_open',
  [RESERVATION_ERROR_CODES.SERVICE_UNAVAILABLE]: 'errors.hint.service_unavailable',
  
  [RESERVATION_ERROR_CODES.OPTIMISTIC_LOCK]: 'errors.hint.optimistic_lock',
  [RESERVATION_ERROR_CODES.RESOURCE_BUSY]: 'errors.hint.resource_busy',
  
  [RESERVATION_ERROR_CODES.UNKNOWN]: 'errors.hint.unknown',
  [RESERVATION_ERROR_CODES.CANCELLED]: 'errors.hint.cancelled'
};

/**
 * Función para clasificar errores de reservas según el mensaje
 * @param {string} errorMessage - Mensaje de error
 * @returns {string} Código de error clasificado
 */
export function classifyReservationError(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return RESERVATION_ERROR_CODES.UNKNOWN;
  }
  
  const msg = errorMessage.toLowerCase();
  
  // Errores de red
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
    return RESERVATION_ERROR_CODES.NETWORK;
  }
  
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return RESERVATION_ERROR_CODES.TIMEOUT;
  }
  
  if (msg.includes('offline') || msg.includes('no internet')) {
    return RESERVATION_ERROR_CODES.OFFLINE;
  }
  
  // Errores de autorización
  if (msg.includes('unauthorized') || msg.includes('401')) {
    return RESERVATION_ERROR_CODES.UNAUTHORIZED;
  }
  
  if (msg.includes('forbidden') || msg.includes('403')) {
    return RESERVATION_ERROR_CODES.FORBIDDEN;
  }
  
  if (msg.includes('jwt') && (msg.includes('expired') || msg.includes('invalid'))) {
    return msg.includes('expired') ? RESERVATION_ERROR_CODES.JWT_EXPIRED : RESERVATION_ERROR_CODES.JWT_INVALID;
  }
  
  // Errores de recursos
  if (msg.includes('not found') || msg.includes('404')) {
    if (msg.includes('reservation')) return RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND;
    if (msg.includes('product')) return RESERVATION_ERROR_CODES.PRODUCT_NOT_FOUND;
    if (msg.includes('client')) return RESERVATION_ERROR_CODES.CLIENT_NOT_FOUND;
    return RESERVATION_ERROR_CODES.NOT_FOUND;
  }
  
  // Errores de disponibilidad
  if (msg.includes('conflict') || msg.includes('already reserved')) {
    return RESERVATION_ERROR_CODES.SCHEDULE_CONFLICT;
  }
  
  if (msg.includes('not available') || msg.includes('unavailable')) {
    if (msg.includes('schedule') || msg.includes('time')) {
      return RESERVATION_ERROR_CODES.SCHEDULE_NOT_AVAILABLE;
    }
    if (msg.includes('product')) {
      return RESERVATION_ERROR_CODES.PRODUCT_NOT_AVAILABLE;
    }
    return RESERVATION_ERROR_CODES.SERVICE_UNAVAILABLE;
  }
  
  // Errores de validación
  if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required')) {
    if (msg.includes('date')) return RESERVATION_ERROR_CODES.INVALID_DATE;
    if (msg.includes('time')) return RESERVATION_ERROR_CODES.INVALID_TIME;
    if (msg.includes('duration')) return RESERVATION_ERROR_CODES.INVALID_DURATION;
    if (msg.includes('required')) return RESERVATION_ERROR_CODES.REQUIRED_FIELD;
    if (msg.includes('format')) return RESERVATION_ERROR_CODES.INVALID_FORMAT;
    return RESERVATION_ERROR_CODES.VALIDATION;
  }
  
  // Errores de estado
  if (msg.includes('cancelled')) {
    return RESERVATION_ERROR_CODES.RESERVATION_CANCELLED;
  }
  
  if (msg.includes('completed')) {
    return RESERVATION_ERROR_CODES.RESERVATION_COMPLETED;
  }
  
  if (msg.includes('status') && msg.includes('invalid')) {
    return RESERVATION_ERROR_CODES.STATUS_TRANSITION_INVALID;
  }
  
  // Errores del servidor
  if (msg.includes('server error') || msg.includes('500')) {
    return RESERVATION_ERROR_CODES.SERVER_ERROR;
  }
  
  if (msg.includes('database') || msg.includes('db')) {
    return RESERVATION_ERROR_CODES.DATABASE_ERROR;
  }
  
  // Errores de circuit breaker
  if (msg.includes('circuit') && msg.includes('open')) {
    return RESERVATION_ERROR_CODES.CIRCUIT_OPEN;
  }
  
  // Errores de concurrencia
  if (msg.includes('optimistic') || msg.includes('version')) {
    return RESERVATION_ERROR_CODES.OPTIMISTIC_LOCK;
  }
  
  if (msg.includes('busy') || msg.includes('locked')) {
    return RESERVATION_ERROR_CODES.RESOURCE_BUSY;
  }
  
  // Default
  return RESERVATION_ERROR_CODES.UNKNOWN;
}
