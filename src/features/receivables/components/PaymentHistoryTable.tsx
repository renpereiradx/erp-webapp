import { Receipt } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { ReceivablePayment } from '@/types/bi'
import { formatDateTime, formatMoney } from '@/domain/receivables/format'
import { ReceivablesTable, type ReceivablesColumn } from './ReceivablesTable'

interface PaymentHistoryTableProps {
  payments: ReceivablePayment[]
  locale?: string
}

/** Historial de pagos de una cuenta (el BE ya lo devuelve en el detalle). */
export const PaymentHistoryTable = ({ payments, locale }: PaymentHistoryTableProps) => {
  const { t } = useI18n()

  const columns: Array<ReceivablesColumn<ReceivablePayment>> = [
    {
      key: 'date',
      mono: true,
      header: t('receivables.columns.date', 'Fecha'),
      render: (row) => formatDateTime(row.payment_date, locale),
    },
    {
      key: 'amount',
      align: 'right',
      header: t('receivables.columns.amount', 'Monto'),
      render: (row) => formatMoney(row.amount),
    },
    {
      key: 'method',
      header: t('receivables.columns.method', 'Método'),
      render: (row) => row.payment_method || '—',
    },
    {
      key: 'reference',
      mono: true,
      header: t('receivables.columns.reference', 'Referencia'),
      render: (row) => row.reference || '—',
    },
    {
      key: 'processedBy',
      header: t('receivables.columns.processedBy', 'Registrado por'),
      render: (row) => row.processed_by || '—',
    },
  ]

  return (
    <ReceivablesTable
      columns={columns}
      rows={payments}
      rowKey={(row) => row.id || `${row.payment_date}-${row.amount}`}
      testId="receivables-payments"
      minWidthClass="min-w-[680px]"
      caption={t('receivables.detail.paymentsTitle', 'Historial de pagos')}
      empty={
        <TableEmptyState
          icon={Receipt}
          title={t('receivables.detail.paymentsEmpty', 'Sin pagos registrados')}
          description={t(
            'receivables.detail.paymentsEmptyHint',
            'La cuenta todavía no tiene pagos asociados.',
          )}
        />
      }
    />
  )
}

export default PaymentHistoryTable
