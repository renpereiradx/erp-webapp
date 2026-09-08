/**
 * PendingSalesStep — paso condicional del SaleCheckoutWizard.
 *
 * Aparece cuando el cliente seleccionado tiene ventas pendientes o pedidos
 * de mostrador (PLAN_PEDIDOS_MOSTRADOR FASE 3.1). Muestra dos secciones:
 * "Pedidos del vendedor" (carritos OPEN del cliente; CLAIMED por otra caja
 * se ve deshabilitado "En caja con X") y "Ventas pendientes".
 *
 * La lista de pendientes siempre arranca con la fila "Nueva venta"
 * (seleccionada por defecto: índice 0) seguida de las ventas pendientes
 * (índices 1..N). Elegir una venta la continúa (merge); elegir "Nueva venta"
 * y avanzar cobra el carrito actual como venta aparte.
 *
 * Al elegir un pedido aparece el destino inline: "Venta nueva" o
 * "Agregar a pendiente #N" (cuando hay pendientes). La selección de pedido
 * es excluyente con la de pendientes.
 *
 * Navegación por flechas ↑↓ con soporte de teclado (sección pendientes).
 */
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { ClipboardList, History, MapPin, Plus, FileText, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, normalizeCurrencyCode } from '@/utils/currencyUtils'
import { useI18n } from '@/lib/i18n'
import type { CounterOrderSummary } from '@/features/counterorders/types'

export interface PendingSalesStepRef {
  focus: () => void
}

export type CounterOrderDestination = 'new' | 'merge'

interface PendingSalesStepProps {
  activeSales: any[]
  currentBranchId?: number | string | null
  /** 0 = fila "Nueva venta"; i>=1 = activeSales[i - 1]. */
  selectedIndex: number
  onSelectIndex: (index: number) => void
  /** Pedidos de mostrador activos del cliente (OPEN/CLAIMED). */
  counterOrders: CounterOrderSummary[]
  /** key del pedido elegido (order.id) o null. */
  selectedOrderKey: string | null
  onSelectOrder: (key: string | null) => void
  orderDestination: CounterOrderDestination
  onDestinationChange: (destination: CounterOrderDestination) => void
  /** Índice (en activeSales) de la pendiente destino del merge. */
  mergeSaleIndex: number
  onMergeSaleIndexChange: (index: number) => void
}

