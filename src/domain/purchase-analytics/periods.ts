/**
 * Períodos de Analítica de Compras.
 *
 * `/purchase-analytics/*` usa el MISMO `NewPeriodRolling` del BE que
 * `/sales-analytics/*` (week = últimos 7 días rolling; month/year calendario),
 * así que reusa la lista y los helpers de fechas del dominio de ventas en
 * lugar de duplicarlos (precedente domain→domain: `domain/core/rounding`).
 */
import type { DashboardPeriod, SalesTrendGranularity } from '@/types/bi'
import { SALES_PERIODS, granularityForPeriod } from '@/domain/sales-analytics/periods'

export const PURCHASE_PERIODS: readonly DashboardPeriod[] = SALES_PERIODS

export const PURCHASE_DEFAULT_PERIOD: DashboardPeriod = 'month'

export const isPurchasePeriod = (value: unknown): value is DashboardPeriod =>
  typeof value === 'string' && (PURCHASE_PERIODS as readonly string[]).includes(value)

/** Misma derivación que ventas: today→hourly, year→monthly, resto daily. */
export const purchaseGranularityForPeriod = granularityForPeriod as (
  period: DashboardPeriod,
) => SalesTrendGranularity

export {
  toIsoDate,
  addDays,
  lastDaysRange,
  isValidIsoDate,
  isValidDateRange,
  parseCalendarDate,
  previousCalendarDay,
  formatCalendarDate,
} from '@/domain/sales-analytics/periods'
