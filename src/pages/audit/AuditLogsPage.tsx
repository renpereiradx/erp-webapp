import { useCallback, useEffect, useState } from 'react'
import { Download, FileSearch, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import type { AuditLogEntry } from '@/types/bi'
import {
  AuditFilters,
  AuditLevelBadge,
  AuditPageLayout,
  AuditRefreshButton,
  AuditSortHeader,
  AuditTable,
  useAuditEntityTypes,
  useAuditExport,
  useAuditLogs,
  type AuditColumn,
  type AuditLogFilters,
  type AuditResultFilter,
  type AuditSort,
} from '@/features/audit'
import { AUDIT_PAGE_SIZE } from '@/domain/audit/constants'
import {
  auditAriaSortFor,
  auditRangeState,
  defaultAuditLogFilters,
  hasActiveAuditFilters,
  isAuditRangeQueryable,
  nextAuditSort,
  toAuditLogsParams,
} from '@/domain/audit/filters'
import {
  auditActionFallback,
  auditActionLabelKey,
  auditCategoryFallback,
  auditCategoryLabelKey,
} from '@/domain/audit/labels'
import { formatDateTime, formatDuration } from '@/domain/audit/format'

/**
 * F10 — Registro de eventos. Paginación, orden (whitelist del repo) y filtros
 * server-side; el total y las páginas salen del BE. No hay KPIs inventados
 * junto a la tabla: el único conteo es el del propio endpoint (`total`), que
 * el pager muestra. El export usa los mismos filtros activos.
 */
const AuditLogsPage = () => {
  const { t, lang } = useI18n()
  const [defaults, setDefaults] = useState<AuditLogFilters>(() =>
    defaultAuditLogFilters(),
  )
  const [filters, setFilters] = useState<AuditLogFilters>(defaults)
  const [searchDraft, setSearchDraft] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<AuditSort | null>(null)
  // Solo una edición manual del rango congela la ventana. Categoría, nivel,
  // acción, resultado o búsqueda no la congelan: la pestaña sigue "hoy".
  const [rangeTouched, setRangeTouched] = useState(false)
  const exporter = useAuditExport()
  const entityTypeOptions = useAuditEntityTypes()

  /**
   * BI-D05: una pestaña abierta más de un día conservaba el rango inicial
   * hasta "Limpiar". Al volver a foco/visibilidad se recalcula la ventana de
   * 30 días, conservando el resto de los filtros. Si el usuario editó las
   * fechas, no se pisa su selección.
   */
  const refreshDefaultRange = useCallback(() => {
    if (rangeTouched) return
    const fresh = defaultAuditLogFilters()
    // Mismo día: no se toca la UI (ni se resetea la página en la que está el
    // usuario al volver a la pestaña).
    if (
      filters.startDate === fresh.startDate &&
      filters.endDate === fresh.endDate
    ) {
      return
    }
    setDefaults(fresh)
    setFilters({
      ...filters,
      startDate: fresh.startDate,
      endDate: fresh.endDate,
    })
    setPage(1)
  }, [filters, rangeTouched])

  useEffect(() => {
    const onFocus = () => refreshDefaultRange()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshDefaultRange()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refreshDefaultRange])

  const rangeState = auditRangeState(filters.startDate, filters.endDate)
  const queryable = isAuditRangeQueryable(rangeState)
  const params = toAuditLogsParams(filters, page, AUDIT_PAGE_SIZE, sort)
  const query = useAuditLogs(params, { enabled: queryable })

  const errorTitle = t('audit.errors.title', 'No se pudieron cargar los datos')
  const data = query.data
  const filtersActive = hasActiveAuditFilters(filters, defaults)

  const updateFilters = (next: Partial<AuditLogFilters>) => {
    setFilters((current) => ({ ...current, ...next }))
    setPage(1)
  }

  const handleApplySearch = () => {
    updateFilters({ search: searchDraft.trim() })
  }

  const handleClear = () => {
    const fresh = defaultAuditLogFilters()
    setDefaults(fresh)
    setFilters(fresh)
    setRangeTouched(false)
    setSearchDraft('')
    setPage(1)
    setSort(null)
  }

  const handleResultChange = (result: AuditResultFilter) => {
    updateFilters({ result })
  }

  const handleSort = (field: Parameters<typeof nextAuditSort>[1]) => {
    setSort((current) => nextAuditSort(current, field))
    setPage(1)
  }

  const actionHeader = t('audit.table.action', 'Acción')
  const categoryHeader = t('audit.table.category', 'Categoría')
  const levelHeader = t('audit.table.level', 'Nivel')

  const columns: Array<AuditColumn<AuditLogEntry>> = [
    {
      key: 'timestamp',
      mono: true,
      className: 'whitespace-nowrap',
      header: t('audit.table.timestamp', 'Fecha y hora'),
      render: (row) => (
        <div className="flex flex-col">
          <Link
            to={`/auditoria/logs/${encodeURIComponent(String(row.id))}`}
            aria-label={t('audit.table.viewLogAria', 'Ver evento {id}', { id: row.id })}
            className="text-primary hover:underline"
          >
            {formatDateTime(row.timestamp, lang)}
          </Link>
          <span className="text-body-sm text-on-surface-deep">#{row.id}</span>
        </div>
      ),
    },
    {
      key: 'user',
      header: t('audit.table.user', 'Usuario'),
      render: (row) =>
        row.user_id ? (
          <Link
            to={`/auditoria/usuarios/${encodeURIComponent(row.user_id)}`}
            className="break-all text-primary hover:underline"
          >
            {row.username || row.user_id}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'action',
      className: 'whitespace-nowrap',
      header: (
        <AuditSortHeader
          label={actionHeader}
          field='action'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: auditAriaSortFor(sort, 'action'),
      render: (row) => t(auditActionLabelKey(row.action), auditActionFallback(row.action)),
    },
    {
      key: 'category',
      header: (
        <AuditSortHeader
          label={categoryHeader}
          field='category'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: auditAriaSortFor(sort, 'category'),
      render: (row) =>
        t(auditCategoryLabelKey(row.category), auditCategoryFallback(row.category)),
    },
    {
      key: 'level',
      header: (
        <AuditSortHeader
          label={levelHeader}
          field='level'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: auditAriaSortFor(sort, 'level'),
      render: (row) => <AuditLevelBadge level={row.level} />,
    },
    {
      key: 'entity',
      mono: true,
      header: t('audit.table.entity', 'Entidad'),
      render: (row) =>
        row.entity_type || row.entity_id ? (
          <div className="flex flex-col">
            <span className="text-body-sm text-on-surface-deep">{row.entity_type || '—'}</span>
            <span>{row.entity_id || '—'}</span>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'description',
      header: t('audit.table.description', 'Descripción'),
      render: (row) => (
        <span
          className="line-clamp-2 block max-w-[280px] break-words"
          title={row.description || undefined}
        >
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'duration',
      align: 'right',
      mono: true,
      header: t('audit.table.duration', 'Duración'),
      render: (row) => formatDuration(row.duration_ms),
    },
  ]

  return (
    <AuditPageLayout
      title={t('audit.logs.title', 'Registro de auditoría')}
      subtitle={t(
        'audit.logs.subtitle',
        'Eventos registrados por el sistema. Los filtros y la paginación los resuelve el backend.',
      )}
      actions={
        <div className="flex max-w-full flex-wrap items-center justify-end gap-sm">
          <Button
            type="button"
            variant="secondary"
            size="md"
            loading={exporter.exporting}
            disabled={!queryable}
            onClick={() => void exporter.run(filters)}
            data-testid="audit-export"
          >
            <Download size={16} className="mr-sm" aria-hidden="true" />
            {t('audit.logs.export', 'Exportar CSV')}
          </Button>
          <AuditRefreshButton />
        </div>
      }
    >
      {exporter.error ? (
        <p role="alert" className="text-body-sm text-error" data-testid="audit-export-error">
          {t('audit.logs.exportError', 'No se pudo exportar el registro.')}
        </p>
      ) : null}
      {exporter.done ? (
        <p role="status" className="text-body-sm text-success" data-testid="audit-export-done">
          {t('audit.logs.exportDone', 'Exportación descargada.')}
        </p>
      ) : null}

      <AuditFilters
        filters={filters}
        searchDraft={searchDraft}
        rangeState={rangeState}
        hasActiveFilters={filtersActive}
        entityTypeOptions={entityTypeOptions}
        onCategoryChange={(category) => updateFilters({ category })}
        onActionChange={(action) => updateFilters({ action })}
        onEntityTypeChange={(entityType) => updateFilters({ entityType })}
        onLevelChange={(level) => updateFilters({ level })}
        onResultChange={handleResultChange}
        onStartDateChange={(startDate) => {
          setRangeTouched(true)
          updateFilters({ startDate })
        }}
        onEndDateChange={(endDate) => {
          setRangeTouched(true)
          updateFilters({ endDate })
        }}
        onSearchDraftChange={setSearchDraft}
        onApplySearch={handleApplySearch}
        onClear={handleClear}
      />

      <TableCard
        title={t('audit.logs.tableTitle', 'Eventos de auditoría')}
        description={t(
          'audit.logs.tableDescription',
          'Orden por fecha descendente; las columnas Acción, Categoría y Nivel ordenan server-side. El export incluye los filtros activos.',
        )}
        testId="audit-logs-card"
        footer={
          data ? (
            <TablePagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        {!queryable ? (
          <div className="px-lg pb-lg" role="alert">
            <TableEmptyState
              icon={FileSearch}
              title={
                rangeState === 'invalid'
                  ? t('audit.logs.invalidRangeTitle', 'Rango de fechas inválido')
                  : t('audit.logs.incompleteRangeTitle', 'Rango de fechas incompleto')
              }
              description={
                rangeState === 'invalid'
                  ? t(
                      'audit.logs.invalidRangeHint',
                      'La fecha «Desde» no puede ser posterior a «Hasta». Corregí el rango para consultar.',
                    )
                  : t(
                      'audit.logs.incompleteRangeHint',
                      'Completá las dos fechas para consultar el registro.',
                    )
              }
            />
          </div>
        ) : (
          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            errorTitle={errorTitle}
            onRetry={() => void query.refetch()}
            skeleton={<TableSkeleton rows={6} />}
          >
            <AuditTable
              columns={columns}
              rows={data?.logs ?? []}
              rowKey={(row) => String(row.id)}
              dense
              minWidthClass="min-w-[1060px]"
              testId="audit-logs-table"
              caption={t('audit.logs.tableCaption', 'Registro de eventos de auditoría')}
              empty={
                <TableEmptyState
                  icon={ListChecks}
                  title={
                    filtersActive
                      ? t('audit.logs.emptyFiltered', 'Sin eventos para esos filtros')
                      : t('audit.logs.empty', 'Sin eventos en el rango')
                  }
                  description={
                    filtersActive
                      ? t(
                          'audit.logs.emptyFilteredHint',
                          'Probá con otra categoría, nivel, resultado, texto o rango de fechas.',
                        )
                      : t(
                          'audit.logs.emptyHint',
                          'No hay eventos registrados en el rango de fechas consultado.',
                        )
                  }
                />
              }
            />
          </QueryBoundary>
        )}
      </TableCard>
    </AuditPageLayout>
  )
}

export default AuditLogsPage
