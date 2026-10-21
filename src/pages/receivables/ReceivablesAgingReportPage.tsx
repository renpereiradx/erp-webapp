import { useState } from 'react'
import { AlertTriangle, CircleHelp, FileSearch, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import {
  AgingBucketsPanel,
  ReceivablesKpiLedger,
  ReceivablesPageLayout,
  ReceivablesRefreshButton,
  ReceivablesTable,
  useReceivablesAgingReport,
  type ClientAgingRow,
  type ReceivablesColumn,
  type ReceivablesKpiItem,
  type ReceivablesKpiTone,
} from '@/features/receivables'
import { hasUnclassifiedClientAging } from '@/domain/receivables/aging'
import { RECEIVABLES_PAGE_SIZE } from '@/domain/receivables/constants'
import { formatDateTime, formatMoney } from '@/domain/receivables/format'
import { buildAgingKpis, formatKpiValue } from '@/domain/receivables/kpis'
import type { ReceivablesKpiValue } from '@/domain/receivables/kpis'

interface KpiMeta {
  icon: LucideIcon
  tone: ReceivablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const AGING_META: Record<string, KpiMeta> = {
  agingTotal: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'receivables.agingReport.kpis.total',
    label: 'Cartera total',
    hintKey: 'receivables.agingReport.hints.total',
    hint: 'Saldo pendiente total del set completo',
  },
  agingClients: {
    icon: Users,
    tone: 'secondary',
    labelKey: 'receivables.agingReport.kpis.clients',
    label: 'Clientes con saldo',
    hintKey: 'receivables.agingReport.hints.clients',
    hint: 'Clientes del set completo, no de la página',
  },
  agingOver90: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'receivables.agingReport.kpis.over90',
    label: 'Más de 90 días',
    hintKey: 'receivables.agingReport.hints.over90',
    hint: 'Saldo con más de 90 días desde la venta',
  },
  agingUnclassified: {
    icon: CircleHelp,
    tone: 'warning',
    labelKey: 'receivables.agingReport.kpis.unclassified',
    label: 'Sin clasificar',
    hintKey: 'receivables.agingReport.hints.unclassified',
    hint: 'Monto que la suma de tramos no cubre',
  },
}

/**
 * F7 — Reporte de antigüedad. by_client está paginado server-side con totales
 * globales (T9); los tramos y la cartera son del set completo. La antigüedad se
 * mide en días desde la venta (definición del BE), no desde el vencimiento.
 */
