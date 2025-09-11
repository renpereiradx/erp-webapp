/**
 * Utilidades para manejo correcto de zonas horarias
 * Paraguay está en UTC-3 (PYT - Paraguay Time)
 */

// Paraguay está en UTC-3 todo el año (no maneja horario de verano)
const PARAGUAY_TIMEZONE = 'America/Asuncion';

/**
 * Convierte una fecha UTC a hora local de Paraguay (UTC-3)
 * @param {string|Date} utcTime - Tiempo en UTC (ej: "2025-09-09T14:00:00Z")
 * @returns {Date} - Fecha en hora local de Paraguay
 */
export const convertUTCToParaguayTime = (utcTime) => {
  const date = new Date(utcTime);
  
  // Paraguay está en UTC-3, restar 3 horas del tiempo UTC
  return new Date(date.getTime() - (3 * 60 * 60 * 1000));
};

/**
 * Formatea una hora UTC para mostrar en hora local de Paraguay (UTC-3)
 * Implementación directa para asegurar conversión correcta
 * @param {string|Date} utcTime - Tiempo en UTC (ej: "2025-09-09T14:00:00Z")
 * @param {Object} options - Opciones de formato
 * @returns {string} - Hora formateada en hora local (ej: "11:00" para UTC 14:00)
 */
export const formatTimeInParaguayTimezone = (utcTime, options = {}) => {
  const date = new Date(utcTime);
  
  // Paraguay está en UTC-3, restar 3 horas del tiempo UTC
  const paraguayTime = new Date(date.getTime() - (3 * 60 * 60 * 1000));
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // formato 24 horas
  };

  const formatOptions = { ...defaultOptions, ...options };
  
  // Usar UTC para evitar problemas de zona horaria del navegador
  return paraguayTime.toISOString().substr(11, 5); // Extrae "HH:MM" de "YYYY-MM-DDTHH:MM:SS.SSSZ"
};

/**
 * Formatea una fecha UTC para mostrar en zona horaria de Paraguay (UTC-3)
 * @param {string|Date} utcTime - Tiempo en UTC
 * @param {Object} options - Opciones de formato
 * @returns {string} - Fecha formateada en hora local
 */
export const formatDateInParaguayTimezone = (utcTime, options = {}) => {
  const date = new Date(utcTime);
  
  // Paraguay está en UTC-3, restar 3 horas del tiempo UTC
  const paraguayTime = new Date(date.getTime() - (3 * 60 * 60 * 1000));
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const formatOptions = { ...defaultOptions, ...options };
  
  return paraguayTime.toLocaleDateString('es-ES', formatOptions);
};

/**
 * Formatea una fecha y hora UTC para mostrar completa en zona horaria de Paraguay
 * @param {string|Date} utcTime - Tiempo en UTC
 * @param {Object} options - Opciones de formato
 * @returns {string} - Fecha y hora formateada en hora local
 */
export const formatDateTimeInParaguayTimezone = (utcTime, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: PARAGUAY_TIMEZONE
  };

  const formatOptions = { ...defaultOptions, ...options };
  const date = new Date(utcTime);
  
  return date.toLocaleString('es-PY', formatOptions);
};

/**
 * Obtiene la hora actual en Paraguay
 * @returns {Date} - Fecha actual en zona horaria de Paraguay
 */
export const getCurrentParaguayTime = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: PARAGUAY_TIMEZONE }));
};

/**
 * Verifica si una fecha UTC está en el futuro según hora de Paraguay
 * @param {string|Date} utcTime - Tiempo en UTC
 * @returns {boolean} - true si está en el futuro
 */
export const isFutureInParaguayTime = (utcTime) => {
  const paraguayTime = convertUTCToParaguayTime(utcTime);
  const nowParaguay = getCurrentParaguayTime();
  
  return paraguayTime > nowParaguay;
};

/**
 * Convierte hora local de Paraguay a UTC para enviar a la API
 * @param {string} localTime - Tiempo en hora local (ej: "2025-09-09T11:00")
 * @returns {string} - Tiempo en UTC formato ISO
 */
export const convertParaguayTimeToUTC = (localTime) => {
  // Crear fecha asumiendo que es hora local de Paraguay
  const localDate = new Date(localTime);
  
  // Paraguay está en UTC-3, sumar 3 horas para convertir a UTC
  const utcDate = new Date(localDate.getTime() + (3 * 60 * 60 * 1000));
  
  return utcDate.toISOString();
};

/**
 * Calcula la duración entre dos tiempos UTC en minutos
 * @param {string|Date} startTimeUTC - Hora de inicio en UTC
 * @param {string|Date} endTimeUTC - Hora de fin en UTC
 * @returns {number} - Duración en minutos
 */
export const calculateDurationInMinutes = (startTimeUTC, endTimeUTC) => {
  const start = new Date(startTimeUTC);
  const end = new Date(endTimeUTC);
  
  return Math.round((end - start) / (1000 * 60));
};

/**
 * Información de debugging para verificar conversiones
 * @param {string|Date} utcTime - Tiempo en UTC
 * @returns {Object} - Objeto con información de debugging
 */
export const debugTimeConversion = (utcTime) => {
  const originalDate = new Date(utcTime);
  const paraguayTime = convertUTCToParaguayTime(utcTime);
  
  return {
    original_utc: utcTime,
    original_utc_hour: originalDate.getUTCHours() + ':' + originalDate.getUTCMinutes().toString().padStart(2, '0'),
    paraguay_time_calculated: paraguayTime.toISOString(),
    paraguay_hour_calculated: paraguayTime.getUTCHours() + ':' + paraguayTime.getUTCMinutes().toString().padStart(2, '0'),
    formatted_time: formatTimeInParaguayTimezone(utcTime),
    expected_conversion: `UTC ${originalDate.getUTCHours()}:00 -> Paraguay ${originalDate.getUTCHours() - 3}:00`,
    browser_timezone_offset: originalDate.getTimezoneOffset() / 60
  };
};