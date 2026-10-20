import { useRef, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import TablePagination from '@/components/ui/TablePagination'
import { useI18n } from '@/lib/i18n'
import { useSearchFocusShortcut } from '@/hooks/useSearchFocusShortcut'
import type { DrilldownColumn } from '@/domain/relational-analytics/types'
import EntityContextBar, { ENTITY_LABEL_FALLBACK } from './EntityContextBar'
import DrilldownEntityPicker from './DrilldownEntityPicker'
import DrilldownFilters from './DrilldownFilters'
import DrilldownTable from './DrilldownTable'
import DrilldownTableSkeleton from './DrilldownTableSkeleton'
import type { DrilldownQuery } from '../hooks/useDrilldownQuery'
import type {
  DrilldownRowMenu,
  EntityOption,
  EntitySearchFn,
  RelationalEntityKind,
} from '../types'

interface DrilldownScreenProps<Row> {
  testId: string
  title: string
  subtitle: string
  entityKind: RelationalEntityKind
  entityId: string | null
  /** nombre resuelto (fallback: id de la URL) */
  entityLabel: string
  entitySub?: string | null
  variantLabel?: string | null
  searchEntity: EntitySearchFn
  minSearchChars?: number
  onPickEntity: (id: string, option: EntityOption) => void
  onChangeEntity: () => void
  pickerTitle: string
  pickerHelp: string
  pickerSearchPlaceholder: string
  searchPlaceholder: string
  emptyTitle: string
  columns: readonly DrilldownColumn<Row>[]
  rowKey: (row: Row) => string
  rowMenu?: (row: Row) => DrilldownRowMenu
  /** banner opcional (meta excluded_other_currency de #4) */
  metaBanner?: ReactNode
  query: DrilldownQuery<Row>
}

/**
 * Shell común de los 4 drill-downs relacionales (F3): encabezado, contexto
 * de la entidad, filtros, tabla ordenable y paginación server-side (10
 * filas). Sin entidad en la URL muestra el picker; con entidad, el análisis.
 * Toda la orquestación de datos vive en `useDrilldownQuery`.
 */
export function DrilldownScreen<Row>({
  testId,
  title,
  subtitle,
  entityKind,
  entityId,
  entityLabel,
  entitySub,
  variantLabel,
  searchEntity,
  minSearchChars,
  onPickEntity,
  onChangeEntity,
  pickerTitle,
  pickerHelp,
  pickerSearchPlaceholder,
  searchPlaceholder,
  emptyTitle,
  columns,
  rowKey,
  rowMenu,
  metaBanner,
  query,
}: DrilldownScreenProps<Row>) {
  const { t } = useI18n()
  const searchInputRef = useRef<HTMLInputElement>(null)
  useSearchFocusShortcut({ enabled: true, inputRef: searchInputRef })

  const kindLabel = t(
    `relationalAnalytics.entity.${entityKind}`,
    ENTITY_LABEL_FALLBACK[entityKind],
  )

  return (
    <div className="min-h-screen bg-background" data-testid={testId}>
      <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={
            entityId ? (
              <Button variant="secondary" type="button" onClick={onChangeEntity}>
                <Search className="mr-xs size-4" aria-hidden="true" />
                {t('relationalAnalytics.picker.change', 'Cambiar {entity}', {
                  entity: kindLabel,
                })}
              </Button>
            ) : null
          }
        />

        {entityId ? (
          <div className="space-y-lg">
            <EntityContextBar
              kind={entityKind}
              label={entityLabel}
              sub={entitySub}
              entityId={entityId}
              variantLabel={variantLabel}
            />

            <DrilldownFilters
              controls={query}
              searchInputRef={searchInputRef}
              searchPlaceholder={searchPlaceholder}
            />

            {metaBanner}

            {query.dateRangeInvalid ? (
              <section
                className="rounded-md bg-surface p-lg shadow-whisper"
                data-testid="drilldown-range-invalid"
              >
                <p className="text-body-md text-on-surface-deep">
                  {t(
                    'relationalAnalytics.filters.rangePending',
                    'Corregí el rango de fechas para ver el análisis.',
                  )}
                </p>
              </section>
            ) : (
              <QueryBoundary
                isLoading={query.isLoading}
                error={query.error}
                errorTitle={t(
                  'relationalAnalytics.errors.title',
                  'No se pudieron cargar los datos',
                )}
                errorMessage={t(
                  'relationalAnalytics.errors.message',
                  'Verificá la conexión e intentá nuevamente.',
                )}
                onRetry={query.refetch}
                skeleton={
                  <DrilldownTableSkeleton
                    columnCount={columns.length + (rowMenu ? 1 : 0)}
                  />
                }
              >
                <p className="mb-sm text-body-sm text-on-surface-deep sm:hidden">
                  {t(
                    'relationalAnalytics.table.scrollHint',
                    'Deslizá la tabla para ver todas las columnas.',
                  )}
                </p>
                <section
                  className="overflow-hidden rounded-md bg-surface shadow-whisper"
                  data-testid={`${testId}-card`}
                >
                  <DrilldownTable
                    columns={columns}
                    rows={query.view.rows}
                    rowKey={rowKey}
                    sort={query.sort}
                    onSort={query.toggleSort}
                    rowMenu={rowMenu}
                    emptyTitle={emptyTitle}
                    ariaLabel={title}
                  />
                  <TablePagination
                    page={query.view.page}
                    totalPages={query.view.totalPages}
                    totalItems={query.view.total}
                    onPageChange={query.setPage}
                  />
                </section>
              </QueryBoundary>
            )}
          </div>
        ) : (
          <DrilldownEntityPicker
            title={pickerTitle}
            help={pickerHelp}
            searchPlaceholder={pickerSearchPlaceholder}
            search={searchEntity}
            onPick={onPickEntity}
            minChars={minSearchChars}
            inputRef={searchInputRef}
            testId={`${testId}-picker`}
          />
        )}
      </div>
    </div>
  )
}

export default DrilldownScreen
