/**
 * @fileoverview Códigos de error específicos para el sistema de gestión de clientes
 * Seguimiento Wave 1: Arquitectura Base Sólida
 * 
 * Códigos formato: CLIENT_ERROR_<CATEGORIA>_<DETALLE>
 * Categorías: API, VALIDATION, CACHE, CIRCUIT, OFFLINE, BUSINESS
 */

/**
 * Errores de API y comunicación
 */
export const CLIENT_API_ERRORS = {
  // Errores de conexión
  NETWORK_ERROR: 'CLIENT_ERROR_API_NETWORK',
  TIMEOUT_ERROR: 'CLIENT_ERROR_API_TIMEOUT', 
  CONNECTION_REFUSED: 'CLIENT_ERROR_API_CONNECTION_REFUSED',
  
  // Errores HTTP específicos
  UNAUTHORIZED: 'CLIENT_ERROR_API_UNAUTHORIZED',
  FORBIDDEN: 'CLIENT_ERROR_API_FORBIDDEN',
  NOT_FOUND: 'CLIENT_ERROR_API_NOT_FOUND',
  CONFLICT: 'CLIENT_ERROR_API_CONFLICT',
  RATE_LIMITED: 'CLIENT_ERROR_API_RATE_LIMITED',
  SERVER_ERROR: 'CLIENT_ERROR_API_SERVER_ERROR',
  BAD_GATEWAY: 'CLIENT_ERROR_API_BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'CLIENT_ERROR_API_SERVICE_UNAVAILABLE',
  
  // Errores de datos
  INVALID_RESPONSE: 'CLIENT_ERROR_API_INVALID_RESPONSE',
  MALFORMED_JSON: 'CLIENT_ERROR_API_MALFORMED_JSON',
  MISSING_REQUIRED_FIELDS: 'CLIENT_ERROR_API_MISSING_FIELDS'
};

/**
 * Errores de validación
 */
export const CLIENT_VALIDATION_ERRORS = {
  // Validaciones de campos requeridos
  NAME_REQUIRED: 'CLIENT_ERROR_VALIDATION_NAME_REQUIRED',
  NAME_TOO_SHORT: 'CLIENT_ERROR_VALIDATION_NAME_TOO_SHORT',
  NAME_TOO_LONG: 'CLIENT_ERROR_VALIDATION_NAME_TOO_LONG',
  NAME_INVALID_CHARS: 'CLIENT_ERROR_VALIDATION_NAME_INVALID_CHARS',
  
  // Validaciones de contacto
  CONTACT_INVALID_EMAIL: 'CLIENT_ERROR_VALIDATION_CONTACT_INVALID_EMAIL',
  CONTACT_INVALID_PHONE: 'CLIENT_ERROR_VALIDATION_CONTACT_INVALID_PHONE',
  CONTACT_INVALID_FORMAT: 'CLIENT_ERROR_VALIDATION_CONTACT_INVALID_FORMAT',
  
  // Validaciones de documento
  DOCUMENT_INVALID_FORMAT: 'CLIENT_ERROR_VALIDATION_DOCUMENT_INVALID_FORMAT',
  DOCUMENT_ALREADY_EXISTS: 'CLIENT_ERROR_VALIDATION_DOCUMENT_EXISTS',
  
  // Validaciones generales
  INVALID_ID: 'CLIENT_ERROR_VALIDATION_INVALID_ID',
  INVALID_STATUS: 'CLIENT_ERROR_VALIDATION_INVALID_STATUS',
  INVALID_DATE: 'CLIENT_ERROR_VALIDATION_INVALID_DATE'
};

/**
 * Errores de cache
 */
