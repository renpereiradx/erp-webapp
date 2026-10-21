/**
 * Indicadores de Auditoría (F10).
 *
 * Todos salen del payload real; no se derivan metas ni comparaciones que el
 * backend no calcula. Reglas:
 *  - sin acciones la tasa de éxito es `n/d`, no `0%` (un 0% sugeriría que
 *    todas fallaron);
 *  - la hora pico solo se muestra si tuvo acciones (`peak_hour_actions > 0`);
 *  - la última actividad usa el cero de Go (`0001-01-01`) como "sin datos";
 *  - `avg_actions_per_day` es total / días del período (no días activos), y
 *    se rotula como tal.
 */
import type { AuditKPIs, AuditUserActivitySummary } from '@/types/bi'
import {
  formatCount,
  formatDateTime,
  formatDecimal,
  formatHour,
  formatPercent,
  formatSuccessRate,
  toNumberOrNull,
} from './format'

export type AuditKpiKind = 'count' | 'percent' | 'decimal' | 'text'

export interface AuditKpiValue {
  id: string
  kind: AuditKpiKind
  value: number | string | null
}

export const formatAuditKpiValue = (row: AuditKpiValue): string => {
  switch (row.kind) {
    case 'count':
      return formatCount(row.value as number | null)
    case 'percent':
      return toNumberOrNull(row.value) === null ? 'n/d' : formatPercent(row.value as number)
    case 'decimal':
      return formatDecimal(row.value as number | null, 2)
    case 'text':
    default:
      return typeof row.value === 'string' && row.value !== '' ? row.value : '—'
  }
}

/** KPIs del dashboard consolidado (`/api/v1/audit/dashboard`). */
export const auditDashboardKpis = (kpis: AuditKPIs | null | undefined): AuditKpiValue[] => {
  if (!kpis) return []
  const total = toNumberOrNull(kpis.total_actions)
  const peakActions = toNumberOrNull(kpis.peak_hour_actions)
  return [
    { id: 'totalActions', kind: 'count', value: total },
    {
      id: 'successRate',
      kind: 'percent',
      value:
        total !== null && total > 0
          ? kpis.success_rate
          : null,
    },
    { id: 'failedActions', kind: 'count', value: kpis.failed_actions },
    { id: 'uniqueUsers', kind: 'count', value: kpis.unique_users },
    { id: 'uniqueSessions', kind: 'count', value: kpis.unique_sessions },
    { id: 'criticalErrors', kind: 'count', value: kpis.critical_errors },
    { id: 'securityIncidents', kind: 'count', value: kpis.security_incidents },
    {
      id: 'peakHour',
      kind: 'text',
      value:
        peakActions !== null && peakActions > 0 ? formatHour(kpis.peak_hour) : null,
    },
  ]
}

/** KPIs de la ficha de actividad de un usuario. */
export const auditUserKpis = (
  summary: AuditUserActivitySummary | null | undefined,
  locale?: string,
): AuditKpiValue[] => {
  if (!summary) return []
  const total = toNumberOrNull(summary.total_actions)
  return [
    { id: 'totalActions', kind: 'count', value: total },
    { id: 'successfulActions', kind: 'count', value: summary.successful_actions },
    { id: 'failedActions', kind: 'count', value: summary.failed_actions },
    {
      id: 'successRate',
      kind: 'percent',
      value:
        total !== null && total > 0
          ? ((summary.successful_actions ?? 0) / total) * 100
          : null,
    },
    { id: 'uniqueCategories', kind: 'count', value: summary.unique_categories },
    { id: 'uniqueSessions', kind: 'count', value: summary.unique_sessions },
    { id: 'avgPerDay', kind: 'decimal', value: summary.avg_actions_per_day },
    {
      id: 'lastActivity',
      kind: 'text',
      value:
        total !== null && total > 0
          ? formatDateTime(summary.last_activity, locale)
          : null,
    },
  ]
}

/** Tasa de éxito textual de una serie (para resúmenes de sección). */
export const auditSuccessRateLabel = (
  total: number | null | undefined,
  successful: number | null | undefined,
): string => formatSuccessRate(total, successful)
