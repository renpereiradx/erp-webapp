import { useState, useEffect } from 'react'

/**
 * Hook para debouncear un valor
 * @param {any} value - El valor a debouncear
 * @param {number} delay - El retraso en ms (default 500ms)
 * @returns {any} - El valor debouceado
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}
