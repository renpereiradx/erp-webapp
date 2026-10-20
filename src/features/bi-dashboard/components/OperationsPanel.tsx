import { CalendarClock, CircleDollarSign, CreditCard, Package, Wallet } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { DashboardSummary } from '@/types/bi'
import { KpiCard } from './KpiCard'

/** Operación diaria: inventario, cajas, CxC, CxP y reservas (de /summary). */
export const OperationsPanel = ({ summary }: { summary: DashboardSummary }) => {
  const { t } = useI18n()

  return (
    <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        compact
        icon={Package}
        label={t('dashboard.summary.operations.inventory', 'Inventario')}
        value={formatPYG(summary.inventory.total_value)}
        hint={t('dashboard.summary.operations.inventoryHint', '{low} bajo stock · {out} sin stock', {
          low: formatNumber(summary.inventory.low_stock_count, 0),
          out: formatNumber(summary.inventory.out_of_stock_count, 0),
        })}
      />
      <KpiCard
        compact
        icon={Wallet}
        label={t('dashboard.summary.operations.cash', 'Caja')}
        value={formatPYG(summary.cash_registers.total_balance)}
        hint={t('dashboard.summary.operations.cashHint', '{count} cajas abiertas', {
          count: formatNumber(summary.cash_registers.open_count, 0),
        })}
      />
      <KpiCard
        compact
        icon={CircleDollarSign}
        label={t('dashboard.summary.operations.receivables', 'Cuentas por cobrar')}
        value={formatPYG(summary.receivables.total_pending)}
        hint={t('dashboard.summary.operations.receivablesHint', '{count} cuentas vencidas', {
          count: formatNumber(summary.receivables.overdue_count, 0),
        })}
      />
      <KpiCard
        compact
        icon={CreditCard}
        label={t('dashboard.summary.operations.payables', 'Cuentas por pagar')}
        value={formatPYG(summary.payables.total_pending)}
        hint={t('dashboard.summary.operations.payablesHint', '{amount} vence esta semana', {
          amount: formatPYG(summary.payables.due_this_week),
        })}
      />
      <KpiCard
        compact
        icon={CalendarClock}
        label={t('dashboard.summary.operations.reserves', 'Reservas hoy')}
        value={formatNumber(summary.reserves.today_count, 0)}
        hint={t('dashboard.summary.operations.reservesHint', '{count} por confirmar', {
          count: formatNumber(summary.reserves.pending_confirmation, 0),
        })}
      />
    </div>
  )
}
