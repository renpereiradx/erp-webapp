import { CalendarClock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatMoney, formatSignedMoney, formatUtcDayMonth } from '@/domain/finance/format'
import type { DailyCashFlowRow } from '@/domain/finance/cashFlow'
import { FinanceTable, type FinanceColumn } from './FinanceTable'

/** Desglose diario de caja: cobros y pagos por fecha de pago. */
export const DailyCashFlowTable = ({ rows }: { rows: DailyCashFlowRow[] }) => {
  const { t, lang } = useI18n()
  const columns: Array<FinanceColumn<DailyCashFlowRow>> = [
    {
      key: 'date',
      header: t('finance.cashFlow.day', 'Día'),
      render: (row) => formatUtcDayMonth(row.date, lang),
    },
    {
      key: 'inflows',
      align: 'right',
      header: t('finance.cashFlow.inflows', 'Cobros'),
      render: (row) => formatMoney(row.inflows),
    },
    {
      key: 'outflows',
      align: 'right',
      header: t('finance.cashFlow.outflows', 'Pagos'),
      render: (row) => formatMoney(row.outflows),
    },
    {
      key: 'net',
      align: 'right',
      header: t('finance.cashFlow.net', 'Neto'),
      render: (row) => formatSignedMoney(row.net_flow),
    },
    {
      key: 'balance',
      align: 'right',
      header: t('finance.cashFlow.balance', 'Saldo'),
      render: (row) => formatSignedMoney(row.balance),
    },
  ]

  return (
    <FinanceTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.date}
      minWidthClass="min-w-[560px]"
      testId="finance-cash-flow-daily"
      caption={t('finance.cashFlow.dailyCaption', 'Movimientos de caja por día')}
      empty={
        <TableEmptyState
          icon={CalendarClock}
          title={t('finance.cashFlow.empty', 'Sin movimientos en la ventana')}
          description={t(
            'finance.cashFlow.emptyHint',
            'No hubo cobros ni pagos con fecha dentro del período.',
          )}
        />
      }
    />
  )
}

export default DailyCashFlowTable
