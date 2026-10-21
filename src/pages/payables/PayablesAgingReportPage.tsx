import { useState } from 'react'
import { Clock, Percent } from 'lucide-react'
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
  PayablesBadge,
  PayablesKpiLedger,
  PayablesPageLayout,
  PayablesRefreshButton,
  PayablesTable,
  usePayablesAgingReport,
  type PayablesColumn,
  type PayablesKpiItem,
  type PayablesKpiTone,
  type SupplierAgingRow,
} from '@/features/payables'
import { buildAgingKpis, formatKpiValue } from '@/domain/payables/overview'
import { supplierAgingRows } from '@/domain/payables/aging'
import { formatCount, formatDateTime, formatMoney } from '@/domain/payables/format'
import type { PayablesKpiValue } from '@/domain/payables/overview'

interface KpiMeta {
  icon: LucideIcon
  tone: PayablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const AGING_META: Record<string, KpiMeta> = {
  agingTotal: {
    icon: Clock,
    tone: 'primary',
    labelKey: 'payables.aging.kpis.total',
    label: 'Deuda total',
    hintKey: 'payables.aging.hints.total',
    hint: 'Total global del aging (no de la página)',
  },
  agingSuppliers: {
    icon: Percent,
    tone: 'secondary',
    labelKey: 'payables.aging.kpis.suppliers',
    label: 'Proveedores',
    hintKey: 'payables.aging.hints.suppliers',
    hint: 'Con deuda pendiente clasificada',
  },
  agingOver90: {
    icon: Clock,
    tone: 'error',
    labelKey: 'payables.aging.kpis.over90',
    label: 'Más de 90 días',
    hintKey: 'payables.aging.hints.over90',
    hint: 'Antigüedad desde la compra',
  },
  agingUnclassified: {
    icon: Percent,
    tone: 'warning',
    labelKey: 'payables.aging.kpis.unclassified',
    label: 'Sin clasificar',
    hintKey: 'payables.aging.hints.unclassified',
    hint: 'Diferencia del total que los tramos no incluyen',
  },
}

const RISK_LABELS: Record<string, { key: string; fallback: string }> = {
  critical: { key: 'payables.aging.riskCritical', fallback: 'Crítico' },
  moderate: { key: 'payables.aging.riskModerate', fallback: 'Moderado' },
  minimal: { key: 'payables.aging.riskMinimal', fallback: 'Mínimo' },
}

const RISK_TONE: Record<string, 'error' | 'warning' | 'success'> = {
  critical: 'error',
  moderate: 'warning',
  minimal: 'success',
}

/**
 * F8 — Reporte de antigüedad por proveedor. El endpoint pagina por proveedor
 * con totales globales (ventanas del SQL); los tramos se miden desde la fecha
 * de compra, no desde el vencimiento.
 */
const PayablesAgingReportPage = () => {
  const { t, lang } = useI18n()
  const [page, setPage] = useState(1)
  const query = usePayablesAgingReport(page)

  const errorTitle = t('payables.errors.title', 'No se pudieron cargar los datos')
  const data = query.data
  const report = data?.report

  const kpiItems: PayablesKpiItem[] = report
    ? buildAgingKpis(report).map((row: PayablesKpiValue) => {
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

  const columns: Array<PayablesColumn<SupplierAgingRow>> = [
    {
      key: 'supplier',
      header: t('payables.columns.supplier', 'Proveedor'),
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
      key: 'current',
      align: 'right',
      header: t('payables.aging.current', '0 – 30 días'),
      render: (row) => formatMoney(row.current),
    },
    {
      key: 'days30to60',
      align: 'right',
      header: t('payables.aging.days30to60', '31 – 60 días'),
      render: (row) => formatMoney(row.days_30_60),
    },
    {
      key: 'days60to90',
      align: 'right',
      header: t('payables.aging.days60to90', '61 – 90 días'),
      render: (row) => formatMoney(row.days_60_90),
    },
    {
      key: 'over90',
      align: 'right',
      header: t('payables.aging.over90', 'Más de 90 días'),
      render: (row) => formatMoney(row.over_90_days),
    },
    {
      key: 'total',
      align: 'right',
      header: t('payables.aging.total', 'Total'),
      render: (row) => formatMoney(row.total),
    },
    {
      key: 'risk',
      header: t('payables.aging.risk', 'Riesgo'),
      render: (row) => (
        <PayablesBadge tone={RISK_TONE[row.risk]} testId={`payables-aging-risk-${row.risk}`}>
          {t(RISK_LABELS[row.risk].key, RISK_LABELS[row.risk].fallback)}
        </PayablesBadge>
      ),
    },
  ]

  return (
    <PayablesPageLayout
      title={t('payables.aging.title', 'Reporte de antigüedad')}
      subtitle={t(
        'payables.aging.subtitle',
        'Antigüedad medida desde la fecha de compra (no desde el vencimiento).',
      )}
      range={
        report?.generated_at
          ? t('payables.aging.generatedAt', 'Generado: {date}', {
              date: formatDateTime(report.generated_at, lang),
            })
          : undefined
      }
      actions={<PayablesRefreshButton />}
    >
      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('payables.aging.summaryTitle', 'Resumen del aging')}
          description={t(
            'payables.aging.summaryDescription',
            'Totales globales del reporte. Los porcentajes son del total clasificado.',
          )}
          testId="payables-aging-summary"
        >
          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            errorTitle={errorTitle}
            onRetry={() => void query.refetch()}
            skeleton={<PanelSkeleton rows={4} />}
          >
            <PayablesKpiLedger items={kpiItems} testId="payables-aging-kpis" />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('payables.aging.distributionTitle', 'Distribución por tramos')}
          description={t(
            'payables.aging.distributionDescription',
            'Cada tramo muestra su monto y su participación sobre el total clasificado.',
          )}
          testId="payables-aging-distribution"
        >
          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            errorTitle={errorTitle}
            onRetry={() => void query.refetch()}
            skeleton={<PanelSkeleton rows={4} />}
          >
            {report ? <AgingBucketsPanel summary={report.summary} /> : null}
          </QueryBoundary>
        </SectionCard>
      </div>

      <TableCard
        title={t('payables.aging.tableTitle', 'Desglose por proveedor')}
        description={t(
          'payables.aging.tableDescription',
          'El reporte pagina por proveedor; los totales de arriba son globales y la suma de la página puede ser menor.',
        )}
        testId="payables-aging-table-card"
        footer={
          data?.pagination ? (
            <TablePagination
              page={data.pagination.page}
              totalPages={data.pagination.total_pages}
              totalItems={data.pagination.total_items}
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
          skeleton={<TableSkeleton rows={6} />}
        >
          <PayablesTable
            columns={columns}
            rows={supplierAgingRows(data?.suppliers)}
            rowKey={(row) => row.supplier_id}
            dense
            minWidthClass="min-w-[900px]"
            testId="payables-aging-table"
            caption={t('payables.aging.caption', 'Antigüedad de la deuda por proveedor')}
            empty={
              <TableEmptyState
                icon={Clock}
                title={t('payables.aging.empty', 'Sin proveedores con deuda')}
                description={t(
                  'payables.aging.emptyHint',
                  'No hay cuentas por pagar pendientes para clasificar.',
                )}
              />
            }
          />
        </QueryBoundary>
        <p className="px-md pb-md text-body-sm text-on-surface-deep">
          {t('payables.aging.footnote', 'Proveedores en el reporte: {count}', {
            count: formatCount(report?.total_suppliers),
          })}
        </p>
      </TableCard>
    </PayablesPageLayout>
  )
}

export default PayablesAgingReportPage
