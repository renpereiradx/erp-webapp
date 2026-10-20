/**
 * Utilidades de presentación del feature bi-dashboard.
 * Sin estado ni fetch: solo normalización de errores para los `ErrorState`.
 */

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Error al cargar los datos'
}
