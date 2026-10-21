/**
 * Períodos de Cuentas por Pagar (F8).
 *
 * `/payables/statistics` resuelve el período con `Statistics` → `r.resolve(p)`
 * sobre el `Timebase`. El rango aplicado viaja en `statistics.period`; la UI
 * lo muestra tal cual en vez de asumir si `week` es calendario o rolling.
 * El resto de las pantallas (overview, listado, calendario, flujo, aging) no
 * aceptan período: son snapshots "a hoy" o ventanas de días.
 */
import type { DashboardPeriod } from '@/types/bi'

export const PAYABLES_PERIODS: readonly DashboardPeriod[] = ['today', 'week', 'month', 'year']

export const PAYABLES_DEFAULT_PERIOD: DashboardPeriod = 'month'

export const isPayablesPeriod = (value: unknown): value is DashboardPeriod =>
  typeof value === 'string' && (PAYABLES_PERIODS as readonly string[]).includes(value)
