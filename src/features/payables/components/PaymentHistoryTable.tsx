import { CreditCard } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { SupplierPaymentRecord } from '@/types/bi'
import { formatDate, formatMoney } from '@/domain/payables/format'
import { PayablesTable, type PayablesColumn } from './PayablesTable'

/** Pagos no cancelados de una orden de compra (método y usuario real). */
export const PaymentHistoryTable = ({
  payments,
  locale,
}: {
  payments: SupplierPaymentRecord[]
  locale?: string
}) => {
  const { t } = useI18n()

  const columns: Array<PayablesColumn<SupplierPaymentRecord>> = [
    {
      key: 'date',
      mono: true,
      header: t('payables.detail.paymentDate', 'Fecha'),
      render: (row) => formatDate(row.payment_date, locale),
    },
    {
      key: 'method',
      header: t('payables.detail.paymentMethod', 'Método'),
      render: (row) => row.payment_method || '—',
    },
    {
      key: 'reference',
      mono: true,
      header: t('payables.detail.paymentReference', 'Referencia'),
      render: (row) => row.reference || '—',
    },
    {
      key: 'processedBy',
      header: t('payables.detail.paymentProcessedBy', 'Registrado por'),
      render: (row) => row.processed_by || '—',
    },
    {
      key: 'amount',
      align: 'right',
      header: t('payables.detail.paymentAmount', 'Monto'),
      render: (row) => formatMoney(row.amount),
    },
  ]

  return (
    <PayablesTable
      columns={columns}
      rows={payments}
      rowKey={(row) => row.id}
      minWidthClass="min-w-[620px]"
      testId="payables-payment-history"
      caption={t('payables.detail.paymentsCaption', 'Pagos registrados de la orden')}
      empty={
        <TableEmptyState
          icon={CreditCard}
          title={t('payables.detail.noPayments', 'Sin pagos registrados')}
          description={t(
            'payables.detail.noPaymentsHint',
            'La orden todavía no tiene pagos no cancelados.',
          )}
        />
      }
    />
  )
}

export default PaymentHistoryTable