/** "hace X" relativo, tolerante a fechas inválidas. */
const relativeAgo = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'hace instantes'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} d`
}

/** Nombres de producto de la venta para el subtítulo de la tarjeta. */
const saleProductNames = (sale: any): string[] => {
  const details = Array.isArray(sale?.details) ? sale.details : []
  return details
    .map((d: any) => {
      const name = String(d?.product_name || d?.name || '').trim()
      if (!name) return ''
      const qty = Number(d?.quantity) || 0
      return qty > 0 ? `${name} ×${qty}` : name
    })
    .filter(Boolean)
}

export const PendingSalesStep = forwardRef<PendingSalesStepRef, PendingSalesStepProps>(
  (
    {
      activeSales,
      currentBranchId,
      selectedIndex,
      onSelectIndex,
      counterOrders,
      selectedOrderKey,
      onSelectOrder,
      orderDestination,
      onDestinationChange,
      mergeSaleIndex,
      onMergeSaleIndexChange,
    },
    ref,
  ) => {
    const { t } = useI18n()
    const listRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selectedIndex}"]`)
        el?.focus()
      },
    }))

    // Mantiene el item enfocado a la vista al navegar con flechas.
    useEffect(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selectedIndex}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    }, [selectedIndex])

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-title-md text-foreground">
            {t('sales.checkoutWizard.pendingSales.title', 'Pendientes y pedidos del cliente')}
          </h3>
          <p className="text-body-sm text-on-surface-deep">
            {t(
              'sales.checkoutWizard.pendingSales.subtitle',
              'Elegí procesar un pedido del vendedor, continuar una venta existente o empezar una nueva',
            )}
          </p>
        </div>

        {/* ─── Sección: Pedidos del vendedor (PLAN_PEDIDOS_MOSTRADOR) ─── */}
        {counterOrders.length > 0 && (
          <div className="space-y-2">
            <p className="text-label-caps uppercase text-on-surface-deep flex items-center gap-1.5">
              <ClipboardList size={13} aria-hidden="true" />
              {t('sales.checkoutWizard.pendingSales.ordersSection', 'Pedidos del vendedor')}
            </p>
            {counterOrders.map(order => {
              const isClaimedElsewhere = order.status === 'CLAIMED'
              const isSelected = !isClaimedElsewhere && selectedOrderKey === order.id
              return (
                <div key={order.id}>
                  <button
                    type="button"
                    data-testid={`wizard-counterorder-${order.id}`}
                    disabled={isClaimedElsewhere}
                    aria-pressed={isSelected}
                    onClick={() => onSelectOrder(isSelected ? null : order.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                      isClaimedElsewhere
                        ? 'border-divider bg-surface-muted opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-divider bg-surface hover:border-primary/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            'mt-0.5 size-4 rounded-full border-2 flex items-center justify-center shrink-0',
                            isSelected ? 'border-primary bg-primary' : 'border-outline-fg',
                          )}
                        >
                          {isSelected && <div className="size-1.5 rounded-full bg-on-primary" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground font-data-mono">{order.code}</p>
                          <div className="flex items-center gap-2 text-xs text-on-surface-deep mt-0.5">
                            <ShoppingBag size={12} className="shrink-0" />
                            <span>
                              {t('sales.checkoutWizard.itemCount', '{count} ítem(s)', {
                                count: order.item_count ?? 0,
                              })}
                            </span>
                            <span>•</span>
                            <span>{relativeAgo(order.created_at)}</span>
                            <span>•</span>
                            <span className="truncate">{order.created_by_name}</span>
                          </div>
                          {order.notes && (
                            <p className="text-xs text-warning mt-1 flex items-start gap-1.5">
                              <FileText size={12} className="mt-0.5 shrink-0" />
                              <span className="leading-snug line-clamp-2">{order.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs uppercase font-bold text-on-surface-deep tracking-wider">
                          {t('sales.checkoutWizard.pendingSales.orderEstimatedTotal', 'Estimado')}
                        </p>
                        <p className="font-data-mono font-bold text-foreground">
                          {formatCurrency(Number(order.total) || 0)}
                        </p>
                        {isClaimedElsewhere && (
                          <span className="inline-flex items-center gap-1 mt-1 text-body-sm-bold uppercase text-warning bg-warning/10 border border-warning/30 rounded px-1.5 py-0.5">
                            <History size={10} />
                            {order.claimed_by_name
                              ? t('sales.checkoutWizard.pendingSales.claimedByOther', 'En caja con {name}', {
                                  name: order.claimed_by_name,
                                })
                              : t('sales.checkoutWizard.pendingSales.claimed', 'En caja')}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Destino inline: venta nueva o merge a una pendiente */}
                  {isSelected && (
                    <div
                      className="mt-2 ml-7 p-3 rounded-md bg-surface-muted border border-divider space-y-2"
                      data-testid={`wizard-counterorder-destination-${order.id}`}
                    >
                      <label className="flex items-center gap-2 text-body-sm text-foreground">
                        <input
                          type="radio"
                          name={`dest-${order.id}`}
                          checked={orderDestination === 'new'}
                          onChange={() => onDestinationChange('new')}
                        />
                        {t('sales.checkoutWizard.pendingSales.destNewSale', 'Cobrar como venta nueva')}
                      </label>
                      {activeSales.length > 0 && (
                        <label className="flex items-center gap-2 text-body-sm text-foreground">
                          <input
                            type="radio"
                            name={`dest-${order.id}`}
                            checked={orderDestination === 'merge'}
                            onChange={() => onDestinationChange('merge')}
                          />
                          {t('sales.checkoutWizard.pendingSales.destMerge', 'Agregar a pendiente')}
                          <select
                            value={mergeSaleIndex}
                            onChange={e => onMergeSaleIndexChange(Number(e.target.value))}
                            disabled={orderDestination !== 'merge'}
                            className="ml-1 rounded-sm border border-divider bg-surface px-1.5 py-0.5 text-body-sm text-foreground max-w-[180px] truncate"
                            data-testid={`wizard-counterorder-merge-select-${order.id}`}
                          >
                            {activeSales.map((sale, idx) => (
                              <option key={sale.sale_id || sale.id || idx} value={idx}>
                                #{sale.sale_id || sale.id || idx + 1}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ─── Sección: Ventas pendientes ─── */}
        {activeSales.length > 0 && (
          <div className="space-y-2">
            <p className="text-label-caps uppercase text-on-surface-deep flex items-center gap-1.5">
              <History size={13} aria-hidden="true" />
              {t('sales.checkoutWizard.pendingSales.salesSection', 'Ventas pendientes')}
            </p>
            <div ref={listRef} className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {/* Fila "Nueva venta" (índice 0, seleccionada por defecto). */}
          <button
            key="__new_sale__"
            type="button"
            data-idx={0}
            tabIndex={selectedIndex === 0 ? 0 : -1}
            aria-selected={selectedIndex === 0}
            onClick={() => onSelectIndex(0)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                onSelectIndex(Math.min(1, activeSales.length))
              }
            }}
            className={cn(
              'w-full text-left p-4 rounded-md border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center gap-3',
              selectedIndex === 0
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-divider bg-surface hover:border-primary/40',
            )}
          >
            <div
              className={cn(
                'size-4 rounded-full border-2 flex items-center justify-center shrink-0',
                selectedIndex === 0 ? 'border-primary bg-primary' : 'border-outline-fg',
              )}
            >
              {selectedIndex === 0 && <div className="size-1.5 rounded-full bg-on-primary" />}
            </div>
            <div
              className={cn(
                'size-9 rounded-md flex items-center justify-center shrink-0',
                selectedIndex === 0 ? 'bg-primary text-on-primary' : 'bg-surface-muted text-on-surface-deep',
              )}
            >
              <Plus size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-body-md-bold text-foreground">
                {t('sales.checkoutWizard.pendingSales.newSaleRow', 'Nueva venta')}
              </p>
              <p className="text-body-sm text-on-surface-deep truncate">
                {t(
                  'sales.checkoutWizard.pendingSales.newSaleRowHint',
                  'El carrito actual se cobra como una venta aparte',
                )}
              </p>
            </div>
          </button>

          {activeSales.map((sale, index) => {
            const idx = index + 1
            const isSelected = idx === selectedIndex
            const isFromOtherBranch =
              sale.branch_id && currentBranchId != null && String(sale.branch_id) !== String(currentBranchId)
            const productNames = saleProductNames(sale)
            const saleId = sale.sale_id || sale.id
            return (
              <button
                key={saleId || idx}
                type="button"
                data-idx={idx}
                tabIndex={isSelected ? 0 : -1}
                aria-selected={isSelected}
                onClick={() => onSelectIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    onSelectIndex(Math.min(idx + 1, activeSales.length))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    onSelectIndex(Math.max(idx - 1, 0))
                  }
                }}
                className={cn(
                  'w-full text-left p-4 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-divider bg-surface hover:border-primary/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        'mt-0.5 size-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        isSelected ? 'border-primary bg-primary' : 'border-outline-fg',
                      )}
                    >
                      {isSelected && <div className="size-1.5 rounded-full bg-on-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-bold text-sm text-foreground truncate font-data-mono"
                        title={String(saleId || '')}
                      >
                        #{saleId || '—'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-on-surface-deep mt-0.5">
                        <History size={12} className="shrink-0" />
                        <span>
                          {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('es-PY') : '—'}
                        </span>
                        <span>•</span>
                        <span>
                          {t('sales.checkoutWizard.itemCount', '{count} ítem(s)', {
                            count: sale.items_count ?? 0,
                          })}
                        </span>
                      </div>
                      {productNames.length > 0 && (
                        <div className="flex items-start gap-1.5 mt-1.5 text-xs text-on-surface-deep">
                          <FileText size={12} className="mt-0.5 shrink-0" />
                          <span className="leading-snug">
                            {productNames.slice(0, 3).join(' · ')}
                            {productNames.length > 3 &&
                              ' ' +
                                t('sales.checkoutWizard.pendingSales.moreItems', '+{count} más', {
                                  count: productNames.length - 3,
                                })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs uppercase font-bold text-on-surface-deep tracking-wider">
                      {t('sales.checkoutWizard.total', 'Total')}
                    </p>
                    <p className="font-data-mono font-bold text-foreground">
                      {formatCurrency(Number(sale.total_amount) || 0, normalizeCurrencyCode(sale.currency))}
                    </p>
                    {isFromOtherBranch && (
                      <span className="inline-flex items-center gap-1 mt-1 text-body-sm-bold uppercase text-warning bg-warning/10 border border-warning/30 rounded px-1.5 py-0.5">
                        <MapPin size={10} />
                        {t('sales.checkoutWizard.pendingSales.otherBranch', 'Otra sucursal')}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
            </div>
          </div>
        )}

        <p className="text-xs text-on-surface-deep">
          {t(
            'sales.checkoutWizard.pendingSales.skipHint',
            'Nueva venta está seleccionada por defecto. Tocá una venta para continuarla, o tocá "Nueva venta" para volver.',
          )}
        </p>
        <p className="text-xs text-on-surface-deep">
          {t('sales.checkoutWizard.action.continueSelected', 'Continuar seleccionada')} ·{' '}
          {t('sales.checkoutWizard.action.newSale', 'Nueva venta')} (↑↓ para navegar)
        </p>
      </div>
    )
  },
)

PendingSalesStep.displayName = 'PendingSalesStep'
