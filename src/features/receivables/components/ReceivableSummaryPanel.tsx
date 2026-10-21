import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import type { Receivable } from '@/types/bi'
import { formatDate, formatMoney } from '@/domain/receivables/format'
import { ReceivablesStatusBadge } from './ReceivablesStatusBadge'
import { ReceivablesPriorityBadge } from './ReceivablesPriorityBadge'

interface ReceivableSummaryPanelProps {
  receivable: Receivable
  locale?: string
}

interface FieldProps {
  label: string
  children: ReactNode
}

const Field = ({ label, children }: FieldProps) => (
  <div>
    <dt className="text-label-caps uppercase text-on-surface-deep">{label}</dt>
    <dd className="mt-xs text-body-md text-foreground">{children}</dd>
  </div>
)

/**
 * Saldos y estado de una cuenta. No se muestra `due_date`: el listado/detalle
 * lo sintetiza como `sale_date + 30 días` y contradiría el `days_overdue` real
 * (que sí usa el vencimiento de la orden). La nota de la card lo explica.
 */
export const ReceivableSummaryPanel = ({
  receivable,
  locale,
}: ReceivableSummaryPanelProps) => {
  const { t } = useI18n()

  return (
    <dl className="grid gap-md sm:grid-cols-2 lg:grid-cols-3" data-testid="receivables-detail-summary">
      <Field label={t('receivables.detail.fields.client', 'Cliente')}>
        <Link
          to={`/receivables/client-profile/${encodeURIComponent(receivable.client_id)}`}
          className="text-primary hover:underline"
        >
          {receivable.client_name || receivable.client_id}
        </Link>
      </Field>
      <Field label={t('receivables.detail.fields.status', 'Estado')}>
        <ReceivablesStatusBadge status={receivable.status} />
      </Field>
      <Field label={t('receivables.detail.fields.saleDate', 'Fecha de venta')}>
        <span className="font-data-mono text-data-mono">
          {formatDate(receivable.sale_date, locale)}
        </span>
      </Field>
      <Field label={t('receivables.detail.fields.daysOverdue', 'Días vencidos')}>
        <span className="inline-flex items-center gap-sm">
          <span className="font-data-mono text-data-mono">{receivable.days_overdue}</span>
          <ReceivablesPriorityBadge daysOverdue={receivable.days_overdue} />
        </span>
      </Field>
      <Field label={t('receivables.detail.fields.original', 'Monto original')}>
        <span className="font-data-mono text-data-mono">
          {formatMoney(receivable.original_amount)}
        </span>
      </Field>
      <Field label={t('receivables.detail.fields.paid', 'Cobrado')}>
        <span className="font-data-mono text-data-mono">{formatMoney(receivable.paid_amount)}</span>
      </Field>
      <Field label={t('receivables.detail.fields.pending', 'Pendiente')}>
        <span className="font-data-mono text-title-md text-foreground">
          {formatMoney(receivable.pending_amount)}
        </span>
      </Field>
    </dl>
  )
}

export default ReceivableSummaryPanel
