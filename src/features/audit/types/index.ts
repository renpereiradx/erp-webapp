/**
 * Tipos públicos del feature `audit` (F10). Los payloads de contrato viven en
 * `@/types/bi`; acá solo las vistas/columnas que consumen las páginas.
 */
export type { AuditColumn } from '../components/AuditTable'
export type { AuditKpiItem, AuditKpiTone } from '../components/AuditKpiLedger'
export type { AuditBreakdownRow } from '../components/AuditBreakdownTable'
export type { AuditDetailItem } from '../components/AuditDetailGrid'
export type { AuditExportController } from '../hooks/useAuditExport'
export type { AuditLogsQueryOptions, AuditLogsView } from '../hooks/useAuditQueries'
export type {
  AuditLogFilters,
  AuditRangeState,
  AuditResultFilter,
  AuditSort,
} from '@/domain/audit/filters'
