import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Barcode, Minus, Plus, ShoppingCart, Trash2, UserPlus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableDropdown, type SearchableDropdownItem } from '@/components/ui/SearchableDropdown'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { useToast } from '@/hooks/useToast'
import { useBranch } from '@/contexts/BranchContext'
import useClientStore from '@/store/useClientStore'
import QuickClientModal from '@/features/party/components/QuickClientModal'
import { saleService } from '@/services/saleService'
import { formatCurrency } from '@/utils/currencyUtils'
import { fetchCatalogSellableUnits } from '@/features/catalog/hooks/useCatalogProducts'
import { DEFAULT_CATALOG_FILTERS, type CatalogSellableUnit } from '@/features/catalog/types'
import { cn } from '@/lib/utils'
import { useCreateCounterOrder, useUpdateCounterOrder } from '../hooks/useCounterOrders'
import { useOrderCart } from '../hooks/useOrderCart'
import type { CounterOrderDetail } from '../types'

// ===========================================================================
// OrderBuilder (PLAN_PEDIDOS_MOSTRADOR — FASE 2.1; picker plano:
// PLAN_BUSQUEDA_VARIANTES_PLANAS F3). Carrito del vendedor: busca unidades
// vendibles (granularity=variant — cada fila ya resuelve producto+variante),
// escanea códigos de barra, asocia cliente, guarda el pedido OPEN.
// Búsqueda y carrito siguen el patrón de /ventas: input + dropmenu de
// resultados y tabla de datos §6.3 (DESIGN.md).
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

/** Fila del dropmenu de productos: unidad vendible con los campos que la
 * fila muestra (nombre compuesto, SKU, P.V.P., stock propio). */
interface ProductPickItem extends SearchableDropdownItem {
  id: string
  name: string
  variant_id?: string | null
  variant_name?: string | null
  sku?: string
  is_base_row: boolean
  current_price?: number | null
  stock_quantity?: number | null
  stock_status: string
  base_unit?: string | null
}

function toPickItem(unit: CatalogSellableUnit): ProductPickItem {
  return {
    id: unit.id,
    name: unit.name,
    variant_id: unit.variant_id ?? null,
    variant_name: unit.variant_name ?? null,
    // SearchableDropdownItem tipa sku como string (los null vienen como undefined).
    sku: unit.sku ?? undefined,
    is_base_row: unit.is_base_row,
    current_price: unit.current_price ?? null,
    stock_quantity: unit.stock_quantity ?? null,
    stock_status: unit.stock_status,
    base_unit: unit.base_unit ?? null,
  }
}

/** Fila del dropmenu de unidades vendibles (memoizada: el listbox re-renderiza
 * en cada flecha de navegación). El click lo maneja el botón contenedor del
 * SearchableDropdown; acá solo se pinta el contenido. */
