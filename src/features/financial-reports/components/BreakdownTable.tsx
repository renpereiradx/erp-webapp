import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { LucideIcon } from 'lucide-react'
import { formatMoney, formatPercent } from '@/domain/finance/format'
import { FinanceTable, type FinanceColumn } from './FinanceTable'

export interface BreakdownRow {
  id: string
  name: string
  amount: number | null
  percentage: number | null
}

interface BreakdownTableProps {
  rows: BreakdownRow[]
  nameHeader: string
  empty: { icon: LucideIcon; title: string; description?: string }
  testId: string
  caption?: string
}

/** Desglose (categorías / medios de pago) con monto y participación del BE. */
export const BreakdownTable = ({
  rows,
  nameHeader,
  empty,
  testId,
  caption,
}: BreakdownTableProps) => {
  const { t } = useI18n()
  const columns: Array<FinanceColumn<BreakdownRow>> = [
    {
      key: 'name',
      header: nameHeader,
      render: (row) => row.name,
    },
    {
      key: 'amount',
      align: 'right',
      header: t('finance.common.amount', 'Monto'),
      render: (row) => formatMoney(row.amount),
    },
    {
      key: 'percentage',
      align: 'right',
      header: t('finance.common.share', 'Participación'),
      render: (row) => formatPercent(row.percentage),
    },
  ]

  return (
    <FinanceTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      minWidthClass="min-w-[420px]"
      testId={testId}
      caption={caption}
      empty={<TableEmptyState icon={empty.icon} title={empty.title} description={empty.description} />}
    />
  )
}

export default BreakdownTable
