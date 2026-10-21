import { useState } from 'react'
import { CircleDollarSign, Flame, ListChecks, ShieldCheck, Wallet } from 'lucide-react'
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
  ReceivablesTable,
  useReceivablesOverdue,
  type ReceivablesColumn,
  type ReceivablesKpiItem,
  type ReceivablesKpiTone,
} from '@/features/receivables'
import { formatDate, formatMoney } from '@/domain/receivables/format'
import { buildOverdueKpis, formatKpiValue } from '@/domain/receivables/kpis'
import type { ReceivablesKpiValue } from '@/domain/receivables/kpis'

interface KpiMeta {
  icon: LucideIcon
  tone: ReceivablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const OVERDUE_META: Record<string, KpiMeta> = {
  overduePending: {
    icon: Wallet,
    tone: 'error',
    labelKey: 'receivables.overdue.kpis.pending',
    label: 'Saldo vencido',
    hintKey: 'receivables.overdue.hints.pending',
    hint: 'Con vencimiento anterior a hoy',
  },
  overdueAccounts: {
    icon: ListChecks,
    tone: 'warning',
    labelKey: 'receivables.overdue.kpis.accounts',
    label: 'Cuentas vencidas',
    hintKey: 'receivables.overdue.hints.accounts',
    hint: 'Conteo global del filtro',
  },
  overdueHighPriority: {
    icon: Flame,
    tone: 'error',
    labelKey: 'receivables.overdue.kpis.highPriority',
    label: 'Alta prioridad',
    hintKey: 'receivables.overdue.hints.highPriority',
    hint: 'Más de 60 días vencidos',
  },
  overduePaid: {
    icon: CircleDollarSign,
    tone: 'success',
    labelKey: 'receivables.overdue.kpis.paid',
    label: 'Cobrado',
    hintKey: 'receivables.overdue.hints.paid',
    hint: 'Pagos aplicados a las cuentas vencidas',
  },
}

/**
 * F7 — Cuentas vencidas. El endpoint fija `status=OVERDUE` y ordena por días
 * vencidos desc; la UI solo pagina. El conteo de alta prioridad es la ventana
 * del BE (>60 días) sobre el set completo.
 */
const OverdueReceivablesPage = () => {
  const { t, lang } = useI18n()
  const [page, setPage] = useState(1)
  const query = useReceivablesOverdue(page)

  const errorTitle = t('receivables.errors.title', 'No se pudieron cargar los datos')
  const data = query.data
  const pagination = data?.pagination

  const kpiItems: ReceivablesKpiItem[] = buildOverdueKpis(data?.summary).map(
    (row: ReceivablesKpiValue) => {
      const meta = OVERDUE_META[row.id]
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
      header: t('receivables.columns.client', 'Cliente'),
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
      header: t('receivables.columns.saleDate', 'Venta'),
      render: (row) => formatDate(row.sale_date, lang),
    },
    {
      key: 'daysOverdue',
      align: 'right',
      header: t('receivables.columns.daysOverdue', 'Días vencidos'),
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
      header: t('receivables.columns.pending', 'Pendiente'),
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

  return (
    <ReceivablesPageLayout
      title={t('receivables.overdue.title', 'Cuentas vencidas')}
      subtitle={t(
        'receivables.overdue.subtitle',
        'Saldos con vencimiento anterior a hoy, ordenados por días vencidos.',
      )}
      actions={<ReceivablesRefreshButton />}
    >
      <SectionCard
        title={t('receivables.overdue.summaryTitle', 'Resumen de vencidas')}
        description={t(
          'receivables.overdue.summarySubtitle',
          'Totales del set completo, no de la página visible.',
        )}
        testId="receivables-overdue-summary"
      >
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<PanelSkeleton rows={4} testId="receivables-overdue-summary-skeleton" />}
        >
          <ReceivablesKpiLedger items={kpiItems} testId="receivables-overdue-kpis" />
        </QueryBoundary>
        <p className="mt-md text-body-sm text-on-surface-deep">
          {t(
            'receivables.overdue.note',
            'Vencida = vencimiento anterior a hoy. Alta prioridad = más de 60 días vencidos.',
          )}
        </p>
      </SectionCard>

      <TableCard
        title={t('receivables.overdue.tableTitle', 'Listado de vencidas')}
        description={t(
          'receivables.overdue.tableSubtitle',
          'Orden fijo por días vencidos (descendente), 10 filas por página.',
        )}
        testId="receivables-overdue-card"
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
          skeleton={<TableSkeleton rows={6} testId="receivables-overdue-skeleton" />}
        >
          <ReceivablesTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            testId="receivables-overdue"
            minWidthClass="min-w-[980px]"
            dense
            caption={t('receivables.overdue.tableTitle', 'Listado de vencidas')}
            empty={
              <TableEmptyState
                icon={ShieldCheck}
                title={t('receivables.overdue.empty', 'Sin cuentas vencidas')}
                description={t(
                  'receivables.overdue.emptyHint',
                  'Todas las cuentas están al día con su vencimiento.',
                )}
              />
            }
          />
        </QueryBoundary>
      </TableCard>
    </ReceivablesPageLayout>
  )
}

export default OverdueReceivablesPage
