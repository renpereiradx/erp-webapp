import { useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Actualización inmediata cuando delay <= 0 para facilitar tests y casos instantáneos
    if (delayMs <= 0) {
      setDebounced(value);
      return () => {};
    }
    timerRef.current = setTimeout(() => setDebounced(value), delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delayMs]);

  const flush = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDebounced(value);
  };

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return { value: debounced, flush, cancel };
}

export default useDebouncedValue;
