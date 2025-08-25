/**
 * @fileoverview Hook useDebounce - Optimización de búsquedas Wave 3A
 * Wave 3A: React Performance Optimizations
 * 
 * Features:
 * - Debounce configurable (default 300ms para search)
 * - Cleanup automático de timers
 * - Hook avanzado con estado isDebouncing
 * - Debounced callbacks para handlers
 * - Optimización de re-renders en search
 * - TypeScript friendly
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook básico para debounce de valores - optimiza búsquedas y previene exceso de llamadas API
 * @param {any} value - Valor a debounce
 * @param {number} delay - Delay en milisegundos (default: 300 para search)
 * @returns {any} Valor debounced
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     searchClients(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Limpiar timeout previo si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedValue;
}

/**
 * Hook avanzado para debounce con control de estado de loading
 * Útil para mostrar indicadores de "Buscando..." mientras se está debouncing
 * @param {any} value - Valor a debounce
 * @param {number} delay - Delay en milisegundos
 * @returns {{debouncedValue: any, isDebouncing: boolean}} Valor debounced y estado
 */
export function useAdvancedDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Si el valor cambió, empezar debouncing
    if (value !== debouncedValue) {
      setIsDebouncing(true);
    }

    // Limpiar timeout previo
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, debouncedValue]);

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedValue, isDebouncing };
}

/**
 * Hook para debounce de funciones - útil para handlers de eventos
 * @param {Function} callback - Función a debounce
 * @param {number} delay - Delay en milisegundos
 * @returns {Function} Función debounced
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Mantener referencia actualizada del callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useRef((...args) => {
    // Limpiar timeout previo
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }).current;

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook optimizado específicamente para búsquedas de clientes
 * Incluye configuraciones específicas y telemetría
 * @param {string} searchTerm - Término de búsqueda
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado de búsqueda optimizado
 */
export function useClientSearch(searchTerm = '', options = {}) {
  const {
    delay = 300,
    minLength = 2,
    enableTelemetry = false,
    onSearchStart,
    onSearchComplete
  } = options;

  const [searchState, setSearchState] = useState({
    isSearching: false,
    hasSearched: false,
    searchCount: 0
  });

  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  const telemetryRef = useRef({ searchStartTime: null });

  // Effect para manejar cambios en el término de búsqueda
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setSearchState(prev => ({
        ...prev,
        isSearching: true
      }));

      // Telemetría de inicio
      if (enableTelemetry) {
        telemetryRef.current.searchStartTime = Date.now();
        onSearchStart?.(searchTerm);
      }
    } else {
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        hasSearched: debouncedSearchTerm.length >= minLength,
        searchCount: debouncedSearchTerm.length >= minLength ? prev.searchCount + 1 : prev.searchCount
      }));

      // Telemetría de finalización
      if (enableTelemetry && telemetryRef.current.searchStartTime) {
        const duration = Date.now() - telemetryRef.current.searchStartTime;
        onSearchComplete?.(debouncedSearchTerm, duration);
        telemetryRef.current.searchStartTime = null;
      }
    }
  }, [searchTerm, debouncedSearchTerm, minLength, enableTelemetry, onSearchStart, onSearchComplete]);

  return {
    debouncedSearchTerm,
    isSearching: searchState.isSearching,
    hasSearched: searchState.hasSearched,
    searchCount: searchState.searchCount,
    shouldSearch: debouncedSearchTerm.length >= minLength
  };
}

export default useDebounce;
