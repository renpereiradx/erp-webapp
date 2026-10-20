/**
 * Superficie pública del feature `relational-analytics` (F3).
 * Las páginas (capa superior) importan de acá; la dirección de dependencias
 * sigue siendo `pages → features → (domain, services)`.
 */

export { DrilldownEntityPicker } from './components/DrilldownEntityPicker'
export { DrilldownFilters } from './components/DrilldownFilters'
export { DrilldownMetaBanner } from './components/DrilldownMetaBanner'
export { DrilldownScreen } from './components/DrilldownScreen'
export { DrilldownTable } from './components/DrilldownTable'
export { DrilldownTableSkeleton } from './components/DrilldownTableSkeleton'
export { EntitySearchSelect } from './components/EntitySearchSelect'
export { EntityContextBar, ENTITY_LABEL_FALLBACK } from './components/EntityContextBar'

export {
  DRILLDOWN_PAGE_SIZE,
  RELATIONAL_STALE_TIME,
  relationalQueryKeys,
  useDrilldownQuery,
} from './hooks/useDrilldownQuery'
export type {
  DrilldownFetcher,
  DrilldownPageScope,
  DrilldownQuery,
  UseDrilldownQueryOptions,
} from './hooks/useDrilldownQuery'
export { useDrilldownEntity } from './hooks/useDrilldownEntity'
export type { DrilldownEntityContext } from './hooks/useDrilldownEntity'
export { useEntitySearch } from './hooks/useEntitySearch'
export { useRowCopyValue } from './hooks/useRowCopyValue'

export type {
  DrilldownFilterControls,
  DrilldownRowAction,
  DrilldownRowMenu,
  EntityOption,
  EntitySearchFn,
  RelationalEntityKind,
} from './types'
