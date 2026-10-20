import {
  Activity,
  CreditCard,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import { getTimeAgo } from '@/domain/dashboard/shared'
import type { RecentActivityItem } from '@/types/bi'

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  sale: ShoppingCart,
  purchase: ShoppingBag,
  payment: CreditCard,
  adjustment: SlidersHorizontal,
}

const ACTIVITY_LABEL_KEYS: Record<string, string> = {
  sale: 'Venta',
  purchase: 'Compra',
  payment: 'Pago',
  adjustment: 'Ajuste',
}

/** Lista de actividad reciente; descripción/monto/usuario son datos del BE. */
export const ActivityPanel = ({ activities }: { activities: RecentActivityItem[] }) => {
  const { t } = useI18n()

  if (activities.length === 0) {
    return (
      <p className="text-body-md text-on-surface-deep">
        {t('dashboard.activity.empty', 'Sin actividad reciente.')}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-divider">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type] ?? Activity
        const typeLabel = t(
          `dashboard.activity.types.${activity.type}`,
          ACTIVITY_LABEL_KEYS[activity.type] ?? activity.type,
        )

        return (
          <li key={activity.id} className="flex items-start gap-md py-sm first:pt-0 last:pb-0">
            <span
              className="mt-xs flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-on-surface-deep"
              aria-hidden="true"
            >
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-md text-foreground">{activity.description}</p>
              <p className="text-body-sm text-on-surface-deep">
                {typeLabel} · {activity.user} · {getTimeAgo(activity.timestamp, t('dashboard.activity.now', 'ahora'))}
              </p>
            </div>
            {activity.amount > 0 ? (
              <span className="shrink-0 font-data-mono text-data-mono text-foreground">
                {formatPYG(activity.amount)}
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
