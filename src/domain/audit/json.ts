/**
 * Render legible de los JSONB de auditoría (`old_values`, `new_values`,
 * `metadata`). El BE los serializa como `json.RawMessage`: un objeto/array
 * viaja como JSON nativo y un valor escalar como string. Sin dato → `null`
 * (la sección no se renderiza, no se inventa un `{}`).
 */
export const formatJsonValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') {
    if (Array.isArray(value) && value.length === 0) return null
    if (!Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0) {
      return null
    }
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '' || trimmed === 'null') return null
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2)
    } catch {
      return trimmed
    }
  }
  try {
    const serialized = JSON.stringify(value, null, 2)
    return serialized === undefined || serialized === 'null' ? null : serialized
  } catch {
    return null
  }
}

/** ¿Hay algo para mostrar? (objeto vacío no cuenta como contenido). */
export const hasJsonContent = (value: unknown): boolean => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (Object.keys(value as Record<string, unknown>).length === 0) return false
  }
  if (Array.isArray(value) && value.length === 0) return false
  return formatJsonValue(value) !== null
}
