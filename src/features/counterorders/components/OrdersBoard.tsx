import { formatDistanceToNow } from 'date-fns'
import { es as esLocale } from 'date-fns/locale'
import { ClipboardList, StickyNote, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import ErrorState from '@/components/ui/ErrorState'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  /** Contenido de la banda de toolbar (§6.3): filtros + búsqueda. */
  toolbar?: ReactNode
  /** Acción sugerida del empty state (§6.7): crear el primer pedido. */
  onNew?: () => void
}

const TH_CLASS = 'text-label-caps uppercase text-on-surface-deep px-md py-md'

/**
 * Bandeja de pedidos de mostrador (PLAN_PEDIDOS_MOSTRADOR — FASE 2.1).
 * El vendedor ve los pedidos de la sucursal; la caja procesa desde acá
 * ("Procesar en caja") o desde el wizard de /ventas.
 *
 * Anatomía "card con tabla" (DESIGN.md §6.3): banda de toolbar muted +
 * border-b divider, tabla full-bleed con thead muted y empty state DENTRO
 * de la tabla (fila colSpan) — hermana del carrito de /ventas y /compras.
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
  toolbar,
  onNew,
}: OrdersBoardProps) {
  const { t } = useI18n()

  return (
    <section
      className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden"
      data-testid="counterorders-board"
    >
      {toolbar && (
        <div className="px-lg py-md bg-surface-muted border-b border-divider flex items-center justify-between gap-sm flex-wrap">
          {toolbar}
        </div>
      )}

      {isLoading && (
        <div className="p-md">
          <GenericSkeletonList count={5} data-testid="counterorders-skeleton" />
        </div>
      )}

      {error ? (
        <div className="p-lg">
          <ErrorState
            title={t('counterorders.board.error_title', 'No se pudieron cargar los pedidos')}
            message={t('counterorders.board.error_message', 'Revisá la conexión e intentá de nuevo.')}
            onRetry={onRetry}
          />
        </div>
      ) : null}

      {!isLoading && !error && (
        <Table className="min-w-[880px]">
          <TableHeader className="bg-surface-muted">
            <TableRow className="hover:bg-surface-muted border-0">
              <TableHead className={TH_CLASS}>
                {t('counterorders.board.col.order', 'Pedido')}
              </TableHead>
              <TableHead className={TH_CLASS}>
                {t('counterorders.board.col.client', 'Cliente')}
              </TableHead>
              <TableHead className={`${TH_CLASS} text-right`}>
                {t('counterorders.board.col.items', 'Ítems')}
              </TableHead>
              <TableHead className={`${TH_CLASS} text-right`}>
                {t('counterorders.board.col.total', 'Total')}
              </TableHead>
              <TableHead className={`${TH_CLASS} text-right`}>
                {t('counterorders.board.col.actions', 'Acciones')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-testid="counterorders-list">
            {orders.length === 0 ? (
              <TableRow className="hover:bg-transparent border-0">
                <TableCell colSpan={5} className="py-xl">
                  <div className="flex flex-col items-center justify-center gap-sm text-on-surface-deep">
                    <div className="size-16 rounded-full bg-surface-muted flex items-center justify-center">
                      <ClipboardList size={28} strokeWidth={1.5} className="text-outline-fg" aria-hidden="true" />
                    </div>
                    <p className="text-body-md-bold text-foreground">
                      {t('counterorders.board.empty_title', 'Sin pedidos')}
                    </p>
                    <p className="text-body-sm text-on-surface-deep text-center max-w-md">
                      {t(
                        'counterorders.board.empty_message',
                        'Cuando el vendedor guarde un pedido, va a aparecer acá para procesarlo en caja.',
                      )}
                    </p>
                    {onNew && (
                      <Button variant="secondary" size="sm" onClick={onNew} data-testid="counterorders-empty-new">
                        {t('counterorders.board.new_order', 'Nuevo pedido')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map(order => {
                const isEditable = order.status === 'OPEN' && !order.claimed_by
                const canRelease =
                  order.status === 'CLAIMED' && (isAdmin || (userId && order.claimed_by === userId))
                const processedAgo = formatDistanceToNow(new Date(order.created_at), {
                  addSuffix: true,
                  locale: esLocale,
                })
                return (
                  <TableRow
                    key={order.id}
                    data-testid={`counterorder-row-${order.id}`}
                    className="hover:bg-surface-muted transition-colors duration-150"
                  >
                    <TableCell className="px-md py-md align-top">
                      <div className="flex flex-col gap-xs">
                        <span
                          data-testid={`counterorder-code-${order.id}`}
                          className="font-data-mono text-body-md-bold text-foreground"
                        >
                          {order.code}
                        </span>
                        <div className="flex items-center gap-sm flex-wrap">
                          <OrderStatusBadge status={order.status} />
                          {order.notes && (
                            <StickyNote
                              className="size-4 text-warning"
                              aria-label={t('counterorders.board.has_notes', 'El pedido tiene nota del vendedor')}
                            />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-md py-md align-top min-w-0">
                      <p className="text-body-md-bold text-foreground truncate">
                        {order.client_name}
                      </p>
                      <p className="text-body-sm text-on-surface-deep flex items-center gap-1.5 mt-xs">
                        <User className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">
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
                        </span>
                      </p>
                    </TableCell>
                    <TableCell className="px-md py-md align-top text-right">
                      <span className="font-data-mono text-data-mono text-foreground">
                        {order.item_count}
                      </span>
                    </TableCell>
                    <TableCell className="px-md py-md align-top text-right">
                      <span
                        data-testid={`counterorder-total-${order.id}`}
                        className="font-data-mono text-data-mono text-body-md-bold text-primary whitespace-nowrap"
                      >
                        {formatCurrency(order.total)}
                      </span>
                    </TableCell>
                    <TableCell className="px-md py-md align-top">
                      <div className="flex items-center justify-end gap-xs flex-wrap">
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
                                variant="primary"
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
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
