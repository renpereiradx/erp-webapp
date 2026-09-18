/**
 * Barrel del feature de rentabilidad (FSD). App.tsx importa las páginas
 * desde acá vía lazy. PLAN_ALINEACION_BI_FRONTEND FASE 2.
 */
export { default as ProfitabilityDashboard } from './components/ProfitabilityDashboard';
export { default as ProductProfitability } from './components/ProductProfitability';
export { default as CustomerProfitability } from './components/CustomerProfitability';
export { default as CategoryProfitability } from './components/CategoryProfitability';
export { default as ProfitabilityTrends } from './components/ProfitabilityTrends';
export { default as SellerProfitability } from './components/SellerProfitability';
export { default as KpiCard } from './components/KpiCard';
export { default as ProfitabilitySkeleton } from './components/ProfitabilitySkeleton';
export { useProfitability } from './hooks/useProfitability';
export type {
  ProfitabilityResource,
  ProfitabilityParams,
  DashboardData,
  ProductProfitabilityData,
  CustomerProfitabilityData,
  CategoryProfitabilityData,
  TrendsData,
  SellerProfitabilityData,
} from './types';