export const CLIENT_CACHE_ERRORS = {
  CACHE_MISS: 'CLIENT_ERROR_CACHE_MISS',
  CACHE_EXPIRED: 'CLIENT_ERROR_CACHE_EXPIRED',
  CACHE_CORRUPTED: 'CLIENT_ERROR_CACHE_CORRUPTED',
  CACHE_FULL: 'CLIENT_ERROR_CACHE_FULL',
  CACHE_WRITE_FAILED: 'CLIENT_ERROR_CACHE_WRITE_FAILED',
  CACHE_READ_FAILED: 'CLIENT_ERROR_CACHE_READ_FAILED',
  CACHE_EVICTION_FAILED: 'CLIENT_ERROR_CACHE_EVICTION_FAILED'
};

/**
 * Errores del circuit breaker
 */
export const CLIENT_CIRCUIT_ERRORS = {
  CIRCUIT_OPEN: 'CLIENT_ERROR_CIRCUIT_OPEN',
  CIRCUIT_HALF_OPEN: 'CLIENT_ERROR_CIRCUIT_HALF_OPEN',
  CIRCUIT_FAILURE_THRESHOLD: 'CLIENT_ERROR_CIRCUIT_FAILURE_THRESHOLD',
  CIRCUIT_TIMEOUT: 'CLIENT_ERROR_CIRCUIT_TIMEOUT',
  CIRCUIT_RECOVERY_FAILED: 'CLIENT_ERROR_CIRCUIT_RECOVERY_FAILED'
};

/**
 * Errores de modo offline
 */
export const CLIENT_OFFLINE_ERRORS = {
  OFFLINE_MODE_ACTIVE: 'CLIENT_ERROR_OFFLINE_MODE_ACTIVE',
  SNAPSHOT_NOT_FOUND: 'CLIENT_ERROR_OFFLINE_SNAPSHOT_NOT_FOUND',
  SNAPSHOT_CORRUPTED: 'CLIENT_ERROR_OFFLINE_SNAPSHOT_CORRUPTED',
  SYNC_FAILED: 'CLIENT_ERROR_OFFLINE_SYNC_FAILED',
  STORAGE_QUOTA_EXCEEDED: 'CLIENT_ERROR_OFFLINE_STORAGE_QUOTA',
  STORAGE_ACCESS_DENIED: 'CLIENT_ERROR_OFFLINE_STORAGE_ACCESS_DENIED'
};

/**
 * Errores de lógica de negocio
 */
export const CLIENT_BUSINESS_ERRORS = {
  CLIENT_NOT_FOUND: 'CLIENT_ERROR_BUSINESS_NOT_FOUND',
  CLIENT_ALREADY_EXISTS: 'CLIENT_ERROR_BUSINESS_ALREADY_EXISTS',
  CLIENT_HAS_ACTIVE_ORDERS: 'CLIENT_ERROR_BUSINESS_HAS_ACTIVE_ORDERS',
  CLIENT_INACTIVE: 'CLIENT_ERROR_BUSINESS_INACTIVE',
  CLIENT_DELETED: 'CLIENT_ERROR_BUSINESS_DELETED',
  OPERATION_NOT_ALLOWED: 'CLIENT_ERROR_BUSINESS_OPERATION_NOT_ALLOWED',
  INSUFFICIENT_PERMISSIONS: 'CLIENT_ERROR_BUSINESS_INSUFFICIENT_PERMISSIONS',
  DUPLICATE_OPERATION: 'CLIENT_ERROR_BUSINESS_DUPLICATE_OPERATION'
};

/**
 * Todos los códigos de error agrupados
 */
export const ALL_CLIENT_ERRORS = {
  ...CLIENT_API_ERRORS,
  ...CLIENT_VALIDATION_ERRORS,
  ...CLIENT_CACHE_ERRORS,
  ...CLIENT_CIRCUIT_ERRORS,
  ...CLIENT_OFFLINE_ERRORS,
  ...CLIENT_BUSINESS_ERRORS
};

/**
 * Mensajes de error user-friendly en español
 */
