/**
 * Tipos TypeScript/JSDoc para la API de Reservas - Wave 8
 * Basado en la documentación RESERVE_API.md
 */

/**
 * @typedef {Object} Reserve
 * @property {number} id - ID numérico de la reserva (integer en DB)
 * @property {string} product_id - ID del producto reservado
 * @property {string} client_id - ID del cliente que reserva
 * @property {string} start_time - Hora inicio (ISO 8601: "2024-01-15T14:00:00Z")
 * @property {string} end_time - Hora fin (ISO 8601: "2024-01-15T15:00:00Z")
 * @property {number} duration - Duración en horas
 * @property {number} total_amount - Monto total de la reserva
 * @property {string} status - Estado: "RESERVED", "confirmed", "cancelled"
 * @property {string} user_id - ID del usuario que creó la reserva
 */

/**
 * @typedef {Object} ReserveRiched
 * @property {number} id
 * @property {string} product_id
 * @property {string} product_name - Nombre del producto (JOIN con products)
 * @property {string} product_description - Descripción del producto
 * @property {string} client_id
 * @property {string} client_name - Nombre del cliente (JOIN con clients)
 * @property {string} start_time
 * @property {string} end_time
 * @property {number} duration
 * @property {number} total_amount
 * @property {string} status
 * @property {string} user_id
 * @property {string} user_name - Nombre del usuario (JOIN con users)
 */

/**
 * @typedef {Object} ReservationReport
 * @property {number} reserve_id - ID de la reserva
 * @property {string} product_name - Nombre del producto
 * @property {string} client_name - Nombre del cliente
 * @property {string} start_time - Hora inicio
 * @property {string} end_time - Hora fin
 * @property {number} duration_hours - Duración en horas
 * @property {number} total_amount - Monto total
 * @property {string} status - Estado de la reserva
 * @property {string} created_by - Usuario que creó la reserva
 * @property {number} days_until_reservation - Días hasta la reserva
 */

/**
 * @typedef {Object} AvailableSchedule
 * @property {string} start_time - Hora inicio disponible
 * @property {string} end_time - Hora fin disponible
 * @property {number} available_consecutive_hours - Horas consecutivas disponibles
 */

/**
 * @typedef {Object} ConsistencyIssue
 * @property {string} issue_type - Tipo de problema de consistencia
 * @property {number} [reserve_id] - ID de reserva afectada (opcional)
 * @property {number} sales_count - Número de ventas relacionadas
 * @property {string} details - Descripción del problema
 */

/**
 * @typedef {Object} ReserveRequest
 * @property {string} action - Acción: "create", "update", "cancel"
 * @property {number} [reserve_id] - ID de reserva (para update/cancel)
 * @property {string} product_id - ID del producto
 * @property {string} client_id - ID del cliente
 * @property {string} start_time - Hora inicio ISO 8601
 * @property {number} duration - Duración en horas
 */

/**
 * @typedef {Object} ReservationParams
 * @property {number} [page] - Número de página
 * @property {number} [limit] - Límite de resultados por página
 * @property {string} [search] - Texto de búsqueda
 * @property {string} [status] - Filtro por estado
 * @property {string} [client_id] - Filtro por cliente
 * @property {string} [product_id] - Filtro por producto
 * @property {string} [start_date] - Fecha inicio para filtro
 * @property {string} [end_date] - Fecha fin para filtro
 */

/**
 * Estados válidos para reservas
 */
export const RESERVATION_STATUSES = {
  RESERVED: 'RESERVED',
  CONFIRMED: 'confirmed', 
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

/**
 * Acciones válidas para gestión de reservas
 */
export const RESERVATION_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update', 
  CANCEL: 'cancel'
};

/**
 * Tipos de problemas de consistencia
 */
export const CONSISTENCY_ISSUE_TYPES = {
  MISSING_SALE: 'MISSING_SALE',
  DUPLICATE_RESERVATION: 'DUPLICATE_RESERVATION',
  INVALID_STATUS: 'INVALID_STATUS',
  TIME_CONFLICT: 'TIME_CONFLICT'
};

export default {};
