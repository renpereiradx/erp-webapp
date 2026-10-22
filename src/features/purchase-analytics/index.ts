/**
 * Barrel público de la feature Analítica de Compras
 * (PLAN_ANALITICA_COMPRAS, RF-BIPACK-031..035).
 *
 * Dirección de dependencias: `pages → features → (domain, services)`. Las
 * páginas importan SOLO de este barrel, nunca de rutas internas. Los
 * componentes no hacen fetch ni cálculo: reciben props de view-models del
 * dominio.
 */
export { PurchaseComparisonControls } from './components/PurchaseComparisonControls'
export { PurchaseComparisonResult } from './components/PurchaseComparisonResult'
export { PurchaseKpiLedger } from './components/PurchaseKpiLedger'
export type { PurchaseKpiItem, PurchaseKpiTone } from './components/PurchaseKpiLedger'
export { PurchasePageLayout } from './components/PurchasePageLayout'
export { PurchasePaymentMixList } from './components/PurchasePaymentMixList'
export { PurchasePeriodSelector } from './components/PurchasePeriodSelector'
export { PurchaseRefreshButton } from './components/PurchaseRefreshButton'
export { SortableHeader } from './components/SortableHeader'
export { PurchaseTable } from './components/PurchaseTable'
export type { PurchaseColumn } from './components/PurchaseTable'
export { PurchaseTrendSection } from './components/PurchaseTrendSection'
export {
  purchaseQueryKeys,
  usePurchaseComparison,
  usePurchasePerformance,
  usePurchaseTrends,
  usePurchasesByBuyer,
  usePurchasesByCategory,
  usePurchasesByDayOfWeek,
  usePurchasesByHour,
  usePurchasesByPaymentMethod,
  usePurchasesByProduct,
  usePurchasesBySupplier,
} from './hooks/usePurchaseAnalyticsQueries'
export { usePurchasePeriod } from './hooks/usePurchasePeriod'
