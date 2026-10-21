import { useState } from 'react'
import { CircleDollarSign, ListChecks, Receipt, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import type { Payable } from '@/types/bi'
import {
  PayablesFilters,
  PayablesKpiLedger,
  PayablesPageLayout,
  PayablesPriorityBadge,
  PayablesRefreshButton,
  PayablesStatusBadge,
  PayablesTable,
  SortableHeader,
  usePayablesList,
  type PayablesColumn,
  type PayablesKpiItem,
  type PayablesKpiTone,
  type PayablesListFilters,
  type PayablesSort,
  type PayablesStatusFilter,
  type PayablesPriorityFilter,
} from '@/features/payables'
import {
  DEFAULT_PAYABLES_SORT,
  EMPTY_PAYABLES_FILTERS,
  ariaSortFor,
  hasActivePayablesFilters,
  isInvalidDateRange,
  nextPayablesSort,
} from '@/domain/payables/listing'
import { formatDate, formatDays, formatMoney } from '@/domain/payables/format'
import { buildListKpis, formatKpiValue } from '@/domain/payables/overview'
import type { PayablesKpiValue } from '@/domain/payables/overview'

interface KpiMeta {
  icon: LucideIcon
  tone: PayablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const LIST_META: Record<string, KpiMeta> = {
  listTotal: {
    icon: Receipt,
    tone: 'primary',
    labelKey: 'payables.list.kpis.total',
    label: 'Comprado original',
    hintKey: 'payables.list.hints.total',
    hint: 'Monto original de las cuentas del filtro',
  },
  listPending: {
    icon: Wallet,
    tone: 'warning',
    labelKey: 'payables.list.kpis.pending',
    label: 'Pendiente',
    hintKey: 'payables.list.hints.pending',
    hint: 'Saldo por pagar del filtro',
  },
  listPaid: {
    icon: CircleDollarSign,
    tone: 'success',
    labelKey: 'payables.list.kpis.paid',
    label: 'Pagado',
    hintKey: 'payables.list.hints.paid',
    hint: 'Pagos aplicados a esas cuentas',
  },
  listCount: {
    icon: ListChecks,
    tone: 'secondary',
    labelKey: 'payables.list.kpis.count',
    label: 'Cuentas',
    hintKey: 'payables.list.hints.count',
    hint: 'Conteo global del filtro, no de la página',
  },
}

/**
 * F8 — Lista maestra de CxP. Paginación y orden server-side (whitelist T3),
 * filtros reales (status/prioridad/texto/fechas) y totales del set filtrado
 * completo (ventanas del SQL), no de la página.
 */
const InvoicesMasterListPage = () => {
  const { t, lang } = useI18n()
  const [filters, setFilters] = useState<PayablesListFilters>(EMPTY_PAYABLES_FILTERS)
  const [searchDraft, setSearchDraft] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<PayablesSort>(DEFAULT_PAYABLES_SORT)

  const invalidRange = isInvalidDateRange(filters.startDate, filters.endDate)
  const query = usePayablesList({
    page,
    sort,
    status: filters.status,
    priority: filters.priority,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate,
  })

  const errorTitle = t('payables.errors.title', 'No se pudieron cargar los datos')
  const data = query.data
  const pagination = data?.pagination

  const kpiItems: PayablesKpiItem[] = buildListKpis(data?.summary, pagination).map(
    (row: PayablesKpiValue) => {
      const meta = LIST_META[row.id]
      return {
        id: row.id,
        icon: meta.icon,
        tone: meta.tone,
        label: t(meta.labelKey, meta.label),
        hint: t(meta.hintKey, meta.hint),
        value: formatKpiValue(row, lang),
      }
    },
  )

  const resetPage = () => setPage(1)

  const updateFilters = (next: Partial<PayablesListFilters>) => {
    setFilters((current) => ({ ...current, ...next }))
    resetPage()
  }

  const handleStatusChange = (status: PayablesStatusFilter) => {
    updateFilters({ status })
  }

  const handlePriorityChange = (priority: PayablesPriorityFilter) => {
    updateFilters({ priority })
  }

  const handleApplySearch = () => {
    updateFilters({ search: searchDraft.trim() })
  }

  const handleClear = () => {
    setFilters(EMPTY_PAYABLES_FILTERS)
    setSearchDraft('')
    resetPage()
  }

  const handleSort = (field: Parameters<typeof nextPayablesSort>[1]) => {
    setSort((current) => nextPayablesSort(current, field))
    resetPage()
  }

  const columns: Array<PayablesColumn<Payable>> = [
    {
      key: 'invoice',
      mono: true,
      header: t('payables.columns.invoice', 'Factura'),
      render: (row) => (
        <Link
          to={`/payables/detail/${encodeURIComponent(row.id)}`}
          className="text-primary hover:underline"
        >
          {row.id}
        </Link>
      ),
    },
    {
      key: 'supplier',
      header: (
        <SortableHeader
          label={t('payables.columns.supplier', 'Proveedor')}
          field='supplier'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: ariaSortFor(sort, 'supplier'),
      render: (row) => (
        <Link
          to={`/payables/suppliers/${encodeURIComponent(row.supplier_id)}/analysis`}
          className="text-primary hover:underline"
        >
          {row.supplier_name || row.supplier_id}
        </Link>
      ),
    },
    {
      key: 'purchaseDate',
      mono: true,
      header: (
        <SortableHeader
          label={t('payables.columns.purchaseDate', 'Compra')}
          field='date'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: ariaSortFor(sort, 'date'),
      render: (row) => formatDate(row.purchase_date, lang),
    },
    {
      key: 'dueDate',
      mono: true,
      header: (
        <SortableHeader
          label={t('payables.columns.dueDate', 'Vence')}
          field='due_date'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: ariaSortFor(sort, 'due_date'),
      render: (row) => (
        <div className="flex flex-col">
          <span>{formatDate(row.due_date, lang)}</span>
          <span className="text-body-sm text-on-surface-deep">
            {t('payables.columns.dueDateHint', 'compra + 30 d')}
          </span>
        </div>
      ),
    },
    {
      key: 'days',
      align: 'right',
      header: (
        <SortableHeader
          label={t('payables.columns.days', 'Días')}
          field='priority'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: ariaSortFor(sort, 'priority'),
      render: (row) => (
        <div className="flex flex-col items-end gap-xs">
          <span className="font-data-mono text-data-mono">
            {row.days_overdue > 0
              ? t('payables.list.daysOverdue', '{days} d vencidos', {
                  days: formatDays(row.days_overdue),
                })
              : t('payables.list.daysUntilDue', '{days} d por vencer', {
                  days: formatDays(row.days_until_due),
                })}
          </span>
          <PayablesPriorityBadge priority={row.priority} />
        </div>
      ),
    },
    {
      key: 'original',
      align: 'right',
      header: t('payables.columns.original', 'Original'),
      render: (row) => formatMoney(row.original_amount),
    },
    {
      key: 'paid',
      align: 'right',
      header: t('payables.columns.paid', 'Pagado'),
      render: (row) => formatMoney(row.paid_amount),
    },
    {
      key: 'pending',
      align: 'right',
      header: (
        <SortableHeader
          label={t('payables.columns.pending', 'Pendiente')}
          field='amount'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: ariaSortFor(sort, 'amount'),
      render: (row) => formatMoney(row.pending_amount),
    },
    {
      key: 'status',
      header: t('payables.columns.status', 'Estado'),
      render: (row) => <PayablesStatusBadge status={row.status} />,
    },
  ]

  const filtersActive = hasActivePayablesFilters(filters)

  return (
    <PayablesPageLayout
      title={t('payables.list.title', 'Cuentas por pagar')}
      subtitle={t(
        'payables.list.subtitle',
        'Solo se listan cuentas con saldo pendiente; las facturas saldadas no aparecen.',
      )}
      actions={<PayablesRefreshButton />}
    >
      <SectionCard
        title={t('payables.list.summaryTitle', 'Resumen del filtro')}
        description={t(
          'payables.list.summaryDescription',
          'Totales del set filtrado completo, no de la página visible.',
        )}
        testId="payables-list-summary"
      >
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<PanelSkeleton rows={4} />}
        >
          <PayablesKpiLedger items={kpiItems} testId="payables-list-kpis" />
        </QueryBoundary>
      </SectionCard>

      <PayablesFilters
        status={filters.status}
        priority={filters.priority}
        searchDraft={searchDraft}
        startDate={filters.startDate}
        endDate={filters.endDate}
        dateRangeInvalid={invalidRange}
        hasActiveFilters={filtersActive}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onSearchDraftChange={setSearchDraft}
        onApplySearch={handleApplySearch}
        onStartDateChange={(value) => updateFilters({ startDate: value })}
        onEndDateChange={(value) => updateFilters({ endDate: value })}
        onClear={handleClear}
      />

      <TableCard
        title={t('payables.list.tableTitle', 'Facturas por pagar')}
        description={t(
          'payables.list.tableDescription',
          'Vencimiento = compra + 30 días. Estado y prioridad los calcula el backend.',
        )}
        testId="payables-list-card"
        footer={
          pagination ? (
            <TablePagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        {invalidRange ? (
          <div className="px-lg pb-lg" role="alert">
            <TableEmptyState
              icon={ListChecks}
              title={t('payables.list.invalidRange', 'Rango de fechas inválido')}
              description={t(
                'payables.list.invalidRangeHint',
                'La fecha "Desde" no puede ser posterior a "Hasta". Corregí el rango para consultar.',
              )}
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
            <PayablesTable
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(row) => row.id}
              dense
              minWidthClass="min-w-[1000px]"
              testId="payables-list-table"
              caption={t('payables.list.caption', 'Cuentas por pagar pendientes')}
              empty={
                <TableEmptyState
                  icon={Receipt}
                  title={
                    filtersActive
                      ? t('payables.list.emptyFiltered', 'Sin cuentas para esos filtros')
                      : t('payables.list.empty', 'Sin cuentas por pagar pendientes')
                  }
                  description={
                    filtersActive
                      ? t(
                          'payables.list.emptyFilteredHint',
                          'Probá con otro estado, prioridad, texto o rango de fechas.',
                        )
                      : t(
                          'payables.list.emptyHint',
                          'No hay órdenes de compra con saldo pendiente.',
                        )
                  }
                />
              }
            />
          </QueryBoundary>
        )}
      </TableCard>
    </PayablesPageLayout>
  )
}

export default InvoicesMasterListPage
