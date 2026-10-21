/**
 * Períodos de Auditoría (F10).
 *
 * `AuditService` resuelve el período con `NewPeriodRolling` (variant B): la
 * semana son los últimos 7 días, no la semana calendario. El resto de los
 * períodos es calendario (`month` = mes en curso, `year` = año en curso).
 * El backend valida el valor (`parsePeriodQuery`) y responde 400 ante algo
 * distinto de today|week|month|year; la UI valida antes de consultar.
 */
import type { DashboardPeriod } from '@/types/bi'

export const AUDIT_PERIODS: readonly DashboardPeriod[] = [
  'today',
  'week',
  'month',
  'year',
]

export const AUDIT_DEFAULT_PERIOD: DashboardPeriod = 'month'

export const isAuditPeriod = (value: unknown): value is DashboardPeriod =>
  typeof value === 'string' && (AUDIT_PERIODS as readonly string[]).includes(value)

/** Clave i18n de la etiqueta del período (`audit.period.<key>`). */
export const auditPeriodLabelKey = (period: DashboardPeriod): string =>
  `audit.period.${period}`
