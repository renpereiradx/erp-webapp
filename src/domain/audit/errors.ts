/**
 * Error tipado de la API (`ApiError.status`/`code`) → "no encontrado" en la
 * UI. El detalle de un evento usa el 404 como estado propio ("el evento no
 * existe o pertenece a otra sucursal"), no como fallo genérico.
 */
export const isNotFoundError = (error: unknown): boolean => {
  if (error === null || typeof error !== 'object') return false
  const candidate = error as {
    code?: unknown
    status?: unknown
    response?: { status?: unknown }
  }
  return (
    candidate.code === 'NOT_FOUND' ||
    candidate.status === 404 ||
    candidate.response?.status === 404
  )
}
