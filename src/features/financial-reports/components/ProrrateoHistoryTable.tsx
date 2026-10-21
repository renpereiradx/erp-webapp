import { Scale } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatMoney, formatPercent } from '@/domain/finance/format'
import type { ProrrateoRow } from '@/domain/finance/prorrateo'
import { FinanceTable, type FinanceColumn } from './FinanceTable'
import { ProrrateoStatusBadge } from './Badges'

interface ProrrateoHistoryTableProps {
  rows: ProrrateoRow[]
  selectedId: number | null
  onSelect: (id: number) => void
}

/** Historial de prorrateos de IVA; el detalle se carga bajo demanda. */
export const ProrrateoHistoryTable = ({
  rows,
  selectedId,
  onSelect,
}: ProrrateoHistoryTableProps) => {
  const { t } = useI18n()
  const columns: Array<FinanceColumn<ProrrateoRow>> = [
    {
      key: 'period',
      header: t('finance.prorrateo.period', 'Período'),
      render: (row) => `${row.periodStart.slice(0, 10)} – ${row.periodEnd.slice(0, 10)}`,
    },
    {
      key: 'sales',
      align: 'right',
      header: t('finance.prorrateo.sales', 'Ventas'),
      render: (row) => formatMoney(row.totalSales),
    },
    {
      key: 'coefficient',
      align: 'right',
      header: t('finance.prorrateo.coefficient', 'Coeficiente'),
      render: (row) => formatPercent(row.coefficientPct),
    },
    {
      key: 'credit',
      align: 'right',
      header: t('finance.prorrateo.credit', 'Crédito IVA'),
      render: (row) => formatMoney(row.totalVatCredit),
    },
    {
      key: 'deductible',
      align: 'right',
      header: t('finance.prorrateo.deductible', 'Deducible'),
      render: (row) => formatMoney(row.deductible),
    },
    {
      key: 'status',
      header: t('finance.common.status', 'Estado'),
      render: (row) => <ProrrateoStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('finance.common.actions', 'Acciones'),
      render: (row) => (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onSelect(row.id)}
          aria-pressed={selectedId === row.id}
          data-testid={`finance-prorrateo-select-${row.id}`}
        >
          {selectedId === row.id
            ? t('finance.prorrateo.selected', 'Seleccionado')
            : t('finance.prorrateo.viewDetail', 'Ver detalle')}
        </Button>
      ),
    },
  ]

  return (
    <FinanceTable
      columns={columns}
      rows={rows}
      rowKey={(row) => String(row.id)}
      minWidthClass="min-w-[820px]"
      dense
      testId="finance-prorrateo-table"
      caption={t('finance.prorrateo.caption', 'Períodos de prorrateo de IVA')}
      empty={
        <TableEmptyState
          icon={Scale}
          title={t('finance.prorrateo.empty', 'Sin prorrateos registrados')}
          description={t(
            'finance.prorrateo.emptyHint',
            'El historial de prorrateo de IVA está vacío para esta instalación.',
          )}
        />
      }
    />
  )
}

export default ProrrateoHistoryTable
