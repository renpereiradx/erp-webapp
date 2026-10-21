import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { SupplierPayablesSummary } from '@/types/bi'
import { formatCount, formatMoney } from '@/domain/payables/format'
import { PayablesBehaviorBadge } from './PayablesBadges'
import { PayablesTable, type PayablesColumn } from './PayablesTable'

/**
 * Proveedores con mayor deuda a hoy. `payment_history` de este endpoint se
 * deriva de la proporción vencida (no del historial de pagos de la ficha), y
 * la columna lo dice en la descripción de la card.
 */
export const TopSuppliersTable = ({ suppliers }: { suppliers: SupplierPayablesSummary[] }) => {
  const { t } = useI18n()

  const columns: Array<PayablesColumn<SupplierPayablesSummary>> = [
    {
      key: 'supplier',
      header: t('payables.columns.supplier', 'Proveedor'),
      render: (row) => (
        <div className="flex flex-col">
          <Link
            to={`/payables/suppliers/${encodeURIComponent(row.supplier_id)}/analysis`}
            className="text-primary hover:underline"
          >
            {row.supplier_name || row.supplier_id}
          </Link>
          <span className="text-body-sm text-on-surface-deep">
            {t('payables.topSuppliers.accounts', 'Cuentas: {count}', {
              count: formatCount(row.pending_count),
            })}
          </span>
          <span className="mt-xs">
            <PayablesBehaviorBadge history={row.payment_history} />
          </span>
        </div>
      ),
    },
    {
      key: 'pending',
      align: 'right',
      header: t('payables.columns.pending', 'Pendiente'),
      render: (row) => formatMoney(row.total_pending),
    },
    {
      key: 'overdue',
      align: 'right',
      header: t('payables.columns.overdue', 'Vencido'),
      render: (row) => formatMoney(row.total_overdue),
    },
  ]

  return (
    <PayablesTable
      columns={columns}
      rows={suppliers}
      rowKey={(row) => row.supplier_id}
      minWidthClass="min-w-[420px]"
      testId="payables-top-suppliers"
      caption={t('payables.topSuppliers.caption', 'Proveedores con mayor deuda pendiente')}
      empty={
        <TableEmptyState
          icon={Building2}
          title={t('payables.topSuppliers.empty', 'Sin proveedores con deuda')}
          description={t(
            'payables.topSuppliers.emptyHint',
            'No hay cuentas por pagar pendientes a hoy.',
          )}
        />
      }
    />
  )
}

export default TopSuppliersTable
