/**
 * Períodos de Rentabilidad (F6).
 *
 * El BE resuelve TODOS los endpoints con `NewPeriodRolling`
 * (`internal/analytics/domain.go`): `week` son los ÚLTIMOS 7 DÍAS, mientras
 * que `month`/`year` son calendario y `today` el día calendario. El label de
 * la UI debe decirlo; no se inventan ventanas.
 */
import type { DashboardPeriod } from '@/types/bi'

export const PROFITABILITY_PERIODS: readonly DashboardPeriod[] = [
  'today',
  'week',
  'month',
  'year',
]

export const PROFITABILITY_DEFAULT_PERIOD: DashboardPeriod = 'month'

export const isProfitabilityPeriod = (value: unknown): value is DashboardPeriod =>
  typeof value === 'string' && (PROFITABILITY_PERIODS as readonly string[]).includes(value)
