import { CalendarRange } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatMoney, formatSignedMoney, formatUtcDayMonth } from '@/domain/payables/format'
import type { PaymentTrendRow } from '@/domain/payables/statistics'
import { PayablesTable, type PayablesColumn } from './PayablesTable'

/**
 * Serie semanal compras vs pagos del período. `balance` es el acumulado
 * compras − pagos que calcula el BE: se rotula como tal, no como deuda.
 */
export const PaymentTrendTable = ({ rows }: { rows: PaymentTrendRow[] }) => {
  const { t, lang } = useI18n()

  const columns: Array<PayablesColumn<PaymentTrendRow>> = [
    {
      key: 'week',
      header: t('payables.trend.week', 'Semana'),
      render: (row) => formatUtcDayMonth(row.date, lang),
    },
    {
      key: 'purchased',
      align: 'right',
      header: t('payables.trend.purchased', 'Compras'),
      render: (row) => formatMoney(row.purchased),
    },
    {
      key: 'paid',
      align: 'right',
      header: t('payables.trend.paid', 'Pagos'),
      render: (row) => formatMoney(row.paid),
    },
    {
      key: 'balance',
      align: 'right',
      header: t('payables.trend.balance', 'Acumulado'),
      render: (row) => formatSignedMoney(row.balance),
    },
  ]

  return (
    <PayablesTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.date}
      minWidthClass="min-w-[520px]"
      testId="payables-trend-table"
      caption={t('payables.trend.caption', 'Compras y pagos por semana')}
      empty={
        <TableEmptyState
          icon={CalendarRange}
          title={t('payables.trend.empty', 'Sin movimientos en el período')}
          description={t(
            'payables.trend.emptyHint',
            'No hubo compras ni pagos registrados en el rango aplicado.',
          )}
        />
      }
    />
  )
}

export default PaymentTrendTable
