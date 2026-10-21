import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  FileQuestion,
  ListChecks,
  Percent,
  Timer,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import type { Payable } from '@/types/bi'
import {
  PayablesBehaviorBadge,
  PayablesImportanceBadge,
  PayablesKpiLedger,
  PayablesPageLayout,
  PayablesPriorityBadge,
  PayablesRefreshButton,
  PayablesStatusBadge,
  PayablesTable,
  useSupplierAnalysis,
  useSupplierInvoices,
  type PayablesColumn,
  type PayablesKpiItem,
  type PayablesKpiTone,
} from '@/features/payables'
import { isNotFoundError } from '@/domain/payables/errors'
import {
  formatDate,
  formatDays,
  formatMoney,
  formatPercent,
} from '@/domain/payables/format'
import { buildSupplierKpis, formatKpiValue } from '@/domain/payables/overview'
import type { PayablesKpiValue } from '@/domain/payables/overview'
import {
  supplierOldestDebtAge,
  supplierOverdueShare,
} from '@/domain/payables/suppliers'

interface KpiMeta {
  icon: LucideIcon
  tone: PayablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const SUPPLIER_META: Record<string, KpiMeta> = {
  supplierPending: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'payables.supplier.kpis.pending',
    label: 'Saldo pendiente',
    hintKey: 'payables.supplier.hints.pending',
    hint: 'Cuentas con saldo a hoy',
  },
  supplierOverdue: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'payables.supplier.kpis.overdue',
    label: 'Saldo vencido',
    hintKey: 'payables.supplier.hints.overdue',
    hint: 'Vencimiento anterior a hoy',
  },
  supplierPendingCount: {
    icon: ListChecks,
    tone: 'secondary',
    labelKey: 'payables.supplier.kpis.count',
    label: 'Cuentas pendientes',
    hintKey: 'payables.supplier.hints.count',
    hint: 'Órdenes con saldo',
  },
  supplierShare: {
    icon: Percent,
    tone: 'warning',
    labelKey: 'payables.supplier.kpis.share',
    label: 'Participación en CxP',
    hintKey: 'payables.supplier.hints.share',
    hint: 'Peso del saldo del proveedor sobre el total',
  },
  supplierAvgDays: {
    icon: Timer,
    tone: 'neutral',
    labelKey: 'payables.supplier.kpis.avgDays',
    label: 'Días hasta el pago',
    hintKey: 'payables.supplier.hints.avgDays',
    hint: 'Promedio compra → pago de todos sus pagos',
  },
  supplierOldest: {
    icon: CalendarClock,
    tone: 'warning',
    labelKey: 'payables.supplier.kpis.oldest',
    label: 'Deuda más antigua',
    hintKey: 'payables.supplier.hints.oldest',
    hint: 'Fecha de compra de la cuenta más vieja',
  },
}

/**
 * F8 — Análisis de un proveedor. `share_percentage`, `importance`,
 * `payment_history` y `credit_terms` son campos reales del endpoint; el plazo
 * de 30 días es el default del backend y la pantalla lo dice.
 */