const ProductPickRow = memo(function ProductPickRow({ unit }: { unit: ProductPickItem }) {
  const { t } = useI18n()
  const label = unit.variant_name ? `${unit.name} · ${unit.variant_name}` : unit.name
  const stock = unit.stock_quantity ?? null
  const outOfStock = unit.stock_status === 'out_of_stock' || (stock !== null && stock <= 0)
  const stockLabel =
    stock == null || stock <= 0
      ? t('counterorders.builder.out_of_stock', 'Sin stock')
      : `${t('counterorders.builder.stock', 'Stock')}: ${stock}`

  return (
    <div
      data-testid={`counterorder-pick-${unit.variant_id ?? unit.id}`}
      className="flex items-center justify-between gap-sm min-w-0"
    >
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-xs min-w-0">
          <p className="text-body-sm-bold text-foreground truncate uppercase" title={label}>
            {label}
          </p>
          {unit.is_base_row && (
            <span className="shrink-0 rounded-sm bg-surface-muted px-xs py-0.5 text-label-caps uppercase text-on-surface-deep">
              {t('counterorders.builder.base_product', 'Producto base')}
            </span>
          )}
        </div>
        {unit.sku && (
          <span className="font-data-mono text-label-caps uppercase text-on-surface-deep truncate" title={unit.sku}>
            {unit.sku}
          </span>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <span className="font-data-mono text-body-sm text-primary whitespace-nowrap">
          {unit.current_price != null ? formatCurrency(unit.current_price) : '—'}
        </span>
        <span
          className={cn(
            'text-label-caps uppercase whitespace-nowrap',
            outOfStock ? 'text-error' : 'text-on-surface-deep',
          )}
        >
          {stockLabel}
        </span>
      </div>
    </div>
  )
})

export function OrderBuilder({ open, mode, editingOrder, onClose, onSaved }: OrderBuilderProps) {
  const { t } = useI18n()
  const toast = useToast()
  const { currentBranchId } = useBranch()
  const searchClients = useClientStore(state => state.searchClients)

  const cart = useOrderCart()
  const [barcode, setBarcode] = useState('')
  const [quickClientOpen, setQuickClientOpen] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  /** Escáner: recibe el autofoco al abrir y el foco tras cada scan. */
  const barcodeRef = useRef<HTMLInputElement>(null)
  /** Buscador de productos: F3 (§12.5) + foco tras agregar del dropmenu. */
  const productSearchRef = useRef<HTMLInputElement>(null)

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
    setBarcode('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, editingOrder])

  // Autofoco al escáner (§12.5: el primer campo recibe el foco; el tick
  // gana la carrera contra el focus() del contenedor de EnhancedModal).
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => barcodeRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [open])

  // F3 enfoca el buscador de productos (§12.5: listeners del modal, solo
  // registrados mientras está abierto).
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F3') {
        event.preventDefault()
        productSearchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Dropmenu de productos (mismo camino plano que /ventas): la búsqueda vive
  // dentro del SearchableDropdown (debounce + ↑↓/Enter/Esc); acá solo se
  // resuelve la página de unidades vendibles.
  const handleProductSearch = useCallback(
    async (term: string): Promise<ProductPickItem[]> => {
      const page = await fetchCatalogSellableUnits(term, DEFAULT_CATALOG_FILTERS, 1)
      return page.products.map(toPickItem)
    },
    [],
  )

  // Un pedido admite productos sin stock (§5.2): el stock se valida hard al
  // procesar la venta; en el dropmenu es solo warning informativo.
  const handleAddUnit = useCallback(
    (unit: ProductPickItem) => {
      cart.addProduct({
        productId: unit.id,
        // La línea distingue base de variante: el backend solo guarda
        // variant_id — el nombre visible compone "Producto · Variante".
        name: unit.variant_name ? `${unit.name} · ${unit.variant_name}` : unit.name,
        quantity: 1,
        variantId: unit.variant_id ?? null,
        unit: unit.base_unit || 'unit',
        priceHint: unit.current_price,
        stockHint: unit.stock_quantity,
      })
      // Flujo de carga rápida: tras elegir una fila (con click el foco quedó
      // en el listbox), volver al buscador para la siguiente unidad.
      productSearchRef.current?.focus()
    },
    [cart],
  )

  // ↑/↓ dentro de un input de cantidad mueve el foco a la línea anterior /
  // siguiente del carrito (las dos vistas comparten data-qty-input).
  const moveQtyFocus = useCallback((current: EventTarget | null, delta: 1 | -1) => {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[data-qty-input]')
    const index = current instanceof HTMLInputElement ? Array.from(inputs).indexOf(current) : -1
    const next = index >= 0 ? inputs[index + delta] : undefined
    if (next) {
      next.focus()
      next.select()
    }
  }, [])

  const handleQtyNavKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveQtyFocus(event.target, 1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveQtyFocus(event.target, -1)
      }
    },
    [moveQtyFocus],
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

  const searchPlaceholder = t(
    'counterorders.builder.search_placeholder',
    'Buscar producto por nombre o código… (F3)',
  )

  // Discoverability (§12.5.4): hints kbd en el footer, patrón wizard de
  // compras. Antes del return — Rules of Hooks.
  const kbdHints = useMemo<Array<{ kbd: string; label: string }>>(
    () => [
      { kbd: 'F3', label: t('counterorders.builder.hints.search', 'Buscar') },
      { kbd: '↑↓', label: t('counterorders.builder.hints.qty_nav', 'Cantidades') },
    ],
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
            <div className="flex items-center gap-md min-w-0">
              <span className="text-body-sm text-on-surface-deep" data-testid="counterorder-builder-units">
                {t('counterorders.builder.units', '{count} unidades', { count: cart.units })}
              </span>
              <div className="hidden md:flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-deep">
                {kbdHints.map(hint => (
                  <span key={hint.kbd} className="inline-flex items-center gap-1">
                    <kbd className="font-data-mono px-1.5 py-0.5 rounded-xs border border-divider bg-surface text-foreground text-body-sm-bold leading-none">
                      {hint.kbd}
                    </kbd>
                    <span>{hint.label}</span>
                  </span>
                ))}
              </div>
            </div>
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
          {/* ── Productos: búsqueda (input + dropmenu) + escáner ── */}
          <section className="space-y-md min-w-0" aria-label={t('counterorders.builder.products', 'Productos')}>
            <form autoComplete="off" onSubmit={handleBarcode} className="flex gap-sm">
              <div className="relative flex-1">
                <Barcode
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-on-surface-deep pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  ref={barcodeRef}
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

            {/* Dropmenu de resultados (patrón /ventas): cada fila es una
                unidad vendible y el click la agrega al carrito. */}
            <SearchableDropdown<ProductPickItem>
              onSelect={handleAddUnit}
              onSearch={handleProductSearch}
              inputRef={productSearchRef}
              placeholder={searchPlaceholder}
              minSearchLength={2}
              debounceMs={350}
              emptyMessage={t('counterorders.builder.no_results', 'Sin resultados para la búsqueda.')}
              renderItem={unit => <ProductPickRow unit={unit} />}
            />
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

            {/* Carrito §6.3 (DESIGN.md): card con tabla full-bleed; el empty
                vive DENTRO de la tabla (fila colSpan), como el carrito de
                /ventas. En mobile cae a cards (misma partición del POS). */}
            <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
              <div className="hidden md:block overflow-y-auto max-h-[38vh]">
                <Table className="table-fixed">
                  <TableHeader className="bg-surface-muted">
                    <TableRow className="hover:bg-surface-muted border-0">
                      <TableHead className="px-sm py-sm text-label-caps uppercase text-on-surface-deep">
                        {t('counterorders.builder.col.product', 'Producto')}
                      </TableHead>
                      <TableHead className="w-[132px] px-sm py-sm text-label-caps uppercase text-on-surface-deep text-center">
                        {t('counterorders.builder.col.qty', 'Cant.')}
                      </TableHead>
                      <TableHead className="w-[110px] px-sm py-sm text-label-caps uppercase text-on-surface-deep text-right">
                        {t('counterorders.builder.col.total', 'Total est.')}
                      </TableHead>
                      <TableHead className="w-[48px] px-sm py-sm">
                        <span className="sr-only">
                          {t('counterorders.builder.col.actions', 'Acciones')}
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-testid="counterorder-builder-lines">
                    {cart.lines.length === 0 ? (
                      <TableRow className="hover:bg-transparent border-0">
                        <TableCell colSpan={4} className="py-xl">
                          <div
                            className="flex flex-col items-center justify-center gap-sm text-on-surface-deep"
                            data-testid="counterorder-builder-empty"
                          >
                            <div className="size-16 rounded-full bg-surface-muted flex items-center justify-center">
                              <ShoppingCart
                                size={28}
                                strokeWidth={1.5}
                                className="text-outline-fg"
                                aria-hidden="true"
                              />
                            </div>
                            <p className="text-body-md-bold text-foreground">
                              {t('counterorders.builder.empty_cart_title', 'Carrito vacío')}
                            </p>
                            <p className="text-body-sm text-on-surface-deep">
                              {t(
                                'counterorders.builder.empty_cart',
                                'Agregá productos con la búsqueda o el escáner.',
                              )}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cart.lines.map(line => (
                        <TableRow
                          key={line.key}
                          data-testid={`counterorder-line-${line.key}`}
                          className="hover:bg-surface-muted transition-colors duration-150"
                        >
                          <TableCell className="px-sm py-sm align-top min-w-0">
                            <p className="text-body-sm-bold text-foreground truncate" title={line.name}>
                              {line.name}
                            </p>
                            <p
                              className="text-label-caps uppercase text-on-surface-deep mt-0.5 truncate whitespace-nowrap"
                              title={line.unit}
                            >
                              {line.unit}
                            </p>
                            {line.notes != null && (
                              <p className="text-body-sm text-on-surface-deep mt-0.5">{line.notes}</p>
                            )}
                          </TableCell>
                          <TableCell className="px-sm py-sm align-top">
                            <div className="flex items-center justify-center gap-xs">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="size-7 shrink-0"
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
                                onKeyDown={handleQtyNavKeyDown}
                                data-qty-input
                                className="w-12 h-8 text-center px-0"
                                aria-label={t('counterorders.builder.quantity', 'Cantidad')}
                              />
                              <Button
                                variant="secondary"
                                size="icon"
                                className="size-7 shrink-0"
                                onClick={() => cart.changeQuantity(line.key, line.quantity + 1)}
                                aria-label={t('counterorders.builder.increase', 'Sumar')}
                              >
                                <Plus className="size-3.5" aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="px-sm py-sm text-right text-body-sm-bold font-data-mono text-foreground align-top whitespace-nowrap">
                            {line.price_hint != null
                              ? formatCurrency(line.price_hint * line.quantity)
                              : '—'}
                          </TableCell>
                          <TableCell className="px-sm py-sm text-right align-top">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-outline-fg hover:text-error hover:bg-error-container rounded-button"
                              onClick={() => cart.removeProduct(line.key)}
                              aria-label={`${t('counterorders.builder.remove', 'Quitar')} ${line.name}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: cards */}
              <div className="md:hidden divide-y divide-divider">
                {cart.lines.length === 0 ? (
                  <div className="py-lg px-md text-center text-body-sm text-on-surface-deep">
                    {t(
                      'counterorders.builder.empty_cart',
                      'Agregá productos con la búsqueda o el escáner.',
                    )}
                  </div>
                ) : (
                  cart.lines.map(line => (
                    <div key={line.key} className="py-md px-md space-y-sm">
                      <div className="flex items-start justify-between gap-sm">
                        <div className="min-w-0">
                          <p className="text-body-sm-bold text-foreground truncate" title={line.name}>
                            {line.name}
                          </p>
                          <p className="text-label-caps uppercase text-on-surface-deep mt-0.5">
                            {line.unit}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-error shrink-0"
                          onClick={() => cart.removeProduct(line.key)}
                          aria-label={`${t('counterorders.builder.remove', 'Quitar')} ${line.name}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between gap-sm">
                        <div className="flex items-center gap-xs">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7"
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
                            onKeyDown={handleQtyNavKeyDown}
                            data-qty-input
                            className="w-14 h-8 text-center"
                            aria-label={t('counterorders.builder.quantity', 'Cantidad')}
                          />
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7"
                            onClick={() => cart.changeQuantity(line.key, line.quantity + 1)}
                            aria-label={t('counterorders.builder.increase', 'Sumar')}
                          >
                            <Plus className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                        {line.price_hint != null && (
                          <span className="font-data-mono text-body-sm text-on-surface-deep">
                            ≈ {formatCurrency(line.price_hint * line.quantity)}
                          </span>
                        )}
                      </div>
                      {line.notes != null && (
                        <p className="text-body-sm text-on-surface-deep">{line.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

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
