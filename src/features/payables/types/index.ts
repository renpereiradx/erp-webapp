/**
 * Tipos de presentación del feature Cuentas por Pagar (F8).
 *
 * Los payloads reales viven en `src/types/bi.ts`; acá solo se re-exportan los
 * tipos derivados que consumen páginas y componentes.
 */
export type {
  PayablesAgingView,
  PayablesListParams,
  PayablesListView,
} from '../hooks/usePayablesQueries'

export type { PayablesKpiItem, PayablesKpiTone } from '../components/PayablesKpiLedger'
export type { PayablesBadgeTone } from '../components/PayablesBadges'
export type { PayablesColumn } from '../components/PayablesTable'
export type {
  PayablesListFilters,
  PayablesSort,
  PayablesSortOrder,
} from '@/domain/payables/listing'
export type {
  PayablesPriorityFilter,
  PayablesStatusFilter,
} from '@/domain/payables/status'
export type { PayablesAgingBucketRow, SupplierAgingRow } from '@/domain/payables/aging'
export type { PayablesCashFlowDays } from '@/domain/payables/constants'
