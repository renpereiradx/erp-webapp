/**
 * Status/priority label translations for payables.
 * Extracted from src/hooks/usePayables.js (where they were defined twice)
 * (PLAN_ALINEACION_BI_FRONTEND F1).
 * The legacy hardcoded Spanish labels stay until the pages are migrated
 * (FASE 4 swaps them for bi.* i18n keys — decisión D6 del plan).
 */

/** OVERDUE/PENDING/PARTIAL/PAID → VENCIDO/PENDIENTE/PARCIAL/PAGADO. */
export const translateStatus = (status: string | null | undefined): string => {
  if (!status) return 'PENDIENTE'
  const s = status.toUpperCase()
  if (s === 'OVERDUE') return 'VENCIDO'
  if (s === 'PENDING') return 'PENDIENTE'
  if (s === 'PARTIAL') return 'PARCIAL'
  if (s === 'PAID') return 'PAGADO'
  return s
}

/** URGENT/HIGH → ALTA, MEDIUM → MEDIA, LOW → BAJA. */
export const translatePriority = (priority: string | null | undefined): string => {
  if (!priority) return 'MEDIA'
  const p = priority.toUpperCase()
  if (p === 'URGENT' || p === 'HIGH') return 'ALTA'
  if (p === 'MEDIUM') return 'MEDIA'
  if (p === 'LOW') return 'BAJA'
  return p
}
