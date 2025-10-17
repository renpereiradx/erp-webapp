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
 * Formatea una hora para mostrar en hora local de Paraguay (UTC-3)
 * Usa la zona horaria nativa del navegador para conversión correcta
 * @param {string|Date} timeString - Tiempo (puede ser UTC o local)
 * @param {Object} options - Opciones de formato
 * @returns {string} - Hora formateada en hora local (ej: "16:00")
 */
export const formatTimeInParaguayTimezone = (timeString, options = {}) => {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  
  // Verificar que la fecha es válida
  if (isNaN(date.getTime())) {
    console.warn('Invalid date passed to formatTimeInParaguayTimezone:', timeString);
    return '';
  }
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // formato 24 horas
    timeZone: PARAGUAY_TIMEZONE
  };

  const formatOptions = { ...defaultOptions, ...options };
  
  // Usar toLocaleTimeString para manejar la zona horaria correctamente
  return date.toLocaleTimeString('es-PY', formatOptions);
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

/**
 * Formatea el campo reserve_date para mostrar información de auditoría
 * Según la documentación API, reserve_date es auto-generado con CURRENT_TIMESTAMP
 * @param {string} reserveDate - Fecha de creación ISO 8601 (ej: "2025-09-13T15:43:21.528508Z")
 * @returns {Object} - Objeto con formatos útiles para UI
 */
export const formatReserveDate = (reserveDate) => {
  if (!reserveDate) return null;

  // Backend devuelve: "2025-10-15 13:23:41.063374" o "2025-10-15T13:23:41.063374Z"
  // Este timestamp YA está en hora local de Paraguay, NO necesita conversión

  // Extraer partes del string directamente sin usar new Date()
  const dateTimeParts = reserveDate.split(/[T ]/); // Separar por T o espacio
  const datePart = dateTimeParts[0]; // "2025-10-15"
  const timePart = dateTimeParts[1] ? dateTimeParts[1].split('.')[0] : '00:00:00'; // "13:23:41"

  // Parsear fecha: "2025-10-15" -> [2025, 10, 15]
  const [year, month, day] = datePart.split('-');

  // Parsear hora: "13:23:41" -> [13, 23, 41]
  const [hour, minute, second] = timePart.split(':');

  // Formatear fecha dd/mm/yyyy
  const shortDate = `${day}/${month}/${year}`;

  // Formatear fecha completa en español
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fullDate = `${parseInt(day)} de ${monthNames[parseInt(month) - 1]} de ${year}`;

  // Formatear hora HH:MM
  const shortTime = `${hour}:${minute}`;

  // Formatear hora con segundos HH:MM:SS
  const fullTime = `${hour}:${minute}:${second}`;

  // Calcular tiempo relativo
  // Para esto SÍ necesitamos Date, pero parseando manualmente para evitar conversión de timezone
  const reserveDateTime = new Date(
    parseInt(year),
    parseInt(month) - 1, // Los meses en JS son 0-indexed
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second || 0)
  );

  const now = new Date();
  const diffMs = now - reserveDateTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return {
    // Formatos de fecha
    fullDate,           // "15 de octubre de 2025"
    shortDate,          // "15/10/2025"

    // Formatos de hora
    fullTime,           // "13:23:41"
    shortTime,          // "13:23"

    // Formato para mostrar "hace X tiempo"
    relativeTime: getRelativeTimeText(diffDays, diffHours, diffMinutes),

    // Datos numéricos útiles
    daysAgo: diffDays,
    hoursAgo: diffHours,
    minutesAgo: diffMinutes,

    // Fecha raw para comparaciones
    dateObject: reserveDateTime
  };
};

/**
 * Genera texto legible para mostrar "hace X tiempo"
 * @param {number} days - Días transcurridos
 * @param {number} hours - Horas transcurridas
 * @param {number} minutes - Minutos transcurridos
 * @returns {string} - Texto formateado
 */
const getRelativeTimeText = (days, hours, minutes) => {
  if (days > 0) {
    return days === 1 ? 'hace 1 día' : `hace ${days} días`;
  } else if (hours > 0) {
    return hours === 1 ? 'hace 1 hora' : `hace ${hours} horas`;
  } else if (minutes > 0) {
    return minutes === 1 ? 'hace 1 minuto' : `hace ${minutes} minutos`;
  } else {
    return 'recién creada';
  }
};

/**
 * Convierte datos de reserva para incluir información de auditoría formateada
 * Implementa el patrón recomendado en RESERVES_API.md líneas 586-601
 * @param {Object} reserve - Datos de reserva con reserve_date
 * @returns {Object} - Reserva con campos de auditoría agregados
 */
export const formatReserveForDisplay = (reserve) => {
  if (!reserve || !reserve.reserve_date) return reserve;

  const formattedDate = formatReserveDate(reserve.reserve_date);

  return {
    ...reserve,
    // Mapear reserve_date a created_at como recomienda la documentación
    created_at: reserve.reserve_date,

    // Formatos listos para mostrar en UI
    created_date_display: formattedDate.shortDate,
    created_time_display: formattedDate.shortTime,
    created_full_display: `${formattedDate.shortDate} ${formattedDate.shortTime}`,
    created_relative_display: formattedDate.relativeTime,

    // Para ordenamiento y filtros
    days_since_creation: formattedDate.daysAgo,
    hours_since_creation: formattedDate.hoursAgo,

    // Datos completos de formato
    _reserveDateFormat: formattedDate
  };
};
