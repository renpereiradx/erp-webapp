import {
  Activity,
  CreditCard,
  History,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import { formatActorName, getActivityKey, type ActivityKey } from '@/domain/dashboard/activity'
import { getTimeAgo } from '@/domain/dashboard/shared'
import type { RecentActivityItem } from '@/types/bi'

const ACTIVITY_ICONS: Record<ActivityKey, LucideIcon> = {
  sale: ShoppingCart,
  purchase: ShoppingBag,
  payment: CreditCard,
  adjustment: SlidersHorizontal,
  other: Activity,
}

const ACTIVITY_TONES: Record<ActivityKey, string> = {
  sale: 'bg-primary/10 text-primary',
  purchase: 'bg-warning/10 text-warning',
  payment: 'bg-success/10 text-success',
  adjustment: 'bg-secondary/10 text-secondary',
  other: 'bg-surface-muted text-on-surface-deep',
}

const ACTIVITY_LABEL_KEYS: Record<ActivityKey, string> = {
  sale: 'Venta',
  purchase: 'Compra',
  payment: 'Pago',
  adjustment: 'Ajuste',
  other: 'Otro',
}

/**
 * Actividad reciente: descripción como línea principal, metadata compacta
 * (tipo · actor · tiempo) y monto alineado a la derecha.
 *
 * - El actor se normaliza con `formatActorName` para no mostrar
 *   "ADMINISTRADOR ADMINISTRADOR" cuando first_name y last_name coinciden.
 * - El icono usa un tono por tipo (venta/compra/pago/ajuste) para escanear la
 *   lista sin leer cada fila.
 * - Las filas sin importe muestran "—" en la misma columna, en vez de dejar un
 *   hueco que rompe la alineación.
 */
export const ActivityPanel = ({ activities }: { activities: RecentActivityItem[] }) => {
  const { t } = useI18n()

  if (activities.length === 0) {
    return (
      <div className="flex items-start gap-sm rounded-md bg-surface-muted p-md">
        <History size={18} className="mt-xs shrink-0 text-on-surface-deep" aria-hidden="true" />
        <div>
          <p className="text-body-md-bold text-foreground">
            {t('dashboard.activity.empty', 'Sin actividad reciente.')}
          </p>
          <p className="text-body-sm text-on-surface-deep">
            {t(
              'dashboard.activity.emptyDescription',
              'Los movimientos de ventas, compras y pagos van a aparecer acá.',
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-divider">
      {activities.map((activity) => {
        const key = getActivityKey(activity.type)
        const Icon = ACTIVITY_ICONS[key]
        const typeLabel = t(`dashboard.activity.types.${key}`, ACTIVITY_LABEL_KEYS[key])
        const actor = formatActorName(activity.user)
        const timeAgo = getTimeAgo(activity.timestamp, t('dashboard.activity.now', 'ahora'))

        return (
          <li
            key={activity.id}
            className="grid grid-cols-[auto_1fr] items-start gap-x-md gap-y-xs py-sm first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto] sm:py-md"
            data-testid={`activity-${activity.id}`}
          >
            <span
              className={`row-span-2 mt-xs flex size-9 shrink-0 items-center justify-center rounded-full ${ACTIVITY_TONES[key]}`}
              aria-hidden="true"
            >
              <Icon size={16} />
            </span>

            <div className="min-w-0">
              <p className="break-words text-body-md-bold text-foreground">
                {activity.description}
              </p>
              <div className="mt-xs flex flex-wrap items-center gap-x-xs gap-y-0 text-body-sm text-on-surface-deep">
                <span className="text-label-caps uppercase">{typeLabel}</span>
                {actor ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="min-w-0 truncate">{actor}</span>
                  </>
                ) : null}
                {timeAgo ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <time dateTime={activity.timestamp}>{timeAgo}</time>
                  </>
                ) : null}
              </div>
            </div>

            {activity.amount > 0 ? (
              <span className="col-start-2 mt-xs whitespace-nowrap font-data-mono text-title-md text-foreground sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:text-right">
                {formatPYG(activity.amount)}
              </span>
            ) : (
              <span
                className="col-start-2 mt-xs font-data-mono text-title-md text-on-surface-deep sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:text-right"
                aria-label={t('dashboard.activity.noAmount', 'Sin importe')}
              >
                —
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
