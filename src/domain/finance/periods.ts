/**
 * Períodos de Reportes Financieros (F9).
 *
 * Todos los endpoints `/financial-reports/*` aceptan `period` ∈
 * {today, week, month, year} (`parsePeriodQuery`); cualquier otro valor es
 * 400. El rango resuelto viaja en `period.start_date/end_date` (fin
 * EXCLUSIVO) y es la única fuente de verdad de la ventana aplicada.
 *
 * El período vive en `?period=` para que el deep-link y la navegación entre
 * las pantallas lo conserven.
 */
import type { DashboardPeriod } from '@/types/bi'

export const FINANCE_PERIODS: readonly DashboardPeriod[] = ['today', 'week', 'month', 'year']

export const FINANCE_DEFAULT_PERIOD: DashboardPeriod = 'month'

export const isFinancePeriod = (value: unknown): value is DashboardPeriod =>
  typeof value === 'string' && (FINANCE_PERIODS as readonly string[]).includes(value)
