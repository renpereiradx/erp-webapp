import { CheckCircle2, Clock, DollarSign, XCircle, Archive } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { CounterOrderStatus } from '../types'

const STATUS_STYLES: Record<CounterOrderStatus, { icon: typeof Clock; className: string }> = {
  OPEN: { icon: Clock, className: 'bg-primary/10 text-primary' },
  CLAIMED: { icon: DollarSign, className: 'bg-warning/10 text-warning' },
  CONVERTED: { icon: CheckCircle2, className: 'bg-success/10 text-success' },
  CANCELLED: { icon: XCircle, className: 'bg-error/10 text-error' },
  EXPIRED: { icon: Archive, className: 'bg-surface-muted text-on-surface-deep' },
}

const STATUS_LABEL_KEYS: Record<CounterOrderStatus, string> = {
  OPEN: 'counterorders.status.OPEN',
  CLAIMED: 'counterorders.status.CLAIMED',
  CONVERTED: 'counterorders.status.CONVERTED',
  CANCELLED: 'counterorders.status.CANCELLED',
  EXPIRED: 'counterorders.status.EXPIRED',
}

const STATUS_FALLBACKS: Record<CounterOrderStatus, string> = {
  OPEN: 'Abierto',
  CLAIMED: 'En caja',
  CONVERTED: 'Procesado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Vencido',
}

interface OrderStatusBadgeProps {
  status: CounterOrderStatus
  className?: string
}

/** Badge del ciclo de vida del pedido (OPEN/CLAIMED/CONVERTED/CANCELLED/EXPIRED). */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const { t } = useI18n()
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.EXPIRED
  const Icon = style.icon
  return (
    <span
      data-testid={`counterorder-status-${status}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-body-sm-bold uppercase',
        style.className,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {t(STATUS_LABEL_KEYS[status], STATUS_FALLBACKS[status])}
    </span>
  )
}
