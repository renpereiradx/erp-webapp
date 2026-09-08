import { formatDistanceToNow } from 'date-fns'
import { es as esLocale } from 'date-fns/locale'
import { ClipboardList, StickyNote, User } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import { formatCurrency } from '@/utils/currencyUtils'
import type { CounterOrderSummary } from '../types'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrdersBoardProps {
  orders: CounterOrderSummary[]
  isLoading: boolean
  error: unknown
  canProcessInRegister: boolean
  userId?: string
  isAdmin: boolean
  onRetry: () => void
  onView: (order: CounterOrderSummary) => void
  onEdit: (order: CounterOrderSummary) => void
  onCancel: (order: CounterOrderSummary) => void
  onRelease: (order: CounterOrderSummary) => void
  onProcess: (order: CounterOrderSummary) => void
}

/**
 * Bandeja de pedidos de mostrador (PLAN_PEDIDOS_MOSTRADOR — FASE 2.1).
 * El vendedor ve los pedidos de la sucursal; la caja procesa desde acá
 * ("Procesar en caja") o desde el wizard de /ventas.
 */
export function OrdersBoard({
  orders,
  isLoading,
  error,
  canProcessInRegister,
  userId,
  isAdmin,
  onRetry,
  onView,
  onEdit,
  onCancel,
  onRelease,
  onProcess,
}: OrdersBoardProps) {
  const { t } = useI18n()

  if (isLoading) {
    return <GenericSkeletonList count={5} data-testid="counterorders-skeleton" />
  }

  if (error) {
    return (
      <ErrorState
        title={t('counterorders.board.error_title', 'No se pudieron cargar los pedidos')}
        message={t('counterorders.board.error_message', 'Revisá la conexión e intentá de nuevo.')}
        onRetry={onRetry}
      />
    )
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={t('counterorders.board.empty_title', 'Sin pedidos')}
        description={t(
          'counterorders.board.empty_message',
          'Cuando el vendedor guarde un pedido, va a aparecer acá para procesarlo en caja.',
        )}
      />
    )
  }

  return (
    <ul className="space-y-sm" data-testid="counterorders-list">
      {orders.map(order => {
        const isEditable = order.status === 'OPEN' && !order.claimed_by
        const canRelease =
          order.status === 'CLAIMED' && (isAdmin || (userId && order.claimed_by === userId))
        const processedAgo = formatDistanceToNow(new Date(order.created_at), {
          addSuffix: true,
          locale: esLocale,
        })
        return (
          <li
            key={order.id}
            data-testid={`counterorder-row-${order.id}`}
            className="bg-surface rounded-md shadow-whisper border border-border-subtle p-md flex flex-col gap-sm animate-in fade-in duration-200"
          >
            <div className="flex items-start justify-between gap-md">
              <div className="min-w-0">
                <div className="flex items-center gap-sm flex-wrap">
                  <span
                    data-testid={`counterorder-code-${order.id}`}
                    className="font-data-mono text-body-md-bold text-foreground"
                  >
                    {order.code}
                  </span>
                  <OrderStatusBadge status={order.status} />
                  {order.notes && (
                    <StickyNote
                      className="size-4 text-warning"
                      aria-label={t('counterorders.board.has_notes', 'El pedido tiene nota del vendedor')}
                    />
                  )}
                </div>
                <p className="text-body-md text-foreground mt-xs truncate">
                  {order.client_name}
                </p>
                <p className="text-body-sm text-on-surface-deep flex items-center gap-1.5 mt-xs">
                  <User className="size-3.5 shrink-0" aria-hidden="true" />
                  {t('counterorders.board.created_by', 'Creado por {name} · {ago}', {
                    name: order.created_by_name,
                    ago: processedAgo,
                  })}
                  {order.status === 'CLAIMED' && order.claimed_by_name && (
                    <span className="text-warning">
                      {' · '}
                      {t('counterorders.board.claimed_by', 'en caja con {name}', {
                        name: order.claimed_by_name,
                      })}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-label-caps uppercase text-on-surface-deep block">
                  {t('counterorders.board.items_total', '{count} ítems', { count: order.item_count })}
                </span>
                <span
                  data-testid={`counterorder-total-${order.id}`}
                  className="font-data-mono text-title-md text-primary leading-none"
                >
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-sm pt-sm border-t border-border-subtle flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => onView(order)}>
                {t('counterorders.board.view', 'Ver detalle')}
              </Button>
              {isEditable && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => onEdit(order)}>
                    {t('counterorders.board.edit', 'Editar')}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-error" onClick={() => onCancel(order)}>
                    {t('counterorders.board.cancel', 'Cancelar')}
                  </Button>
                  {canProcessInRegister && (
                    <Button
                      variant="default"
                      size="sm"
                      data-testid={`counterorder-process-${order.id}`}
                      onClick={() => onProcess(order)}
                    >
                      {t('counterorders.board.process', 'Procesar en caja')}
                    </Button>
                  )}
                </>
              )}
              {canRelease && (
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`counterorder-release-${order.id}`}
                  onClick={() => onRelease(order)}
                >
                  {t('counterorders.board.release', 'Liberar')}
                </Button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
