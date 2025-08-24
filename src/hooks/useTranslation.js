/**
 * useTranslation Hook
 * Hook para gestión de traducciones en el sistema
 */

import { useCallback } from 'react';

/**
 * Hook de traducciones (mock implementation)
 * @returns {Object} - Funciones de traducción
 */
export function useTranslation() {
  /**
   * Función de traducción
   * @param {string} key - Clave de traducción
   * @param {string} defaultValue - Valor por defecto
   * @returns {string} - Texto traducido
   */
  const t = useCallback((key, defaultValue = '') => {
    // En un entorno real, aquí se buscaría la traducción
    // Por ahora devolvemos el valor por defecto o una traducción simple
    
    const translations = {
      'sales.dashboard.title': 'Dashboard de Ventas',
      'sales.dashboard.description': 'Panel principal para gestión de ventas',
      'sales.wizard.customer': 'Cliente',
      'sales.wizard.products': 'Productos',
      'sales.wizard.payment': 'Pago',
      'sales.wizard.confirmation': 'Confirmación',
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior'
    };

    return translations[key] || defaultValue || key;
  }, []);

  /**
   * Función para obtener traducciones con interpolación
   * @param {string} key - Clave de traducción
   * @param {Object} options - Opciones de interpolación
   * @returns {string} - Texto traducido con interpolación
   */
  const tWithOptions = useCallback((key, options = {}) => {
    const text = t(key, options.defaultValue);
    
    // Interpolación básica
    if (options.values) {
      return Object.keys(options.values).reduce((acc, valueKey) => {
        return acc.replace(`{{${valueKey}}}`, options.values[valueKey]);
      }, text);
    }
    
    return text;
  }, [t]);

  return {
    t,
    tWithOptions
  };
}

export default useTranslation;
