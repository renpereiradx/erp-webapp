import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Barcode, Minus, Plus, ShoppingCart, Trash2, UserPlus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableDropdown, type SearchableDropdownItem } from '@/components/ui/SearchableDropdown'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { useToast } from '@/hooks/useToast'
import { useBranch } from '@/contexts/BranchContext'
import useClientStore from '@/store/useClientStore'
import QuickClientModal from '@/features/party/components/QuickClientModal'
import { saleService } from '@/services/saleService'
import { formatCurrency } from '@/utils/currencyUtils'
import { useCatalogProducts, useCatalogVariants, useProductStockSummary } from '@/features/catalog/hooks/useCatalogProducts'
import { useDebouncedValue } from '@/features/catalog/hooks/useDebouncedValue'
import { DEFAULT_CATALOG_FILTERS, type CatalogProduct } from '@/features/catalog/types'
import { cn } from '@/lib/utils'
import { useCreateCounterOrder, useUpdateCounterOrder } from '../hooks/useCounterOrders'
import { useOrderCart } from '../hooks/useOrderCart'
import type { CounterOrderDetail } from '../types'

// ===========================================================================
// OrderBuilder (PLAN_PEDIDOS_MOSTRADOR — FASE 2.1)
// Carrito del vendedor: busca productos (catálogo comercial), escanea
// códigos de barra, asocia cliente (búsqueda o alta rápida), agrega notas y
// guarda el pedido OPEN. Los totales los resuelve el backend al guardar
// (resolve-on-read §3.3) — acá solo hay hints informativos.
// ===========================================================================

interface OrderBuilderProps {
  open: boolean
  mode: 'create' | 'edit'
  /** Pedido en edición (detalle resuelto precargado); null en modo create. */
  editingOrder: CounterOrderDetail | null
  onClose: () => void
  /** Pedido guardado: la página muestra el detalle resuelto. */
  onSaved: (detail: CounterOrderDetail) => void
}

interface ClientDropdownItem extends SearchableDropdownItem {
  id: string
  name: string
}

/** Tarjeta compacta de producto para el picker del carrito (memoizada:
 * la grilla re-renderiza en cada tecla de búsqueda). El stock sigue el
 * mapeo del admin de productos en el alcance de la sucursal activa:
 * chip con el total y fila base con SU stock (summary del backend). */
interface ProductPickCardProps {
  product: CatalogProduct
  onAdd: (product: CatalogProduct, variantId?: string | null, variantName?: string, stock?: number | null) => void
}

