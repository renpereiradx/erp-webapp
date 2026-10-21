import { CalendarClock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatMoney, formatSignedMoney, formatUtcDayMonth } from '@/domain/payables/format'
import type { CashFlowDayRow } from '@/domain/payables/cashFlow'
import { PayablesTable, type PayablesColumn } from './PayablesTable'

/**
 * Días de la proyección con movimiento. Los días en 0/0 no se listan (el
 * total y el acumulado siguen siendo los del payload). `cumulative_flow` es el
 * acumulado de la ventana que calcula el BE, no un saldo de caja.
 */
export const CashFlowTable = ({ rows }: { rows: CashFlowDayRow[] }) => {
  const { t, lang } = useI18n()

  const columns: Array<PayablesColumn<CashFlowDayRow>> = [
    {
      key: 'date',
      header: t('payables.cashFlow.day', 'Día'),
      render: (row) => formatUtcDayMonth(row.date, lang),
    },
    {
      key: 'inflows',
      align: 'right',
      header: t('payables.cashFlow.inflows', 'Cobros esperados'),
      render: (row) => formatMoney(row.inflows),
    },
    {
      key: 'outflows',
      align: 'right',
      header: t('payables.cashFlow.outflows', 'Pagos esperados'),
      render: (row) => formatMoney(row.outflows),
    },
    {
      key: 'net',
      align: 'right',
      header: t('payables.cashFlow.net', 'Neto'),
      render: (row) => formatSignedMoney(row.net_flow),
    },
    {
      key: 'cumulative',
      align: 'right',
      header: t('payables.cashFlow.cumulative', 'Acumulado'),
      render: (row) => formatSignedMoney(row.cumulative_flow),
    },
  ]

  return (
    <PayablesTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.date}
      minWidthClass="min-w-[620px]"
      testId="payables-cash-flow-table"
      caption={t('payables.cashFlow.caption', 'Proyección diaria de cobros y pagos')}
      empty={
        <TableEmptyState
          icon={CalendarClock}
          title={t('payables.cashFlow.empty', 'Sin movimientos proyectados')}
          description={t(
            'payables.cashFlow.emptyHint',
            'No hay cobros ni pagos esperados por vencimiento en la ventana.',
          )}
        />
      }
    />
  )
}

export default CashFlowTable
