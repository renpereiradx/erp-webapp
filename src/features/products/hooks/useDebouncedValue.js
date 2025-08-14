import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useDebouncedValue
 * Devuelve un valor que solo se actualiza después de un retraso sin cambios.
 *
 * @param {T} value Valor crudo
 * @param {number} delayMs Milisegundos de debounce (por defecto 400)
 * @returns {{ value: T, flush: () => void, cancel: () => void }}
 * @template T
 */
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef(null);
  const valueRef = useRef(value);

  // Actualizar la ref cuando cambie el valor
  valueRef.current = value;

  useEffect(() => {
    // Limpiar timer anterior si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Actualización inmediata cuando delay <= 0 para facilitar tests y casos instantáneos
    if (delayMs <= 0) {
      setDebounced(valueRef.current);
      return;
    }
    
    // Configurar nuevo timer
    timerRef.current = setTimeout(() => {
      setDebounced(valueRef.current);
    }, delayMs);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delayMs]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDebounced(valueRef.current);
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { value: debounced, flush, cancel };
}

export default useDebouncedValue;