const ProductPickCard = memo(function ProductPickCard({ product, onAdd }: ProductPickCardProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const variantsQuery = useCatalogVariants(expanded && product.has_variant ? product.id : null)
  const summaryQuery = useProductStockSummary(product.has_variant ? product.id : null)
  const summary = summaryQuery.data ?? null
  const stock = product.has_variant
    ? (summary?.total_stock ?? product.stock_quantity ?? null)
    : (product.stock_quantity ?? null)
  // Fila base: stock SIN variantes (fallback al proyectado global si el
  // backend aún no tiene stock-summary).
  const baseStock = product.has_variant
    ? (summary?.base_stock ?? product.stock_quantity ?? null)
    : (product.stock_quantity ?? null)
  const outOfStock = product.stock_status === 'out_of_stock' || (stock !== null && stock <= 0)
  const stockLabel = (value: number | null) =>
    value == null || value <= 0
      ? t('counterorders.builder.out_of_stock', 'Sin stock')
      : `${t('counterorders.builder.stock', 'Stock')}: ${value}`

  return (
    <article
      data-testid={`counterorder-pick-${product.id}`}
      className="bg-surface rounded-md shadow-whisper border border-border-subtle p-sm flex flex-col gap-xs"
    >
      <p className="text-body-sm-bold text-foreground truncate" title={product.name}>
        {product.name}
      </p>
      <div className="flex items-center justify-between gap-sm">
        <span className="font-data-mono text-body-sm text-primary whitespace-nowrap">
          {product.current_price != null ? formatCurrency(product.current_price) : '—'}
        </span>
        <span
          className={cn(
            'text-label-caps uppercase whitespace-nowrap',
            outOfStock ? 'text-error' : 'text-on-surface-deep',
          )}
        >
          {stockLabel(stock)}
        </span>
      </div>
      {product.has_variant ? (
        <div className="space-y-xs">
          {/* El producto base también es vendible (línea sin variant_id):
              precio por get_active_price y filas de stock propias (variant
              NULL). Antes solo se podían agregar variantes. */}
          <div
            className="flex items-center justify-between gap-md rounded-sm bg-surface-muted px-sm py-xs"
            data-testid={`counterorder-pick-base-${product.id}`}
          >
            <span className="min-w-0 flex-1">
              <span className="text-body-sm-bold text-foreground block truncate">
                {t('counterorders.builder.base_product', 'Producto base')}
              </span>
              <span className="text-label-caps uppercase text-on-surface-deep font-data-mono whitespace-nowrap">
                {stockLabel(baseStock)}
              </span>
            </span>
            <Button
              variant="default"
              size="sm"
              className="shrink-0"
              data-testid={`counterorder-add-${product.id}`}
              onClick={() => onAdd(product, null, undefined, baseStock)}
              aria-label={`${t('counterorders.builder.add', 'Agregar')} ${product.name}`}
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setExpanded(prev => !prev)}>
            {expanded
              ? t('counterorders.builder.hide_variants', 'Ocultar variantes')
              : `${t('counterorders.builder.pick_variant', 'Elegir variante')} (${product.variant_count})`}
          </Button>
          {expanded && (
            <ul className="space-y-xs" data-testid={`counterorder-pick-variants-${product.id}`}>
              {(variantsQuery.data ?? []).map(variant => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-md rounded-sm bg-surface-muted px-sm py-xs"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-body-sm-bold text-foreground block truncate" title={variant.variant_name}>
                      {variant.variant_name}
                    </span>
                    <span className="text-label-caps uppercase text-on-surface-deep font-data-mono block truncate">
                      {stockLabel(variant.stock_quantity ?? 0)}
                    </span>
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    className="shrink-0"
                    data-testid={`counterorder-add-variant-${variant.id}`}
                    onClick={() =>
                      onAdd(product, variant.id, variant.variant_name, variant.stock_quantity ?? null)
                    }
                    aria-label={`${t('counterorders.builder.add', 'Agregar')} ${variant.variant_name}`}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </Button>
                </li>
              ))}
              {!variantsQuery.isLoading && (variantsQuery.data ?? []).length === 0 && (
                <li className="text-body-sm text-on-surface-deep">
                  {t('counterorders.builder.no_variants', 'Sin variantes activas.')}
                </li>
              )}
            </ul>
          )}
        </div>
      ) : (
        // Un pedido admite productos sin stock (§5.2): el stock se valida
        // hard al procesar la venta; acá es solo warning informativo.
        <Button
          variant="default"
          size="sm"
          data-testid={`counterorder-add-${product.id}`}
          onClick={() => onAdd(product, null, undefined, stock)}
          aria-label={`${t('counterorders.builder.add', 'Agregar')} ${product.name}`}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('counterorders.builder.add', 'Agregar')}
        </Button>
      )}
    </article>
  )
})