const SupplierAnalysisPage = () => {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const analysis = useSupplierAnalysis(id ?? '')
  const invoices = useSupplierInvoices(id ?? '', page)

  const errorTitle = t('payables.errors.title', 'No se pudieron cargar los datos')
  const data = analysis.data
  const notFound = !id || (analysis.error && isNotFoundError(analysis.error))

  const actions = (
    <>
      <Button
        variant='secondary'
        size='md'
        onClick={() => navigate('/payables/invoices')}
        data-testid='payables-supplier-back'
      >
        <ArrowLeft size={16} className='mr-sm' aria-hidden='true' />
        {t('payables.supplier.backToList', 'Volver al listado')}
      </Button>
      <PayablesRefreshButton />
    </>
  )

  const kpiItems: PayablesKpiItem[] = data
    ? buildSupplierKpis(data).map((row: PayablesKpiValue) => {
        const meta = SUPPLIER_META[row.id]
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

  const overdueShare = supplierOverdueShare(data)
  const oldestAge = supplierOldestDebtAge(data)

  const invoiceColumns: Array<PayablesColumn<Payable>> = [
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
      key: 'purchaseDate',
      mono: true,
      header: t('payables.columns.purchaseDate', 'Compra'),
      render: (row) => formatDate(row.purchase_date, lang),
    },
    {
      key: 'dueDate',
      mono: true,
      header: t('payables.columns.dueDate', 'Vence'),
      render: (row) => formatDate(row.due_date, lang),
    },
    {
      key: 'days',
      align: 'right',
      header: t('payables.columns.days', 'Días'),
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
      key: 'pending',
      align: 'right',
      header: t('payables.columns.pending', 'Pendiente'),
      render: (row) => formatMoney(row.pending_amount),
    },
    {
      key: 'status',
      header: t('payables.columns.status', 'Estado'),
      render: (row) => <PayablesStatusBadge status={row.status} />,
    },
  ]

  return (
    <PayablesPageLayout
      title={
        data?.supplier_name
          ? data.supplier_name
          : t('payables.supplier.title', 'Análisis de proveedor')
      }
      subtitle={t(
        'payables.supplier.subtitle',
        'Saldo, comportamiento de pago y facturas pendientes del proveedor.',
      )}
      actions={actions}
    >
      {notFound ? (
        <SectionCard title={t('payables.supplier.title', 'Análisis de proveedor')}>
          <TableEmptyState
            icon={FileQuestion}
            title={t('payables.supplier.notFoundTitle', 'Proveedor no encontrado')}
            description={t(
              'payables.supplier.notFoundMessage',
              'El proveedor {id} no existe o no pertenece a la sucursal activa.',
              { id: id ?? '—' },
            )}
          />
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-lg xl:grid-cols-2">
            <SectionCard
              title={t('payables.supplier.summaryTitle', 'Resumen del proveedor')}
              description={t(
                'payables.supplier.summaryDescription',
                'Saldos y peso del proveedor dentro de las cuentas por pagar.',
              )}
              testId="payables-supplier-summary"
            >
              <QueryBoundary
                isLoading={analysis.isLoading}
                error={analysis.error}
                errorTitle={errorTitle}
                onRetry={() => void analysis.refetch()}
                skeleton={<PanelSkeleton rows={6} />}
              >
                <PayablesKpiLedger items={kpiItems} testId="payables-supplier-kpis" />
              </QueryBoundary>
            </SectionCard>

            <SectionCard
              title={t('payables.supplier.termsTitle', 'Comportamiento y condiciones')}
              description={t(
                'payables.supplier.termsDescription',
                'Campos reales del análisis: comportamiento, importancia y plazo estándar.',
              )}
              testId="payables-supplier-terms"
            >
              <QueryBoundary
                isLoading={analysis.isLoading}
                error={analysis.error}
                errorTitle={errorTitle}
                onRetry={() => void analysis.refetch()}
                skeleton={<PanelSkeleton rows={5} />}
              >
                {data ? (
                  <dl className="space-y-sm text-body-md">
                    <div className="flex flex-wrap items-center justify-between gap-sm">
                      <dt className="text-on-surface-deep">
                        {t('payables.supplier.behavior', 'Comportamiento de pago')}
                      </dt>
                      <dd>
                        <PayablesBehaviorBadge history={data.payment_history} />
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-sm">
                      <dt className="text-on-surface-deep">
                        {t('payables.supplier.importance', 'Importancia')}
                      </dt>
                      <dd>
                        <PayablesImportanceBadge importance={data.importance} />
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-sm">
                      <dt className="text-on-surface-deep">
                        {t('payables.supplier.overdueShare', 'Proporción vencida')}
                      </dt>
                      <dd className="font-data-mono text-data-mono">
                        {formatPercent(overdueShare)}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-sm">
                      <dt className="text-on-surface-deep">
                        {t('payables.supplier.creditTerms', 'Plazo estándar del sistema')}
                      </dt>
                      <dd className="font-data-mono text-data-mono">
                        {t('payables.supplier.creditTermsValue', '{days} días', {
                          days: data.credit_terms,
                        })}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-sm">
                      <dt className="text-on-surface-deep">
                        {t('payables.supplier.oldestDebt', 'Deuda más antigua')}
                      </dt>
                      <dd className="font-data-mono text-data-mono">
                        {formatDate(data.oldest_debt, lang)}
                        {oldestAge !== null
                          ? ` · ${t('payables.supplier.oldestAge', 'hace {days} días', {
                              days: formatDays(oldestAge),
                            })}`
                          : ''}
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </QueryBoundary>
              <p className="mt-md text-body-sm text-on-surface-deep">
                {t(
                  'payables.supplier.termsNote',
                  'El plazo de 30 días es el valor fijo del backend; no es una condición negociada con el proveedor. La proporción vencida se deriva del saldo pendiente y vencido.',
                )}
              </p>
            </SectionCard>
          </div>

          <TableCard
            title={t('payables.supplier.invoicesTitle', 'Facturas pendientes')}
            description={t(
              'payables.supplier.invoicesDescription',
              'Órdenes de compra del proveedor con saldo, 10 por página.',
            )}
            testId="payables-supplier-invoices-card"
            footer={
              invoices.data?.pagination ? (
                <TablePagination
                  page={invoices.data.pagination.page}
                  totalPages={invoices.data.pagination.total_pages}
                  totalItems={invoices.data.pagination.total_items}
                  onPageChange={setPage}
                />
              ) : null
            }
          >
            <QueryBoundary
              isLoading={invoices.isLoading}
              error={invoices.error}
              errorTitle={errorTitle}
              onRetry={() => void invoices.refetch()}
              skeleton={<TableSkeleton rows={4} />}
            >
              <PayablesTable
                columns={invoiceColumns}
                rows={invoices.data?.items ?? []}
                rowKey={(row) => row.id}
                dense
                minWidthClass="min-w-[860px]"
                testId="payables-supplier-invoices"
                caption={t('payables.supplier.invoicesCaption', 'Facturas pendientes del proveedor')}
                empty={
                  <TableEmptyState
                    icon={Building2}
                    title={t('payables.supplier.invoicesEmpty', 'Sin facturas pendientes')}
                    description={t(
                      'payables.supplier.invoicesEmptyHint',
                      'El proveedor no tiene órdenes de compra con saldo.',
                    )}
                  />
                }
              />
            </QueryBoundary>
          </TableCard>
        </>
      )}
    </PayablesPageLayout>
  )
}

export default SupplierAnalysisPage
