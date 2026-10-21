import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import type { Payable } from '@/types/bi'
import { formatDate, formatMoney } from '@/domain/payables/format'
import { PayablesPriorityBadge, PayablesStatusBadge } from './PayablesBadges'

interface PayablesSummaryPanelProps {
  payable: Payable
  locale?: string
}

/**
 * Resumen de una cuenta por pagar: montos, estado y fechas del contrato.
 * El vencimiento que muestra es el del BE (compra + 30 días), no una fecha
 * contractual; los días vencidos/pendientes también vienen calculados.
 */
export const PayablesSummaryPanel = ({ payable, locale }: PayablesSummaryPanelProps) => {
  const { t } = useI18n()

  const rows = [
    {
      label: t('payables.detail.original', 'Monto original'),
      value: formatMoney(payable.original_amount),
    },
    {
      label: t('payables.detail.paid', 'Pagado'),
      value: formatMoney(payable.paid_amount),
    },
    {
      label: t('payables.detail.pending', 'Pendiente'),
      value: formatMoney(payable.pending_amount),
    },
  ]

  return (
    <div className="space-y-lg" data-testid="payables-summary-panel">
      <dl className="grid gap-md sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-md bg-surface-muted p-md">
            <dt className="text-label-caps uppercase text-on-surface-deep">{row.label}</dt>
            <dd className="mt-xs whitespace-nowrap font-data-mono text-title-md text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-sm">
        <PayablesStatusBadge status={payable.status} />
        <PayablesPriorityBadge priority={payable.priority} />
      </div>

      <dl className="grid gap-sm text-body-md sm:grid-cols-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
          <dt className="text-on-surface-deep">{t('payables.detail.supplier', 'Proveedor')}</dt>
          <dd>
            <Link
              to={`/payables/suppliers/${encodeURIComponent(payable.supplier_id)}/analysis`}
              className="text-primary hover:underline"
            >
              {payable.supplier_name || payable.supplier_id}
            </Link>
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
          <dt className="text-on-surface-deep">{t('payables.detail.purchaseDate', 'Compra')}</dt>
          <dd className="font-data-mono text-data-mono">
            {formatDate(payable.purchase_date, locale)}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
          <dt className="text-on-surface-deep">{t('payables.detail.dueDate', 'Vencimiento')}</dt>
          <dd className="font-data-mono text-data-mono">
            {formatDate(payable.due_date, locale)}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
          <dt className="text-on-surface-deep">
            {t('payables.detail.daysStatus', 'Días vencidos / por vencer')}
          </dt>
          <dd className="font-data-mono text-data-mono">
            {payable.days_overdue > 0
              ? t('payables.detail.daysOverdue', '{days} vencidos', {
                  days: payable.days_overdue,
                })
              : t('payables.detail.daysUntilDue', '{days} por vencer', {
                  days: payable.days_until_due,
                })}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
          <dt className="text-on-surface-deep">{t('payables.detail.order', 'Orden de compra')}</dt>
          <dd className="font-data-mono text-data-mono">{payable.purchase_order_id}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
          <dt className="text-on-surface-deep">{t('payables.detail.currency', 'Moneda')}</dt>
          <dd className="font-data-mono text-data-mono">{payable.currency}</dd>
        </div>
      </dl>
    </div>
  )
}

export default PayablesSummaryPanel