export function OrderBuilder({ open, mode, editingOrder, onClose, onSaved }: OrderBuilderProps) {
  const { t } = useI18n()
  const toast = useToast()
  const { currentBranchId } = useBranch()
  const searchClients = useClientStore(state => state.searchClients)

  const cart = useOrderCart()
  const [searchTerm, setSearchTerm] = useState('')
  const [barcode, setBarcode] = useState('')
  const [quickClientOpen, setQuickClientOpen] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350)
  const catalogQuery = useCatalogProducts(
    open ? debouncedSearch : '',
    DEFAULT_CATALOG_FILTERS,
    1,
  )

  const createMutation = useCreateCounterOrder()
  const updateMutation = useUpdateCounterOrder()
  const saving = createMutation.isPending || updateMutation.isPending

  // Edición: hidratar el carrito con los ítems resueltos del pedido.
  // Create: empezar limpio. (Se limpia SIEMPRE al abrir para no arrastrar
  // líneas de una sesión anterior del modal.)
  useEffect(() => {
    if (!open) return
    cart.clear()
    if (mode === 'edit' && editingOrder) {
      for (const item of editingOrder.items) {
        cart.addProduct({
          productId: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          variantId: item.variant_id ?? null,
          unit: item.unit,
          notes: item.notes ?? null,
          priceHint: item.unit_price_with_tax,
          stockHint: item.stock_available ?? null,
        })
      }
      cart.setClient({ id: editingOrder.client_id, name: editingOrder.client_name })
      cart.setNotes(editingOrder.notes ?? '')
    }
    setSearchTerm('')
    setBarcode('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, editingOrder])

  const handleAddProduct = useCallback(
    (
      product: CatalogProduct,
      variantId?: string | null,
      variantName?: string,
      stock?: number | null,
    ) => {
      cart.addProduct({
        productId: product.id,
        // La línea distingue base de variante: el backend solo guarda
        // variant_id (nombre crudo en el detalle) — el nombre visible viaja
        // en la línea del carrito.
        name: variantName ? `${product.name} · ${variantName}` : product.name,
        quantity: 1,
        variantId: variantId ?? null,
        unit: product.base_unit || 'unit',
        priceHint: product.current_price,
        stockHint: stock ?? product.stock_quantity,
      })
    },
    [cart],
  )

  const handleBarcode = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      const code = barcode.trim()
      if (!code) return
      const response = await saleService.salesScan(code, currentBranchId || undefined)
      // Shape de salesScan: { success, data: { decoded_barcode, product_name,
      // price_per_unit, stock_quantity, is_variable_measure, ... } }.
      const scanResult = response?.data as
        | {
            decoded_barcode?: { product_id?: string; unit?: string; quantity?: number };
            product_name?: string;
            price_per_unit?: number;
            stock_quantity?: number;
            is_variable_measure?: boolean;
          }
        | undefined
      const decoded = scanResult?.decoded_barcode
      if (!response?.success || !decoded?.product_id) {
        toast.error(t('counterorders.builder.barcode_not_found', 'No se encontró el producto escaneado'))
        setBarcode('')
        return
      }
      const isVariable = Boolean(scanResult?.is_variable_measure)
      cart.addProduct({
        productId: decoded.product_id,
        name: scanResult?.product_name || decoded.product_id,
        // Báscula: la cantidad viene codificada en el código de barras.
        quantity: isVariable ? Number(decoded.quantity || 1) : 1,
        unit: decoded.unit || 'unit',
        priceHint: scanResult?.price_per_unit ?? null,
        stockHint: scanResult?.stock_quantity ?? null,
      })
      setBarcode('')
    },
    [barcode, cart, currentBranchId, t, toast],
  )

  const handleClientSearch = useCallback(
    async (term: string): Promise<ClientDropdownItem[]> => {
      const clients = await searchClients(term)
      // displayName = nombre + apellido (normalizeClient); `.name` es solo el
      // primer nombre — el dropdown mostraba "Fernando" en vez de
      // "Fernando Maciel" (el wizard de /ventas ya usaba displayName).
      return clients.map(c => ({ id: String(c.id), name: String(c.displayName || c.name) }))
    },
    [searchClients],
  )

  const handleSelectClient = useCallback(
    (item: SearchableDropdownItem) => {
      cart.setClient({ id: String(item.id), name: String(item.name) })
    },
    [cart],
  )

  const handleClientCreated = useCallback(
    (client: { id?: string; name?: string } | null) => {
      setQuickClientOpen(false)
      if (client?.id) {
        cart.setClient({ id: String(client.id), name: String(client.name ?? client.id) })
      }
    },
    [cart],
  )

  const handleSave = useCallback(() => {
    if (!cart.client || cart.lines.length === 0) return
    const payload = {
      client_id: cart.client.id,
      items: cart.toPayloadItems(),
      notes: cart.notes.trim() || null,
    }
    if (mode === 'edit' && editingOrder) {
      updateMutation.mutate(
        { orderId: editingOrder.id, payload },
        {
          onSuccess: detail => {
            onSaved(detail)
          },
          onError: (err: Error) => toast.error(err.message),
        },
      )
      return
    }
    createMutation.mutate(payload, {
      onSuccess: detail => {
        onSaved(detail)
      },
      onError: (err: Error) => toast.error(err.message),
    })
  }, [cart, createMutation, editingOrder, mode, onSaved, toast, updateMutation])

  const handleRequestClose = useCallback(() => {
    if (cart.lines.length > 0) {
      setConfirmDiscard(true)
      return
    }
    onClose()
  }, [cart.lines.length, onClose])

  const searchPlaceholder = useMemo(
    () => t('counterorders.builder.search_placeholder', 'Buscar producto por nombre o código…'),
    [t],
  )

  const canSave = cart.client !== null && cart.lines.length > 0 && !saving

  return (
    <>
      <EnhancedModal
        isOpen={open}
        onClose={handleRequestClose}
        title={
          mode === 'edit'
            ? t('counterorders.builder.edit_title', 'Editar pedido {code}', {
                code: editingOrder?.code ?? '',
              })
            : t('counterorders.builder.new_title', 'Nuevo pedido')
        }
        size="full"
        testId="counterorder-builder"
        footer={
          <div className="flex justify-between items-center gap-sm w-full">
            <span className="text-body-sm text-on-surface-deep" data-testid="counterorder-builder-units">
              {t('counterorders.builder.units', '{count} unidades', { count: cart.units })}
            </span>
            <div className="flex justify-end gap-sm">
              <Button variant="secondary" onClick={handleRequestClose} disabled={saving}>
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button
                variant="default"
                onClick={handleSave}
                disabled={!canSave}
                data-testid="counterorder-builder-save"
              >
                <ShoppingCart className="size-4" aria-hidden="true" />
                {saving
                  ? t('counterorders.builder.saving', 'Guardando…')
                  : t('counterorders.builder.save', 'Guardar pedido')}
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          {/* ── Productos: búsqueda + escáner + grilla ── */}
          <section className="space-y-md min-w-0" aria-label={t('counterorders.builder.products', 'Productos')}>
            <form onSubmit={handleBarcode} className="flex gap-sm">
              <div className="relative flex-1">
                <Barcode
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-on-surface-deep pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder={t('counterorders.builder.barcode_placeholder', 'Escanear código de barras…')}
                  className="pl-8"
                  data-testid="counterorder-builder-barcode"
                />
              </div>
              <Button type="submit" variant="secondary" disabled={!barcode.trim()}>
                {t('counterorders.builder.scan', 'Escanear')}
              </Button>
            </form>

            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              data-testid="counterorder-builder-search"
            />

            {catalogQuery.isLoading && (
              <p className="text-body-sm text-on-surface-deep animate-pulse">
                {t('counterorders.builder.searching', 'Buscando productos…')}
              </p>
            )}
            {catalogQuery.data && catalogQuery.data.products.length === 0 && debouncedSearch && (
              <p className="text-body-sm text-on-surface-deep">
                {t('counterorders.builder.no_products', 'Sin resultados para "{term}".', {
                  term: debouncedSearch,
                })}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm overflow-y-auto max-h-[45vh] pr-1">
              {(catalogQuery.data?.products ?? []).map(product => (
                <ProductPickCard key={product.id} product={product} onAdd={handleAddProduct} />
              ))}
            </div>
          </section>

          {/* ── Carrito + cliente + notas ── */}
          <section className="space-y-md min-w-0" aria-label={t('counterorders.builder.cart', 'Carrito')}>
            <div className="space-y-sm">
              <span className="text-label-caps uppercase text-on-surface-deep">
                {t('counterorders.builder.client', 'Cliente (obligatorio)')}
              </span>
              <div className="flex gap-sm items-start">
                <div className="flex-1 min-w-0">
                  <SearchableDropdown<ClientDropdownItem>
                    onSelect={handleSelectClient}
                    onSearch={handleClientSearch}
                    placeholder={
                      cart.client?.name ||
                      t('counterorders.builder.client_placeholder', 'Buscar cliente por nombre…')
                    }
                    className="w-full"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuickClientOpen(true)}
                  data-testid="counterorder-builder-quick-client"
                >
                  <UserPlus className="size-4" aria-hidden="true" />
                  {t('counterorders.builder.quick_client', 'Alta rápida')}
                </Button>
              </div>
            </div>

            {cart.lines.length === 0 ? (
              <p className="text-body-sm text-on-surface-deep" data-testid="counterorder-builder-empty">
                {t('counterorders.builder.empty_cart', 'Agregá productos con la búsqueda o el escáner.')}
              </p>
            ) : (
              <ul className="space-y-sm overflow-y-auto max-h-[40vh]" data-testid="counterorder-builder-lines">
                {cart.lines.map(line => (
                  <li
                    key={line.key}
                    data-testid={`counterorder-line-${line.key}`}
                    className="bg-surface-muted rounded-sm p-sm space-y-xs"
                  >
                    <div className="flex items-start justify-between gap-sm">
                      <p className="text-body-sm-bold text-foreground min-w-0 truncate">{line.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error shrink-0"
                        onClick={() => cart.removeProduct(line.key)}
                        aria-label={`${t('counterorders.builder.remove', 'Quitar')} ${line.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-sm">
                      <div className="flex items-center gap-xs">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => cart.changeQuantity(line.key, line.quantity - 1)}
                          aria-label={t('counterorders.builder.decrease', 'Restar')}
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={e => cart.changeQuantity(line.key, Number(e.target.value))}
                          className="w-20 text-center"
                          aria-label={t('counterorders.builder.quantity', 'Cantidad')}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => cart.changeQuantity(line.key, line.quantity + 1)}
                          aria-label={t('counterorders.builder.increase', 'Sumar')}
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                      <span className="text-label-caps uppercase text-on-surface-deep">{line.unit}</span>
                      {line.price_hint != null && (
                        <span className="font-data-mono text-body-sm text-on-surface-deep ml-auto">
                          ≈ {formatCurrency(line.price_hint * line.quantity)}
                        </span>
                      )}
                    </div>
                    {line.notes != null && (
                      <p className="text-body-sm text-on-surface-deep">{line.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <label className="block space-y-xs">
              <span className="text-label-caps uppercase text-on-surface-deep">
                {t('counterorders.builder.order_notes', 'Nota para la caja (opcional)')}
              </span>
              <textarea
                value={cart.notes}
                onChange={e => cart.setNotes(e.target.value)}
                rows={2}
                placeholder={t('counterorders.builder.order_notes_placeholder', 'Ej.: facturar a razón social…')}
                className="w-full rounded-input border border-border-subtle bg-surface px-3 py-2 text-body-md text-foreground placeholder:text-on-surface-deep focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="counterorder-builder-notes"
              />
            </label>
          </section>
        </div>
      </EnhancedModal>

      {/* Alta rápida de cliente */}
      <QuickClientModal
        isOpen={quickClientOpen}
        onClose={() => setQuickClientOpen(false)}
        onCreated={handleClientCreated}
      />

      {/* Guard: hay líneas sin guardar */}
      <EnhancedModal
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title={t('counterorders.builder.discard_title', '¿Descartar el carrito?')}
        variant="warning"
        size="sm"
        testId="counterorder-discard-dialog"
        footer={
          <div className="flex justify-end gap-sm">
            <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
              {t('counterorders.builder.discard_keep', 'Seguir editando')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDiscard(false)
                cart.clear()
                onClose()
              }}
            >
              {t('counterorders.builder.discard_confirm', 'Descartar')}
            </Button>
          </div>
        }
      >
        <p className="text-body-md text-foreground">
          {t(
            'counterorders.builder.discard_message',
            'Hay productos sin guardar en el carrito. Si salís, se pierden.',
          )}
        </p>
      </EnhancedModal>
    </>
  )
}