export const CLIENT_ERROR_MESSAGES = {
  // API Errors
  [CLIENT_API_ERRORS.NETWORK_ERROR]: 'Error de conexión. Verifique su conexión a internet.',
  [CLIENT_API_ERRORS.TIMEOUT_ERROR]: 'La operación tardó demasiado tiempo. Intente nuevamente.',
  [CLIENT_API_ERRORS.CONNECTION_REFUSED]: 'No se pudo conectar al servidor. Intente más tarde.',
  [CLIENT_API_ERRORS.UNAUTHORIZED]: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
  [CLIENT_API_ERRORS.FORBIDDEN]: 'No tiene permisos para realizar esta operación.',
  [CLIENT_API_ERRORS.NOT_FOUND]: 'El cliente solicitado no existe.',
  [CLIENT_API_ERRORS.CONFLICT]: 'Ya existe un cliente con estos datos.',
  [CLIENT_API_ERRORS.RATE_LIMITED]: 'Demasiadas solicitudes. Espere un momento e intente nuevamente.',
  [CLIENT_API_ERRORS.SERVER_ERROR]: 'Error interno del servidor. Contacte al administrador.',
  [CLIENT_API_ERRORS.BAD_GATEWAY]: 'Error de comunicación con el servidor.',
  [CLIENT_API_ERRORS.SERVICE_UNAVAILABLE]: 'El servicio no está disponible temporalmente.',
  [CLIENT_API_ERRORS.INVALID_RESPONSE]: 'Respuesta inválida del servidor.',
  [CLIENT_API_ERRORS.MALFORMED_JSON]: 'Error al procesar la respuesta del servidor.',
  [CLIENT_API_ERRORS.MISSING_REQUIRED_FIELDS]: 'Faltan campos requeridos en la respuesta.',

  // Validation Errors
  [CLIENT_VALIDATION_ERRORS.NAME_REQUIRED]: 'El nombre del cliente es requerido.',
  [CLIENT_VALIDATION_ERRORS.NAME_TOO_SHORT]: 'El nombre debe tener al menos 2 caracteres.',
  [CLIENT_VALIDATION_ERRORS.NAME_TOO_LONG]: 'El nombre no puede exceder 100 caracteres.',
  [CLIENT_VALIDATION_ERRORS.NAME_INVALID_CHARS]: 'El nombre contiene caracteres no válidos.',
  [CLIENT_VALIDATION_ERRORS.CONTACT_INVALID_EMAIL]: 'El email ingresado no es válido.',
  [CLIENT_VALIDATION_ERRORS.CONTACT_INVALID_PHONE]: 'El teléfono ingresado no es válido.',
  [CLIENT_VALIDATION_ERRORS.CONTACT_INVALID_FORMAT]: 'Ingrese un email o teléfono válido.',
  [CLIENT_VALIDATION_ERRORS.DOCUMENT_INVALID_FORMAT]: 'El formato del documento no es válido.',
  [CLIENT_VALIDATION_ERRORS.DOCUMENT_ALREADY_EXISTS]: 'Ya existe un cliente con este documento.',
  [CLIENT_VALIDATION_ERRORS.INVALID_ID]: 'ID de cliente inválido.',
  [CLIENT_VALIDATION_ERRORS.INVALID_STATUS]: 'Estado de cliente inválido.',
  [CLIENT_VALIDATION_ERRORS.INVALID_DATE]: 'Fecha inválida.',

  // Cache Errors
  [CLIENT_CACHE_ERRORS.CACHE_MISS]: 'Datos no encontrados en cache.',
  [CLIENT_CACHE_ERRORS.CACHE_EXPIRED]: 'Los datos en cache han expirado.',
  [CLIENT_CACHE_ERRORS.CACHE_CORRUPTED]: 'Los datos en cache están corruptos.',
  [CLIENT_CACHE_ERRORS.CACHE_FULL]: 'Cache lleno. Limpiando datos antiguos.',
  [CLIENT_CACHE_ERRORS.CACHE_WRITE_FAILED]: 'Error al guardar en cache.',
  [CLIENT_CACHE_ERRORS.CACHE_READ_FAILED]: 'Error al leer desde cache.',
  [CLIENT_CACHE_ERRORS.CACHE_EVICTION_FAILED]: 'Error al limpiar cache.',

  // Circuit Breaker Errors  
  [CLIENT_CIRCUIT_ERRORS.CIRCUIT_OPEN]: 'Servicio temporalmente no disponible. Intente en unos momentos.',
  [CLIENT_CIRCUIT_ERRORS.CIRCUIT_HALF_OPEN]: 'Servicio en recuperación. Operación limitada.',
  [CLIENT_CIRCUIT_ERRORS.CIRCUIT_FAILURE_THRESHOLD]: 'Demasiados errores detectados. Servicio pausado temporalmente.',
  [CLIENT_CIRCUIT_ERRORS.CIRCUIT_TIMEOUT]: 'Timeout del circuit breaker.',
  [CLIENT_CIRCUIT_ERRORS.CIRCUIT_RECOVERY_FAILED]: 'Falló la recuperación automática del servicio.',

  // Offline Errors
  [CLIENT_OFFLINE_ERRORS.OFFLINE_MODE_ACTIVE]: 'Modo offline activado. Algunas funciones están limitadas.',
  [CLIENT_OFFLINE_ERRORS.SNAPSHOT_NOT_FOUND]: 'No hay datos offline disponibles.',
  [CLIENT_OFFLINE_ERRORS.SNAPSHOT_CORRUPTED]: 'Los datos offline están corruptos.',
  [CLIENT_OFFLINE_ERRORS.SYNC_FAILED]: 'Error al sincronizar datos offline.',
  [CLIENT_OFFLINE_ERRORS.STORAGE_QUOTA_EXCEEDED]: 'Espacio de almacenamiento insuficiente.',
  [CLIENT_OFFLINE_ERRORS.STORAGE_ACCESS_DENIED]: 'Sin acceso al almacenamiento local.',

  // Business Errors
  [CLIENT_BUSINESS_ERRORS.CLIENT_NOT_FOUND]: 'Cliente no encontrado.',
  [CLIENT_BUSINESS_ERRORS.CLIENT_ALREADY_EXISTS]: 'El cliente ya existe en el sistema.',
  [CLIENT_BUSINESS_ERRORS.CLIENT_HAS_ACTIVE_ORDERS]: 'No se puede eliminar un cliente con pedidos activos.',
  [CLIENT_BUSINESS_ERRORS.CLIENT_INACTIVE]: 'El cliente está inactivo.',
  [CLIENT_BUSINESS_ERRORS.CLIENT_DELETED]: 'El cliente ha sido eliminado.',
  [CLIENT_BUSINESS_ERRORS.OPERATION_NOT_ALLOWED]: 'Operación no permitida.',
  [CLIENT_BUSINESS_ERRORS.INSUFFICIENT_PERMISSIONS]: 'Permisos insuficientes para esta operación.',
  [CLIENT_BUSINESS_ERRORS.DUPLICATE_OPERATION]: 'Operación duplicada detectada.'
};

