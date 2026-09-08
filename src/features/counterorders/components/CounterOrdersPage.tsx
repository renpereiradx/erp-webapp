import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { useBranch } from '@/contexts/BranchContext'
import PageHeader from '@/components/ui/PageHeader'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { useDebouncedValue } from '@/features/catalog/hooks/useDebouncedValue'
import { counterOrderService } from '@/services/counterOrderService'
import {
  useCancelCounterOrder,
  useClaimCounterOrder,
  useCounterOrder,
  useCounterOrders,
  useReleaseCounterOrder,
} from '../hooks/useCounterOrders'
import { useCounterOrderPreloadStore } from '@/store/useCounterOrderPreloadStore'
import { OrdersBoard } from '../components/OrdersBoard'
import { OrderBuilder } from '../components/OrderBuilder'
import { OrderDetailModal } from '../components/OrderDetailModal'
import { CancelOrderDialog } from '../components/CancelOrderDialog'
import type { CounterOrderDetail, CounterOrderStatusFilter, CounterOrderSummary } from '../types'

// ===========================================================================
// CounterOrdersPage — /pedidos (PLAN_PEDIDOS_MOSTRADOR — FASE 2.3)
// Bandeja del vendedor + entrada de la caja: filtros por estado, búsqueda
// por código/cliente, builder del carrito y acciones del ciclo de vida.
// ===========================================================================

const STATUS_OPTIONS: Array<{ value: CounterOrderStatusFilter; labelKey: string; fallback: string }> = [
  { value: 'ALL', labelKey: 'counterorders.filter.all', fallback: 'Todos' },
  { value: 'OPEN', labelKey: 'counterorders.status.OPEN', fallback: 'Abiertos' },
  { value: 'CLAIMED', labelKey: 'counterorders.status.CLAIMED', fallback: 'En caja' },
  { value: 'CONVERTED', labelKey: 'counterorders.status.CONVERTED', fallback: 'Procesados' },
  { value: 'CANCELLED', labelKey: 'counterorders.status.CANCELLED', fallback: 'Cancelados' },
]

