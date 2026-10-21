/**
 * Constantes de presentación de Auditoría (F10).
 *
 * La regla del proyecto es ≤10 filas por página de tabla; el registro de
 * eventos la respeta. El export del BE tiene su propio cap (`max_records`
 * ≤ 10 000 en el handler) y la ventana por defecto del listado son 30 días,
 * la misma que aplica el backend cuando no se envían fechas — la UI las manda
 * explícitas para poder mostrar el rango aplicado.
 */

export const AUDIT_PAGE_SIZE = 10

/** Días de la ventana inicial del registro (hoy inclusive). */
export const AUDIT_DEFAULT_RANGE_DAYS = 30

/** Cap del handler de export (`req.MaxRecords <= 0 || > 10000` → 10000). */
export const AUDIT_EXPORT_MAX_RECORDS = 10_000