/**
 * Clasificador de errores por tipo
 */
export const CLIENT_ERROR_TYPES = {
  RECOVERABLE: 'recoverable',
  NON_RECOVERABLE: 'non_recoverable',
  USER_ACTION_REQUIRED: 'user_action_required',
  SYSTEM_ERROR: 'system_error'
};

/**
 * Mapeo de errores a tipos
 */
export const CLIENT_ERROR_TYPE_MAPPING = {
  // Errores recuperables (retry automático)
  [CLIENT_API_ERRORS.TIMEOUT_ERROR]: CLIENT_ERROR_TYPES.RECOVERABLE,
  [CLIENT_API_ERRORS.NETWORK_ERROR]: CLIENT_ERROR_TYPES.RECOVERABLE,
  [CLIENT_API_ERRORS.SERVICE_UNAVAILABLE]: CLIENT_ERROR_TYPES.RECOVERABLE,
  [CLIENT_API_ERRORS.BAD_GATEWAY]: CLIENT_ERROR_TYPES.RECOVERABLE,
  [CLIENT_CACHE_ERRORS.CACHE_WRITE_FAILED]: CLIENT_ERROR_TYPES.RECOVERABLE,
  
  // Errores que requieren acción del usuario
  [CLIENT_API_ERRORS.UNAUTHORIZED]: CLIENT_ERROR_TYPES.USER_ACTION_REQUIRED,
  [CLIENT_API_ERRORS.FORBIDDEN]: CLIENT_ERROR_TYPES.USER_ACTION_REQUIRED,
  [CLIENT_VALIDATION_ERRORS.NAME_REQUIRED]: CLIENT_ERROR_TYPES.USER_ACTION_REQUIRED,
  [CLIENT_VALIDATION_ERRORS.CONTACT_INVALID_FORMAT]: CLIENT_ERROR_TYPES.USER_ACTION_REQUIRED,
  
  // Errores del sistema
  [CLIENT_API_ERRORS.SERVER_ERROR]: CLIENT_ERROR_TYPES.SYSTEM_ERROR,
  [CLIENT_CACHE_ERRORS.CACHE_CORRUPTED]: CLIENT_ERROR_TYPES.SYSTEM_ERROR,
  [CLIENT_OFFLINE_ERRORS.STORAGE_ACCESS_DENIED]: CLIENT_ERROR_TYPES.SYSTEM_ERROR,
  
  // Errores no recuperables
  [CLIENT_API_ERRORS.NOT_FOUND]: CLIENT_ERROR_TYPES.NON_RECOVERABLE,
  [CLIENT_BUSINESS_ERRORS.CLIENT_DELETED]: CLIENT_ERROR_TYPES.NON_RECOVERABLE
};

