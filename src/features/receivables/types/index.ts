/**
 * Tipos de presentación del feature Cuentas por Cobrar (F7).
 *
 * Los payloads reales viven en `src/types/bi.ts`; acá solo se re-exportan los
 * tipos derivados que consumen páginas y componentes.
 */
export type {
  ReceivablesAgingView,
  ReceivablesListView,
  ReceivablesListParams,
  ReceivablesStatisticsView,
  ClientReceivablesView,
  ReceivableDetailView,
} from '../hooks/useReceivablesQueries'

export type { ReceivablesKpiItem, ReceivablesKpiTone } from '../components/ReceivablesKpiLedger'
export type { ReceivablesBadgeTone } from '../components/ReceivablesBadge'
export type { ReceivablesColumn } from '../components/ReceivablesTable'
export type { ReceivablesSort } from '@/domain/receivables/collection'
export type { ReceivablesStatusFilter } from '@/domain/receivables/status'
export type { AgingBucketRow, ClientAgingRow } from '@/domain/receivables/aging'
