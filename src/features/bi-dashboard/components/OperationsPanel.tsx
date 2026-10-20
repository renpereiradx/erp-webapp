import type { LucideIcon } from 'lucide-react'
import { CalendarClock, CircleDollarSign, CreditCard, Package, Wallet } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { DashboardSummary } from '@/types/bi'

type OperationTone = 'primary' | 'success' | 'warning' | 'neutral' | 'secondary'

const TONE_CLASSES: Record<OperationTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-surface-muted text-on-surface-deep',
  secondary: 'bg-secondary/10 text-secondary',
}

interface OperationItem {
  id: string
  icon: LucideIcon
  tone: OperationTone
  label: string
  hint: string
  value: string
}

/**
 * Operación del negocio (inventario, caja, CxC, CxP y reservas).
 *
 * La versión anterior era una grilla de 5 tarjetas KPI dentro de una card de
 * media página: a 1440 px cada tarjeta quedaba en ~90 px y los montos
 * (`Gs. 13.377.100`, `Gs. 6.414.250`) se partían en dos líneas. Este panel
 * usa una lista tipo ledger: label/hint a la izquierda, cifra completa a la
 * derecha, sin depender del ancho de la card.
 */
export const OperationsPanel = ({ summary }: { summary: DashboardSummary }) => {
  const { t } = useI18n()

  const items: OperationItem[] = [
    {
      id: 'inventory',
      icon: Package,
      tone: 'primary',
      label: t('dashboard.summary.operations.inventory', 'Inventario'),
      value: formatPYG(summary.inventory.total_value),
      hint: t(
        'dashboard.summary.operations.inventoryHint',
        'Bajo: {low} · Agotado: {out}',
        {
          low: formatNumber(summary.inventory.low_stock_count, 0),
          out: formatNumber(summary.inventory.out_of_stock_count, 0),
        },
      ),
    },
    {
      id: 'cash',
      icon: Wallet,
      tone: 'success',
      label: t('dashboard.summary.operations.cash', 'Caja'),
      value: formatPYG(summary.cash_registers.total_balance),
      hint: t('dashboard.summary.operations.cashHint', 'Cajas abiertas: {count}', {
        count: formatNumber(summary.cash_registers.open_count, 0),
      }),
    },
    {
      id: 'receivables',
      icon: CircleDollarSign,
      tone: 'warning',
      label: t('dashboard.summary.operations.receivables', 'Cuentas por cobrar'),
      value: formatPYG(summary.receivables.total_pending),
      hint: t('dashboard.summary.operations.receivablesHint', 'Cuentas vencidas: {count}', {
        count: formatNumber(summary.receivables.overdue_count, 0),
      }),
    },
    {
      id: 'payables',
      icon: CreditCard,
      tone: 'neutral',
      label: t('dashboard.summary.operations.payables', 'Cuentas por pagar'),
      value: formatPYG(summary.payables.total_pending),
      hint: t('dashboard.summary.operations.payablesHint', 'Esta semana: {amount}', {
        amount: formatPYG(summary.payables.due_this_week),
      }),
    },
    {
      id: 'reserves',
      icon: CalendarClock,
      tone: 'secondary',
      label: t('dashboard.summary.operations.reserves', 'Reservas hoy'),
      value: formatNumber(summary.reserves.today_count, 0),
      hint: t('dashboard.summary.operations.reservesHint', 'Por confirmar: {count}', {
        count: formatNumber(summary.reserves.pending_confirmation, 0),
      }),
    },
  ]

  return (
    <dl className="divide-y divide-divider" data-testid="dashboard-operations-list">
      {items.map((item) => {
        const Icon = item.icon

        return (
          <div
            key={item.id}
            className="grid grid-cols-[auto_1fr] items-center gap-x-md gap-y-xs py-sm first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto]"
            data-testid={`operation-${item.id}`}
          >
            <span
              className={`row-span-3 flex size-9 shrink-0 items-center justify-center rounded-md sm:row-span-2 ${TONE_CLASSES[item.tone]}`}
              aria-hidden="true"
            >
              <Icon size={18} />
            </span>
            <dt className="text-label-caps uppercase text-on-surface-deep">{item.label}</dt>
            <dd className="text-body-sm text-on-surface-deep">{item.hint}</dd>
            <dd className="col-start-2 whitespace-nowrap text-left font-data-mono text-title-md text-foreground sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:text-right">
              {item.value}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
