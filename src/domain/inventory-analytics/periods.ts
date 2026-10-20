/**
 * Períodos de Analítica de Inventario (F5).
 *
 * `/inventory-analytics/turnover` y `/abc` resuelven el período con
 * `NewPeriodRolling` (`internal/analytics/domain.go`): `week` son los ÚLTIMOS
 * 7 DÍAS, mientras que `month`/`year` son calendario y `today` el día
 * calendario. El label de la UI debe decirlo; no se inventan ventanas.
 */
import type { DashboardPeriod } from '@/types/bi'

export const INVENTORY_PERIODS: readonly DashboardPeriod[] = ['today', 'week', 'month', 'year']

export const INVENTORY_DEFAULT_PERIOD: DashboardPeriod = 'month'

export const isInventoryPeriod = (value: unknown): value is DashboardPeriod =>
  typeof value === 'string' && (INVENTORY_PERIODS as readonly string[]).includes(value)
