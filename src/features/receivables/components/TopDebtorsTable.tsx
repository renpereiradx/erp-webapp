import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { ClientReceivablesSummary } from '@/types/bi'
import { formatCount, formatMoney } from '@/domain/receivables/format'
import { paymentBehaviorKey } from '@/domain/receivables/risk'
import { ReceivablesTable, type ReceivablesColumn } from './ReceivablesTable'
import { ReceivablesBehaviorBadge } from './ReceivablesBehaviorBadge'

interface TopDebtorsTableProps {
  rows: ClientReceivablesSummary[]
}

/**
 * Principales deudores a hoy (sin período). El comportamiento lo deriva el BE
 * de la proporción vencida — distinto del perfil de cliente, que lo deriva de
 * los días promedio de pago; la card lo explica en su descripción.
 */
export const TopDebtorsTable = ({ rows }: TopDebtorsTableProps) => {
  const { t } = useI18n()

  const columns: Array<ReceivablesColumn<ClientReceivablesSummary>> = [
    {
      key: 'client',
      header: t('receivables.columns.client', 'Cliente'),
      render: (row) => (
        <Link
          to={`/receivables/client-profile/${encodeURIComponent(row.client_id)}`}
          className="text-primary hover:underline"
        >
          {row.client_name || row.client_id}
        </Link>
      ),
    },
    {
      key: 'pending',
      align: 'right',
      header: t('receivables.columns.pending', 'Pendiente'),
      render: (row) => formatMoney(row.total_pending),
    },
    {
      key: 'overdue',
      align: 'right',
      header: t('receivables.columns.overdue', 'Vencido'),
      render: (row) => formatMoney(row.total_overdue),
    },
    {
      key: 'accounts',
      align: 'right',
      header: t('receivables.columns.accounts', 'Cuentas'),
      render: (row) => formatCount(row.pending_count),
    },
    {
      key: 'behavior',
      header: t('receivables.columns.behavior', 'Comportamiento'),
      render: (row) =>
        paymentBehaviorKey(row.payment_behavior) ? (
          <ReceivablesBehaviorBadge behavior={row.payment_behavior} />
        ) : (
          '—'
        ),
    },
  ]

  return (
    <ReceivablesTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.client_id}
      testId="receivables-top-debtors"
      minWidthClass="min-w-[640px]"
      caption={t('receivables.dashboard.topDebtorsTitle', 'Principales deudores')}
      empty={
        <TableEmptyState
          icon={Users}
          title={t('receivables.dashboard.topDebtorsEmpty', 'Sin deudores pendientes')}
          description={t(
            'receivables.dashboard.topDebtorsEmptyHint',
            'Todas las cuentas están saldadas.',
          )}
        />
      }
    />
  )
}

export default TopDebtorsTable