/**
 * Helper para obtener mensaje de error user-friendly
 * @param {string} errorCode - Código de error
 * @param {Object} context - Contexto adicional para el mensaje
 * @returns {string} Mensaje de error localizado
 */
export const getClientErrorMessage = (errorCode, context = {}) => {
  const baseMessage = CLIENT_ERROR_MESSAGES[errorCode] || 'Error desconocido en el sistema de clientes.';
  
  // Agregar contexto si está disponible
  if (context.clientName) {
    return baseMessage.replace('cliente', `cliente "${context.clientName}"`);
  }
  
  return baseMessage;
};

/**
 * Helper para determinar si un error es recuperable
 * @param {string} errorCode - Código de error
 * @returns {boolean} True si el error es recuperable
 */
export const isRecoverableError = (errorCode) => {
  return CLIENT_ERROR_TYPE_MAPPING[errorCode] === CLIENT_ERROR_TYPES.RECOVERABLE;
};

/**
 * Helper para determinar si un error requiere acción del usuario
 * @param {string} errorCode - Código de error  
 * @returns {boolean} True si requiere acción del usuario
 */
export const requiresUserAction = (errorCode) => {
  return CLIENT_ERROR_TYPE_MAPPING[errorCode] === CLIENT_ERROR_TYPES.USER_ACTION_REQUIRED;
};

export default {
  CLIENT_API_ERRORS,
  CLIENT_VALIDATION_ERRORS,
  CLIENT_CACHE_ERRORS,
  CLIENT_CIRCUIT_ERRORS,
  CLIENT_OFFLINE_ERRORS,
  CLIENT_BUSINESS_ERRORS,
  ALL_CLIENT_ERRORS,
  CLIENT_ERROR_MESSAGES,
  CLIENT_ERROR_TYPES,
  CLIENT_ERROR_TYPE_MAPPING,
  getClientErrorMessage,
  isRecoverableError,
  requiresUserAction
};
