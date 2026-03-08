/**
 * Utilidades para la interfaz de usuario del ERP
 */

/**
 * Retorna una clase de tamaño de fuente de Tailwind basada en la longitud del valor o string.
 * Especialmente útil para montos en Guaraníes que pueden ser muy largos.
 * 
 * @param {number|string} value - El valor numérico o string a evaluar
 * @param {object} options - Opciones de configuración
 * @returns {string} Clase de Tailwind (ej: 'text-2xl', 'text-lg')
 */
export const getDynamicFontClass = (value, options = {}) => {
  const { 
    baseClass = 'text-2xl', 
    mediumClass = 'text-xl', 
    smallClass = 'text-lg',
    extraSmallClass = 'text-base',
    threshold = 1000000 // Un millón como disparador base
  } = options;

  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const strLength = value.toString().length;

  // Si es un monto mayor a 100 millones
  if (numValue >= 100000000 || strLength > 12) {
    return extraSmallClass;
  }
  
  // Si es un monto mayor a 10 millones
  if (numValue >= 10000000 || strLength > 10) {
    return smallClass;
  }

  // Si es un monto mayor a 1 millón
  if (numValue >= threshold || strLength > 8) {
    return mediumClass;
  }

  return baseClass;
};
