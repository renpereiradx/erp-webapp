/**
 * Series temporales de Auditoría (F10).
 *
 * `/audit/dashboard` embebe `trends` y el repo decide la granularidad por la
 * duración del período: ≤ 1 día → horaria; > 90 días → semanal; resto diaria
 * (`GetAuditDashboard`). La UI replica esa regla desde `period.start_date` /
 * `period.end_date` para elegir el formateo correcto:
 *  - horaria/semanal: buckets `timestamptz` (instantes) → hora/día local;
 *  - diaria: `DATE(timestamp)` (date-only a medianoche UTC) → día en UTC.
 * La etiqueta del servidor (`to_char` en inglés) NUNCA se muestra: se
 * re-deriva del `date` en el locale de la UI.
 */
import type { AuditDailyActivity, AuditTrendPoint, BIReportPeriod } from '@/types/bi'
import { formatTime, formatUtcDayMonth, isMissingDate } from './format'

export type AuditTrendGranularity = 'hourly' | 'daily' | 'weekly'

const DAY_MS = 86_400_000

/** Misma regla que `GetAuditDashboard` (dashboard repo de auditoría). */
export const auditGranularityForPeriod = (
  period: BIReportPeriod | null | undefined,
): AuditTrendGranularity => {
  if (!period?.start_date || !period?.end_date) return 'daily'
  const start = new Date(period.start_date).getTime()
  const end = new Date(period.end_date).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 'daily'
  const days = (end - start) / DAY_MS
  if (days <= 1) return 'hourly'
  if (days > 90) return 'weekly'
  return 'daily'
}

/** Bucket de tendencias → etiqueta local/UTC según granularidad. */
export const formatAuditBucketLabel = (
  point: Pick<AuditTrendPoint, 'date'>,
  granularity: AuditTrendGranularity,
  locale?: string,
): string => {
  if (isMissingDate(point.date)) return '—'
  if (granularity === 'hourly') return formatTime(point.date, locale)
  if (granularity === 'daily') return formatUtcDayMonth(point.date, locale)
  return new Date(point.date).toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
  })
}

export interface AuditChartDatum {
  key: string
  label: string
  total: number
  successful: number
  failed: number
  uniqueUsers: number
  errorRate: number
}

/** Puntos reales de `/audit/dashboard.trends` listos para el gráfico. */
export const buildAuditTrendData = (
  points: AuditTrendPoint[] | null | undefined,
  granularity: AuditTrendGranularity,
  locale?: string,
): AuditChartDatum[] => {
  if (!Array.isArray(points)) return []
  return points.map((point, index) => ({
    key: `${point.date || 'bucket'}-${index}`,
    label: formatAuditBucketLabel(point, granularity, locale),
    total: point.total_actions ?? 0,
    successful: point.successful ?? 0,
    failed: point.failed ?? 0,
    uniqueUsers: point.unique_users ?? 0,
    errorRate: point.error_rate ?? 0,
  }))
}

/** Días reales de la ficha de usuario (`actions_by_day`, date-only UTC). */
export const buildAuditDailyData = (
  days: AuditDailyActivity[] | null | undefined,
  locale?: string,
): AuditChartDatum[] => {
  if (!Array.isArray(days)) return []
  return days.map((day, index) => ({
    key: `${day.date || 'day'}-${index}`,
    label: formatUtcDayMonth(day.date, locale),
    total: day.actions ?? 0,
    successful: day.success ?? 0,
    failed: day.failed ?? 0,
    uniqueUsers: 0,
    errorRate: 0,
  }))
}

/** Máximo real del conjunto (para escalar barras); 0 con serie vacía. */
export const maxAuditChartValue = (data: AuditChartDatum[]): number =>
  data.reduce((max, item) => Math.max(max, item.total), 0)
