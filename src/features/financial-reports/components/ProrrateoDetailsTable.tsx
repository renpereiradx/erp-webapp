import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { ListChecks } from 'lucide-react'
import { formatMoney } from '@/domain/finance/format'
import type { ProrrateoDetailRow } from '@/domain/finance/prorrateo'
import { FinanceTable, type FinanceColumn } from './FinanceTable'
import { AllocationBadge } from './Badges'

/** Detalle por compra de un período de prorrateo (porciones del crédito IVA). */
export const ProrrateoDetailsTable = ({ rows }: { rows: ProrrateoDetailRow[] }) => {
  const { t } = useI18n()
  const columns: Array<FinanceColumn<ProrrateoDetailRow>> = [
    {
      key: 'order',
      mono: true,
      header: t('finance.prorrateo.purchaseOrder', 'Orden de compra'),
      render: (row) => String(row.purchase_order_id),
    },
    {
      key: 'original',
      align: 'right',
      header: t('finance.prorrateo.originalCredit', 'Crédito original'),
      render: (row) => formatMoney(row.original_vat_credit),
    },
    {
      key: 'deductible',
      align: 'right',
      header: t('finance.prorrateo.deductible', 'Deducible'),
      render: (row) => formatMoney(row.deductible_portion),
    },
    {
      key: 'nonDeductible',
      align: 'right',
      header: t('finance.prorrateo.nonDeductible', 'No deducible'),
      render: (row) => formatMoney(row.non_deductible_portion),
    },
    {
      key: 'allocation',
      header: t('finance.prorrateo.allocation', 'Asignación'),
      render: (row) => <AllocationBadge type={row.allocation_type} />,
    },
    {
      key: 'notes',
      header: t('finance.common.notes', 'Notas'),
      render: (row) => row.notes || '—',
    },
  ]

  return (
    <FinanceTable
      columns={columns}
      rows={rows}
      rowKey={(row) => String(row.id)}
      minWidthClass="min-w-[760px]"
      dense
      testId="finance-prorrateo-details"
      caption={t('finance.prorrateo.detailsCaption', 'Detalle del prorrateo seleccionado')}
      empty={
        <TableEmptyState
          icon={ListChecks}
          title={t('finance.prorrateo.detailsEmpty', 'Sin compras en el prorrateo')}
          description={t(
            'finance.prorrateo.detailsEmptyHint',
            'El período seleccionado no tiene líneas de detalle.',
          )}
        />
      }
    />
  )
}

export default ProrrateoDetailsTable
