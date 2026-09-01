/**
 * PendingSalesStep — paso condicional del SaleCheckoutWizard.
 *
 * Aparece cuando el cliente seleccionado tiene ventas pendientes. La lista
 * siempre arranca con la fila "Nueva venta" (seleccionada por defecto:
 * índice 0) seguida de las ventas pendientes (índices 1..N). Elegir una
 * venta la continúa (merge); elegir "Nueva venta" y avanzar cobra el
 * carrito actual como venta aparte.
 *
 * Las tarjetas de venta muestran id, fecha, cantidad de ítems, total y los
 * productos (del shape normalizado por saleService.getPendingSalesByClient).
 * Navegación por flechas ↑↓ con soporte de teclado.
 */
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { History, MapPin, Plus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, normalizeCurrencyCode } from '@/utils/currencyUtils'
import { useI18n } from '@/lib/i18n'

export interface PendingSalesStepRef {
  focus: () => void
}

interface PendingSalesStepProps {
  activeSales: any[]
  currentBranchId?: number | string | null
  /** 0 = fila "Nueva venta"; i>=1 = activeSales[i - 1]. */
  selectedIndex: number
  onSelectIndex: (index: number) => void
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
  ({ activeSales, currentBranchId, selectedIndex, onSelectIndex }, ref) => {
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
            {t('sales.checkoutWizard.pendingSales.title', 'El cliente tiene ventas pendientes')}
          </h3>
          <p className="text-body-sm text-on-surface-deep">
            {t(
              'sales.checkoutWizard.pendingSales.subtitle',
              'Elegí continuar una venta existente o empezar una nueva',
            )}
          </p>
        </div>

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
