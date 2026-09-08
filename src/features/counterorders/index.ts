// Feature pedidos de mostrador (PLAN_PEDIDOS_MOSTRADOR — FASE 2).
export { CounterOrdersPage } from './components/CounterOrdersPage'
export { OrdersBoard } from './components/OrdersBoard'
export { OrderBuilder } from './components/OrderBuilder'
export { OrderDetailModal } from './components/OrderDetailModal'
export { OrderStatusBadge } from './components/OrderStatusBadge'
export { CancelOrderDialog } from './components/CancelOrderDialog'
export {
  useCounterOrders,
  useCounterOrder,
  useCreateCounterOrder,
  useUpdateCounterOrder,
  useClaimCounterOrder,
  useReleaseCounterOrder,
  useConvertCounterOrder,
  useCancelCounterOrder,
  COUNTER_ORDERS_PAGE_SIZE,
} from './hooks/useCounterOrders'
export { useOrderCart } from './hooks/useOrderCart'
export * from './types'
