import { Reservation, ScheduleConfig } from './models';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a reservation request.
 */
export const validateReservation = (reservation: Partial<Reservation>): ValidationResult => {
  const errors: string[] = [];

  if (!reservation.product_id) {
    errors.push('El ID del producto es requerido');
  }

  if (!reservation.client_id) {
    errors.push('El ID del cliente es requerido');
  }

  if (!reservation.start_time) {
    errors.push('La fecha y hora de inicio es requerida');
  }

  if (!reservation.duration || reservation.duration <= 0) {
    errors.push('La duración debe ser mayor a 0 horas');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates schedule configuration.
 */
export const validateScheduleConfig = (config: Partial<ScheduleConfig>): ValidationResult => {
  const errors: string[] = [];

  if (config.start_hour !== undefined && (config.start_hour < 0 || config.start_hour > 23)) {
    errors.push('La hora de inicio debe estar entre 0 y 23');
  }

  if (config.end_hour !== undefined && (config.end_hour < 1 || config.end_hour > 24)) {
    errors.push('La hora de fin debe estar entre 1 y 24');
  }

  if (config.start_hour !== undefined && config.end_hour !== undefined && config.start_hour >= config.end_hour) {
    errors.push('La hora de inicio debe ser menor que la hora de fin');
  }

  if (config.slot_minutes !== undefined && config.slot_minutes !== 60) {
    errors.push('Actualmente solo se admiten slots de 60 minutos');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
