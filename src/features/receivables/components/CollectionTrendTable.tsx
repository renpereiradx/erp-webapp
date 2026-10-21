import { BarChart3 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { CollectionTrendRow } from '@/domain/receivables/collection'
import { formatMoney, formatSignedMoney, formatUtcDate } from '@/domain/receivables/format'
import { ReceivablesTable, type ReceivablesColumn } from './ReceivablesTable'

interface CollectionTrendTableProps {
  rows: CollectionTrendRow[]
  locale?: string
}

/**
 * Serie semanal de facturación/cobranza. `balance` es el acumulado
 * facturado − cobrado del BE (puede ser negativo); no es una deuda.
 */
export const CollectionTrendTable = ({ rows, locale }: CollectionTrendTableProps) => {
  const { t } = useI18n()

  const columns: Array<ReceivablesColumn<CollectionTrendRow>> = [
    {
      key: 'week',
      mono: true,
      header: t('receivables.columns.week', 'Semana'),
      render: (row) => formatUtcDate(row.date, locale),
    },
    {
      key: 'billed',
      align: 'right',
      header: t('receivables.columns.billed', 'Facturado'),
      render: (row) => formatMoney(row.billed),
    },
    {
      key: 'collected',
      align: 'right',
      header: t('receivables.columns.collected', 'Cobrado'),
      render: (row) => formatMoney(row.collected),
    },
    {
      key: 'balance',
      align: 'right',
      header: t('receivables.columns.balance', 'Diferencia acumulada'),
      render: (row) => formatSignedMoney(row.balance),
    },
  ]

  return (
    <ReceivablesTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.date}
      testId="receivables-collection-trend"
      minWidthClass="min-w-[560px]"
      caption={t('receivables.dashboard.trendTitle', 'Serie semanal de cobranza')}
      empty={
        <TableEmptyState
          icon={BarChart3}
          title={t('receivables.dashboard.trendEmpty', 'Sin movimientos semanales en el período')}
          description={t(
            'receivables.dashboard.trendEmptyHint',
            'Probá con otro período o verificá las ventas registradas.',
          )}
        />
      }
    />
  )
}

export default CollectionTrendTable