export function CounterOrdersPage() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const { currentBranchId } = useBranch()
  const setPreload = useCounterOrderPreloadStore(state => state.setPreload)

  const [status, setStatus] = useState<CounterOrderStatusFilter>('OPEN')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [allBranches, setAllBranches] = useState(false)
  const debouncedSearch = useDebouncedValue(search.trim(), 350)

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<CounterOrderSummary | null>(null)
  const [editingDetail, setEditingDetail] = useState<CounterOrderDetail | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [cancelling, setCancelling] = useState<CounterOrderSummary | null>(null)

  const query = useCounterOrders({
    status,
    search: debouncedSearch,
    page,
    branchId: currentBranchId,
    allBranches,
  })
  const detailQuery = useCounterOrder(viewingId)
  const claimMutation = useClaimCounterOrder()
  const releaseMutation = useReleaseCounterOrder()
  const cancelMutation = useCancelCounterOrder()

  // FASE 4 (PLAN_PEDIDOS_MOSTRADOR v3): procesar en caja = cobrar. El gate
  // pasa de sales:write a cash:write — quien cobra maneja dinero (el vendor
  // nunca tuvo cash:write; CAJA01/ENCR01 sí).
  const canProcessInRegister = hasPermission('cash:write')

  const handleView = useCallback((order: CounterOrderSummary) => {
    setViewingId(order.id)
  }, [])

  const handleEditDetail = useCallback(
    async (order: CounterOrderSummary) => {
      try {
        // El resumen no trae ítems: traer el detalle resuelto para hidratar
        // el carrito del builder.
        const detail = await counterOrderService.getById(order.id)
        setEditingDetail(detail)
        setEditing(order)
        setBuilderOpen(true)
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [toast],
  )

  const handleProcess = useCallback(
    (order: CounterOrderSummary) => {
      claimMutation.mutate(order.id, {
        onSuccess: detail => {
          // Precarga para el wizard de /ventas (FASE 3) y navegación.
          setPreload({
            orderId: detail.id,
            code: detail.code,
            clientId: detail.client_id,
            clientName: detail.client_name,
          })
          navigate('/ventas')
        },
        onError: (err: Error) => toast.error(err.message),
      })
    },
    [claimMutation, navigate, setPreload, toast],
  )

  const handleRelease = useCallback(
    (order: CounterOrderSummary) => {
      releaseMutation.mutate(order.id, {
        onError: (err: Error) => toast.error(err.message),
      })
    },
    [releaseMutation, toast],
  )

  const handleCancelConfirm = useCallback(
    (orderId: string, reason: string) => {
      cancelMutation.mutate(
        { orderId, reason },
        {
          onSuccess: () => {
            setCancelling(null)
            toast.success(t('counterorders.cancel.success', 'Pedido cancelado'))
          },
          onError: (err: Error) => toast.error(err.message),
        },
      )
    },
    [cancelMutation, t, toast],
  )

  const handleSaved = useCallback((detail: CounterOrderDetail) => {
    setBuilderOpen(false)
    setEditing(null)
    setEditingDetail(null)
    // El detalle recién guardado trae los precios resueltos por el backend.
    setViewingId(detail.id)
  }, [])

  const handleNew = useCallback(() => {
    setEditing(null)
    setEditingDetail(null)
    setBuilderOpen(true)
  }, [])

  const isAdmin = user?.role_id === 'F2VLso'

  return (
    <div className="p-lg space-y-lg max-w-7xl mx-auto" data-testid="counterorders-page">
      <PageHeader
        title={t('counterorders.title', 'Pedidos')}
        subtitle={t(
          'counterorders.subtitle',
          'Pedidos de mostrador: el vendedor arma el carrito, la caja lo cobra.',
        )}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-sm md:justify-between">
        <SegmentedControl
          options={STATUS_OPTIONS.map(opt => ({
            value: opt.value,
            label: t(opt.labelKey, opt.fallback),
          }))}
          value={status}
          onChange={value => {
            setStatus(value as CounterOrderStatusFilter)
            setPage(1)
          }}
        />
        <div className="flex items-center gap-sm flex-wrap">
          <Input
            type="search"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('counterorders.board.search_placeholder', 'Buscar por código o cliente…')}
            className="md:w-64"
            data-testid="counterorders-search"
          />
          {hasPermission('branches:switch') && (
            <label className="flex items-center gap-xs text-body-sm text-on-surface-deep">
              <input
                type="checkbox"
                checked={allBranches}
                onChange={e => {
                  setAllBranches(e.target.checked)
                  setPage(1)
                }}
                data-testid="counterorders-all-branches"
              />
              {t('counterorders.board.all_branches', 'Ver todas las sucursales')}
            </label>
          )}
          <Button variant="default" onClick={handleNew} data-testid="counterorders-new-button">
            <ClipboardList className="size-4" aria-hidden="true" />
            {t('counterorders.board.new_order', 'Nuevo pedido')}
          </Button>
        </div>
      </div>

      <OrdersBoard
        orders={query.data?.orders ?? []}
        isLoading={query.isLoading}
        error={query.error}
        canProcessInRegister={canProcessInRegister}
        userId={user?.id}
        isAdmin={isAdmin}
        onRetry={() => query.refetch()}
        onView={handleView}
        onEdit={handleEditDetail}
        onCancel={setCancelling}
        onRelease={handleRelease}
        onProcess={handleProcess}
      />

      {query.data?.pagination && query.data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between gap-sm">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            {t('common.previous', 'Anterior')}
          </Button>
          <span className="text-body-sm text-on-surface-deep" data-testid="counterorders-pagination">
            {t('counterorders.board.page_info', 'Página {page} de {total}', {
              page,
              total: query.data.pagination.total_pages,
            })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= query.data.pagination.total_pages}
            onClick={() => setPage(p => p + 1)}
          >
            {t('common.next', 'Siguiente')}
          </Button>
        </div>
      )}

      <OrderBuilder
        open={builderOpen}
        mode={editing ? 'edit' : 'create'}
        editingOrder={editingDetail}
        onClose={() => {
          setBuilderOpen(false)
          setEditing(null)
          setEditingDetail(null)
        }}
        onSaved={handleSaved}
      />

      <OrderDetailModal
        open={viewingId !== null}
        detail={detailQuery.data ?? null}
        isLoading={detailQuery.isLoading}
        summary={query.data?.orders.find(o => o.id === viewingId) ?? null}
        onClose={() => setViewingId(null)}
      />

      <CancelOrderDialog
        order={cancelling}
        loading={cancelMutation.isPending}
        onConfirm={handleCancelConfirm}
        onClose={() => setCancelling(null)}
      />
    </div>
  )
}
