import { useEffect, useState } from 'react'

/**
 * Debounce genérico del catálogo: demora la propagación de `value` para no
 * golpear la búsqueda avanzada en cada tecla. (Copia tipada del patrón de
 * features/products/hooks/useDebouncedValue, autocontenida en el feature.)
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
