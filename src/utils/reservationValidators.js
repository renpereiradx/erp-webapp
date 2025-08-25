/**
 * Validadores para la API de Reservas - Wave 8
 * Implementa todas las validaciones especificadas en RESERVE_API.md
 */

import { RESERVATION_ACTIONS, RESERVATION_STATUSES } from '../types/reservationTypes';

/**
 * Validar formato de fecha ISO 8601
 * @param {string} dateString - Fecha a validar
 * @returns {boolean}
 */
export function isValidISODate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!isoRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validar formato de fecha YYYY-MM-DD
 * @param {string} dateString - Fecha a validar
 * @returns {boolean}
 */
export function isValidDateFormat(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString + 'T00:00:00Z');
  return !isNaN(date.getTime());
}

/**
 * Validar ID de entidad (no vacío)
 * @param {string} id - ID a validar
 * @returns {boolean}
 */
export function isValidEntityId(id) {
  return typeof id === 'string' && id.trim().length > 0;
}

/**
 * Validar duración en horas
 * @param {number} duration - Duración a validar
 * @returns {boolean}
 */
export function isValidDuration(duration) {
  return typeof duration === 'number' && duration > 0 && Number.isFinite(duration);
}

/**
 * Validar estado de reserva
 * @param {string} status - Estado a validar
 * @returns {boolean}
 */
export function isValidReservationStatus(status) {
  return Object.values(RESERVATION_STATUSES).includes(status);
}

/**
 * Validar acción de reserva
 * @param {string} action - Acción a validar
 * @returns {boolean}
 */
export function isValidReservationAction(action) {
  return Object.values(RESERVATION_ACTIONS).includes(action);
}

