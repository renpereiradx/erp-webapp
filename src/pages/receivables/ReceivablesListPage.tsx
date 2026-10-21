import { useState } from 'react'
import {
  CircleDollarSign,
  CreditCard,
  Flame,
  ListChecks,
  Receipt,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import type { Receivable } from '@/types/bi'
import {
  ReceivablesKpiLedger,
  ReceivablesPageLayout,
  ReceivablesPriorityBadge,
  ReceivablesRefreshButton,
  ReceivablesStatusBadge,
  ReceivablesStatusFilterControl,
  ReceivablesTable,
  SortableHeader,
  useReceivablesList,
  type ReceivablesColumn,
  type ReceivablesKpiItem,
  type ReceivablesKpiTone,
  type ReceivablesSort,
  type ReceivablesStatusFilter,
} from '@/features/receivables'
import {
  DEFAULT_RECEIVABLES_SORT,
  ariaSortFor,
  nextReceivablesSort,
} from '@/domain/receivables/collection'
import { formatDate, formatMoney } from '@/domain/receivables/format'
import { buildListKpis, formatKpiValue } from '@/domain/receivables/kpis'
import type { ReceivablesKpiValue } from '@/domain/receivables/kpis'

interface KpiMeta {
  icon: LucideIcon
  tone: ReceivablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const LIST_META: Record<string, KpiMeta> = {
  listTotal: {
    icon: Receipt,
    tone: 'primary',
    labelKey: 'receivables.list.kpis.total',
    label: 'Facturado original',
    hintKey: 'receivables.list.hints.total',
    hint: 'Monto original de las cuentas del filtro',
  },
  listPending: {
    icon: Wallet,
    tone: 'warning',
    labelKey: 'receivables.list.kpis.pending',
    label: 'Pendiente',
    hintKey: 'receivables.list.hints.pending',
    hint: 'Saldo por cobrar del filtro',
  },
  listPaid: {
    icon: CircleDollarSign,
    tone: 'success',
    labelKey: 'receivables.list.kpis.paid',
    label: 'Cobrado',
    hintKey: 'receivables.list.hints.paid',
    hint: 'Pagos aplicados a esas cuentas',
  },
  listCount: {
    icon: ListChecks,
    tone: 'secondary',
    labelKey: 'receivables.list.kpis.count',
    label: 'Cuentas',
    hintKey: 'receivables.list.hints.count',
    hint: 'Conteo global del filtro, no de la página',
  },
  listHighPriority: {
    icon: Flame,
    tone: 'error',
    labelKey: 'receivables.list.kpis.highPriority',
    label: 'Alta prioridad',
    hintKey: 'receivables.list.hints.highPriority',
    hint: 'Más de 60 días vencidos',
  },
}

/**
 * F7 — Lista maestra de CxC. Paginación y orden server-side (whitelist T3),
 * filtro por estado con los 3 valores que acepta el BE. Los totales del
 * resumen son del set filtrado completo (ventanas del repo), no de la página.
 */
const ReceivablesListPage = () => {
  const { t, lang } = useI18n()
  const [status, setStatus] = useState<ReceivablesStatusFilter>('ALL')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ReceivablesSort>(DEFAULT_RECEIVABLES_SORT)
  const query = useReceivablesList({ status, page, sort })

  const errorTitle = t('receivables.errors.title', 'No se pudieron cargar los datos')
  const data = query.data
  const pagination = data?.pagination

  const kpiItems: ReceivablesKpiItem[] = buildListKpis(data?.summary).map((row: ReceivablesKpiValue) => {
    const meta = LIST_META[row.id]
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.label),
      hint: t(meta.hintKey, meta.hint),
      value: formatKpiValue(row, lang),
    }
  })

  const handleStatusChange = (next: ReceivablesStatusFilter) => {
    setStatus(next)
    setPage(1)
  }

  const handleSort = (field: Parameters<typeof nextReceivablesSort>[1]) => {
    setSort((current) => nextReceivablesSort(current, field))
    setPage(1)
  }

  const columns: Array<ReceivablesColumn<Receivable>> = [
    {
      key: 'account',
      mono: true,
      header: t('receivables.columns.account', 'Cuenta'),
      render: (row) => (
        <Link
          to={`/receivables/detail/${encodeURIComponent(row.id)}`}
          className="text-primary hover:underline"
        >
          {row.id}
        </Link>
      ),
    },
    {
      key: 'client',
      header: (
        <SortableHeader
          label={t('receivables.columns.client', 'Cliente')}
          field='client'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: ariaSortFor(sort, 'client'),
      render: (row) => (
        <Link
          to={`/receivables/client-profile/${encodeURIComponent(row.client_id)}`}
          className="text-primary hover:underline"
        >
          {row.client_name || row.client_id}
        </Link>
      ),
    },
    {
      key: 'saleDate',
      mono: true,
      header: (
        <SortableHeader
          label={t('receivables.columns.saleDate', 'Venta')}
          field='date'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: ariaSortFor(sort, 'date'),
      render: (row) => formatDate(row.sale_date, lang),
    },
    {
      key: 'daysOverdue',
      align: 'right',
      header: (
        <SortableHeader
          label={t('receivables.columns.daysOverdue', 'Días vencidos')}
          field='days_overdue'
          sort={sort}
          onSort={handleSort}
        />
      ),
      ariaSort: ariaSortFor(sort, 'days_overdue'),
      render: (row) => (
        <div className="flex flex-col items-end gap-xs">
          <span className="font-data-mono text-data-mono">{row.days_overdue}</span>
          <ReceivablesPriorityBadge daysOverdue={row.days_overdue} />
        </div>
      ),
    },
    {
      key: 'original',
      align: 'right',
      header: t('receivables.columns.original', 'Original'),
      render: (row) => formatMoney(row.original_amount),
    },
    {
      key: 'paid',
      align: 'right',
      header: t('receivables.columns.paid', 'Cobrado'),
      render: (row) => formatMoney(row.paid_amount),
    },
    {
      key: 'pending',
      align: 'right',
      header: (
        <SortableHeader
          label={t('receivables.columns.pending', 'Pendiente')}
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
      header: t('receivables.columns.status', 'Estado'),
      render: (row) => <ReceivablesStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('receivables.columns.actions', 'Acciones'),
      render: (row) => (
        <Link
          to={`/receivables/detail/${encodeURIComponent(row.id)}`}
          className="text-body-sm-bold text-primary hover:underline"
        >
          {t('receivables.actions.viewDetail', 'Ver detalle')}
        </Link>
      ),
    },
  ]

  const emptyFiltered = status !== 'ALL'

  return (
    <ReceivablesPageLayout
      title={t('receivables.list.title', 'Cuentas por cobrar')}
      subtitle={t(
        'receivables.list.subtitle',
        'Solo se listan cuentas con saldo pendiente; las ventas saldadas no aparecen.',
      )}
      actions={<ReceivablesRefreshButton />}
    >
      <SectionCard
        title={t('receivables.list.summaryTitle', 'Resumen del filtro')}
        description={t(
          'receivables.list.summarySubtitle',
          'Totales del set completo filtrado, no de la página visible.',
        )}
        action={
          <ReceivablesStatusFilterControl value={status} onChange={handleStatusChange} />
        }
        testId="receivables-list-summary"
      >
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<PanelSkeleton rows={5} testId="receivables-list-summary-skeleton" />}
        >
          <ReceivablesKpiLedger items={kpiItems} testId="receivables-list-kpis" />
        </QueryBoundary>
        <p className="mt-md text-body-sm text-on-surface-deep">
          {t(
            'receivables.list.overlapHint',
            'Pendiente, Parcial y Vencida se superponen: una cuenta parcial y vencida aparece en ambos filtros.',
          )}
        </p>
      </SectionCard>

      <TableCard
        title={t('receivables.list.tableTitle', 'Listado de cuentas')}
        description={t(
          'receivables.list.tableSubtitle',
          'Orden y paginación del servidor. 10 filas por página.',
        )}
        testId="receivables-list-card"
        footer={
          pagination && pagination.total_items > 0 ? (
            <TablePagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<TableSkeleton rows={6} testId="receivables-list-skeleton" />}
        >
          <ReceivablesTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            testId="receivables-list"
            minWidthClass="min-w-[980px]"
            dense
            caption={t('receivables.list.tableTitle', 'Listado de cuentas')}
            empty={
              <TableEmptyState
                icon={CreditCard}
                title={
                  emptyFiltered
                    ? t('receivables.list.emptyFiltered', 'Sin cuentas para este filtro')
                    : t('receivables.list.empty', 'Sin cuentas pendientes')
                }
                description={
                  emptyFiltered
                    ? t(
                        'receivables.list.emptyFilteredHint',
                        'Probá con otro estado o quitá el filtro.',
                      )
                    : t(
                        'receivables.list.emptyHint',
                        'Todas las ventas están saldadas.',
                      )
                }
              />
            }
          />
        </QueryBoundary>
      </TableCard>
    </ReceivablesPageLayout>
  )
}

export default ReceivablesListPage
