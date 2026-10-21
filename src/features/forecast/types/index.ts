/**
 * Tipos de presentación del feature `forecast` (F11).
 *
 * Los payloads crudos viven en `types/bi.ts`; acá se re-exportan las vistas
 * puras que arma `domain/forecast` y que consumen los componentes.
 */
export type {
  DashboardGroupSummary,
  DashboardInsightView,
  DashboardRecommendationId,
  DashboardRecommendationView,
} from '@/domain/forecast/dashboard'
export type { InventoryAlertView } from '@/domain/forecast/inventory'
export type {
  RevenueCategoryRow,
  RevenueScenarioRow,
  RevenueSeriesRow,
} from '@/domain/forecast/revenue'
export type { ForecastSeriesRow, SalesModelMetric } from '@/domain/forecast/sales'
export type { ForecastKpiItem, ForecastKpiTone } from '../components/ForecastKpiLedger'