/**
 * Validar datos de ReserveRequest
 * @param {Object} data - Datos del request a validar
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateReserveRequest(data) {
  const errors = [];

  // Validar acción (requerida)
  if (!data.action) {
    errors.push('action is required');
  } else if (!isValidReservationAction(data.action)) {
    errors.push('action must be one of: create, update, cancel');
  }

  // Validar reserve_id para update/cancel
  if (data.action === RESERVATION_ACTIONS.UPDATE || data.action === RESERVATION_ACTIONS.CANCEL) {
    if (!data.reserve_id) {
      errors.push('reserve_id is required for update/cancel actions');
    } else if (typeof data.reserve_id !== 'number' || data.reserve_id <= 0) {
      errors.push('reserve_id must be a positive number');
    }
  }

  // Validar product_id (requerido para create)
  if (data.action === RESERVATION_ACTIONS.CREATE) {
    if (!data.product_id) {
      errors.push('product_id is required');
    } else if (!isValidEntityId(data.product_id)) {
      errors.push('product_id cannot be empty');
    }
  }

  // Validar client_id (requerido para create)
  if (data.action === RESERVATION_ACTIONS.CREATE) {
    if (!data.client_id) {
      errors.push('client_id is required');
    } else if (!isValidEntityId(data.client_id)) {
      errors.push('client_id cannot be empty');
    }
  }

  // Validar start_time (requerido para create)
  if (data.action === RESERVATION_ACTIONS.CREATE) {
    if (!data.start_time) {
      errors.push('start_time is required');
    } else if (!isValidISODate(data.start_time)) {
      errors.push('start_time must be in ISO 8601 format');
    }
  }

  // Validar duration (requerido para create)
  if (data.action === RESERVATION_ACTIONS.CREATE) {
    if (data.duration === undefined || data.duration === null) {
      errors.push('duration is required');
    } else if (!isValidDuration(data.duration)) {
      errors.push('duration must be a positive number');
    }
  }

  // Validar start_time si está presente (update)
  if (data.start_time && !isValidISODate(data.start_time)) {
    errors.push('start_time must be in ISO 8601 format');
  }

  // Validar duration si está presente (update)
  if (data.duration !== undefined && !isValidDuration(data.duration)) {
    errors.push('duration must be a positive number');
  }

  // Validar status si está presente
  if (data.status && !isValidReservationStatus(data.status)) {
    errors.push('status must be one of: RESERVED, confirmed, cancelled');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar parámetros para obtener horarios disponibles
 * @param {Object} params - Parámetros a validar
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateAvailableSchedulesParams(params) {
  const errors = [];

  // product_id requerido
  if (!params.product_id) {
    errors.push('product_id is required');
  } else if (!isValidEntityId(params.product_id)) {
    errors.push('product_id cannot be empty');
  }

  // date requerido
  if (!params.date) {
    errors.push('date is required');
  } else if (!isValidDateFormat(params.date)) {
    errors.push('date must be in YYYY-MM-DD format');
  }

  // duration_hours opcional pero debe ser válido si se provee
  if (params.duration_hours !== undefined) {
    if (!isValidDuration(params.duration_hours)) {
      errors.push('duration_hours must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar parámetros de reporte
 * @param {Object} params - Parámetros a validar
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateReportParams(params) {
  const errors = [];

  // Validar start_date si está presente
  if (params.start_date && !isValidDateFormat(params.start_date)) {
    errors.push('start_date must be in YYYY-MM-DD format');
  }

  // Validar end_date si está presente
  if (params.end_date && !isValidDateFormat(params.end_date)) {
    errors.push('end_date must be in YYYY-MM-DD format');
  }

  // Validar product_id si está presente
  if (params.product_id && !isValidEntityId(params.product_id)) {
    errors.push('product_id cannot be empty');
  }

  // Validar client_id si está presente
  if (params.client_id && !isValidEntityId(params.client_id)) {
    errors.push('client_id cannot be empty');
  }

  // Validar status si está presente
  if (params.status && !isValidReservationStatus(params.status)) {
    errors.push('status must be one of: RESERVED, confirmed, cancelled');
  }

  // Validar rango de fechas lógico
  if (params.start_date && params.end_date) {
    const startDate = new Date(params.start_date);
    const endDate = new Date(params.end_date);
    if (startDate > endDate) {
      errors.push('start_date cannot be after end_date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar ID numérico de reserva
 * @param {any} id - ID a validar
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateReservationId(id) {
  const errors = [];

  if (id === undefined || id === null) {
    errors.push('Reservation ID is required');
  } else if (typeof id !== 'number' || id <= 0 || !Number.isInteger(id)) {
    errors.push('Reservation ID must be a positive integer');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar respuesta de la API
 * @param {any} response - Respuesta a validar
 * @param {string} expectedType - Tipo esperado (reserve, reserveRiched, report, etc.)
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateApiResponse(response, expectedType) {
  const errors = [];

  if (!response) {
    errors.push('Response is null or undefined');
    return { isValid: false, errors };
  }

  switch (expectedType) {
    case 'reserve':
      if (!response.id || typeof response.id !== 'number') {
        errors.push('Response must include numeric id');
      }
      if (!response.product_id || !isValidEntityId(response.product_id)) {
        errors.push('Response must include valid product_id');
      }
      if (!response.client_id || !isValidEntityId(response.client_id)) {
        errors.push('Response must include valid client_id');
      }
      if (!response.start_time || !isValidISODate(response.start_time)) {
        errors.push('Response must include valid start_time');
      }
      if (!response.status || !isValidReservationStatus(response.status)) {
        errors.push('Response must include valid status');
      }
      break;

    case 'reserveArray':
      if (!Array.isArray(response)) {
        errors.push('Response must be an array');
      } else {
        response.forEach((item, index) => {
          const itemValidation = validateApiResponse(item, 'reserve');
          if (!itemValidation.isValid) {
            errors.push(`Item ${index}: ${itemValidation.errors.join(', ')}`);
          }
        });
      }
      break;

    case 'availableSchedules':
      if (!Array.isArray(response)) {
        errors.push('Response must be an array');
      } else {
        response.forEach((schedule, index) => {
          if (!schedule.start_time || !isValidISODate(schedule.start_time)) {
            errors.push(`Schedule ${index}: invalid start_time`);
          }
          if (!schedule.end_time || !isValidISODate(schedule.end_time)) {
            errors.push(`Schedule ${index}: invalid end_time`);
          }
          if (typeof schedule.available_consecutive_hours !== 'number' || schedule.available_consecutive_hours <= 0) {
            errors.push(`Schedule ${index}: invalid available_consecutive_hours`);
          }
        });
      }
      break;

    default:
      // Validación genérica
      if (typeof response !== 'object') {
        errors.push('Response must be an object or array');
      }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  isValidISODate,
  isValidDateFormat,
  isValidEntityId,
  isValidDuration,
  isValidReservationStatus,
  isValidReservationAction,
  validateReserveRequest,
  validateAvailableSchedulesParams,
  validateReportParams,
  validateReservationId,
  validateApiResponse
};
