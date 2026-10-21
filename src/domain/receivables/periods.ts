/**
 * Períodos de Cuentas por Cobrar (F7).
 *
 * El BE resuelve `statistics` con `NewPeriod` (variant A, calendario):
 * `week` = semana que empieza el lunes (NO rolling), `month`/`year` calendario
 * y `today` el día. El selector lo rotula "Esta semana" para no prometer una
 * ventana móvil.
 *
 * El resto de las pantallas (overview, listado, vencidas, antigüedad) no
 * aceptan período: son snapshots "a hoy". El selector solo controla la
 * sección de estadísticas del dashboard.
 */
import type { DashboardPeriod } from '@/types/bi'

export const RECEIVABLES_PERIODS: readonly DashboardPeriod[] = ['today', 'week', 'month', 'year']

export const RECEIVABLES_DEFAULT_PERIOD: DashboardPeriod = 'month'

export const isReceivablesPeriod = (value: unknown): value is DashboardPeriod =>
  typeof value === 'string' && (RECEIVABLES_PERIODS as readonly string[]).includes(value)