const ReceivablesAgingReportPage = () => {
  const { t, lang } = useI18n()
  const [page, setPage] = useState(1)
  const query = useReceivablesAgingReport(page)

  const errorTitle = t('receivables.errors.title', 'No se pudieron cargar los datos')
  const view = query.data
  const report = view?.report
  const rows = view?.rows ?? []
  const totalPages = Math.max(
    1,
    Math.ceil((report?.total_clients ?? 0) / RECEIVABLES_PAGE_SIZE),
  )
  const showUnclassified = hasUnclassifiedClientAging(rows) || (view?.unclassifiedAmount ?? 0) > 0

  const kpiItems: ReceivablesKpiItem[] = report
    ? buildAgingKpis(report).map((row: ReceivablesKpiValue) => {
        const meta = AGING_META[row.id]
        return {
          id: row.id,
          icon: meta.icon,
          tone: meta.tone,
          label: t(meta.labelKey, meta.label),
          hint: t(meta.hintKey, meta.hint),
          value: formatKpiValue(row, lang),
        }
      })
    : []

  const money = (value: number) => formatMoney(value)

  const columns: Array<ReceivablesColumn<ClientAgingRow>> = [
    {
      key: 'client',
      header: t('receivables.columns.client', 'Cliente'),
      render: (row) => (
        <Link
          to={`/receivables/client-profile/${encodeURIComponent(row.client_id)}`}
          className='text-primary hover:underline'
        >
          {row.client_name || row.client_id}
        </Link>
      ),
    },
    {
      key: 'current',
      align: 'right',
      header: t('receivables.aging.current', '0-30 días'),
      render: (row) => money(row.current),
    },
    {
      key: 'days30_60',
      align: 'right',
      header: t('receivables.aging.days30_60', '31-60 días'),
      render: (row) => money(row.days_30_60),
    },
    {
      key: 'days60_90',
      align: 'right',
      header: t('receivables.aging.days60_90', '61-90 días'),
      render: (row) => money(row.days_60_90),
    },
    {
      key: 'over90',
      align: 'right',
      header: t('receivables.aging.over90', 'Más de 90 días'),
      render: (row) => money(row.over_90_days),
    },
    ...(showUnclassified
      ? [
          {
            key: 'unclassified',
            align: 'right' as const,
            header: t('receivables.aging.unclassifiedColumn', 'Sin clasificar'),
            render: (row: ClientAgingRow) => money(row.unclassified),
          },
        ]
      : []),
    {
      key: 'total',
      align: 'right',
      header: t('receivables.columns.total', 'Total'),
      render: (row) => (
        <span className='font-data-mono text-body-md-bold text-foreground'>{money(row.total)}</span>
      ),
    },
  ]

  return (
    <ReceivablesPageLayout
      title={t('receivables.agingReport.title', 'Reporte de antigüedad')}
      subtitle={t(
        'receivables.agingReport.subtitle',
        'Tramos por días desde la venta, con el detalle por cliente.',
      )}
      actions={<ReceivablesRefreshButton />}
    >
      <SectionCard
        title={t('receivables.agingReport.summaryTitle', 'Resumen de cartera')}
        description={t(
          'receivables.agingReport.summarySubtitle',
          'La antigüedad se mide en días desde la fecha de venta, no desde el vencimiento.',
        )}
        testId='receivables-aging-summary'
      >
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<PanelSkeleton rows={3} testId='receivables-aging-summary-skeleton' />}
        >
          <ReceivablesKpiLedger items={kpiItems} testId='receivables-aging-kpis' />
          {report ? (
            <p className='mt-md text-body-sm text-on-surface-deep'>
              {t('receivables.agingReport.generatedAt', 'Generado el {date}', {
                date: formatDateTime(report.generated_at, lang),
              })}
            </p>
          ) : null}
        </QueryBoundary>
      </SectionCard>

      <SectionCard
        title={t('receivables.agingReport.bucketsTitle', 'Tramos de antigüedad')}
        description={t(
          'receivables.agingReport.bucketsSubtitle',
          'Monto, cuentas y participación de cada tramo sobre la cartera.',
        )}
        testId='receivables-aging-buckets'
      >
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<PanelSkeleton rows={4} testId='receivables-aging-buckets-skeleton' />}
        >
          <AgingBucketsPanel
            rows={view?.summaryRows ?? []}
            unclassifiedAmount={view?.unclassifiedAmount ?? 0}
            layout='grid'
          />
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('receivables.agingReport.byClientTitle', 'Detalle por cliente')}
        description={t(
          'receivables.agingReport.byClientSubtitle',
          'Ordenado por saldo total descendente; 10 clientes por página.',
        )}
        testId='receivables-aging-report-card'
        footer={
          report && report.total_clients > 0 ? (
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={report.total_clients}
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
          skeleton={<TableSkeleton rows={6} testId='receivables-aging-report-skeleton' />}
        >
          <ReceivablesTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.client_id}
            testId='receivables-aging-report'
            minWidthClass='min-w-[980px]'
            dense
            caption={t('receivables.agingReport.byClientTitle', 'Detalle por cliente')}
            empty={
              <TableEmptyState
                icon={FileSearch}
                title={t('receivables.agingReport.empty', 'Sin cartera pendiente')}
                description={t(
                  'receivables.agingReport.emptyHint',
                  'No hay cuentas con saldo para reportar.',
                )}
              />
            }
          />
        </QueryBoundary>
      </TableCard>
    </ReceivablesPageLayout>
  )
}

export default ReceivablesAgingReportPage
