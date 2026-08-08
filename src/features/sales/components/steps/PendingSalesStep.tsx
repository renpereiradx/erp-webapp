/**
 * PendingSalesStep — paso condicional del SaleCheckoutWizard.
 *
 * Aparece cuando el cliente seleccionado tiene ventas pendientes. Permite
 * elegir entre continuar una venta existente (merge) o crear una nueva.
 * Migra el modal inline de SalesNew (ventas pendientes detectadas) a un
 * paso del stepper, con navegación por flechas ↑↓ y soporte de teclado.
 */
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { History, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currencyUtils'
import { useI18n } from '@/lib/i18n'

export interface PendingSalesStepRef {
  focus: () => void
}

interface PendingSalesStepProps {
  activeSales: any[]
  currentBranchId?: number | string | null
  selectedIndex: number
  onSelectIndex: (index: number) => void
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
          <h3 className="text-title-md text-on-surface">
            {t('sales.checkoutWizard.pendingSales.title', 'El cliente tiene ventas pendientes')}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {t(
              'sales.checkoutWizard.pendingSales.subtitle',
              'Elegí si continuar una venta existente o crear una nueva',
            )}
          </p>
        </div>

        <div ref={listRef} className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {activeSales.map((sale, index) => {
            const isSelected = index === selectedIndex
            const isFromOtherBranch =
              sale.branch_id && currentBranchId != null && String(sale.branch_id) !== String(currentBranchId)
            return (
              <button
                key={sale.id || index}
                type="button"
                data-idx={index}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onSelectIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    onSelectIndex(Math.min(index + 1, activeSales.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    onSelectIndex(Math.max(index - 1, 0))
                  }
                }}
                className={cn(
                  'w-full text-left p-4 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-outline-variant bg-surface-container-lowest hover:border-primary/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        'size-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        isSelected ? 'border-primary bg-primary' : 'border-outline',
                      )}
                    >
                      {isSelected && <div className="size-1.5 rounded-full bg-on-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-on-surface truncate font-data-mono">#{sale.id}</p>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                        <History size={12} />
                        <span>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('es-PY') : '—'}</span>
                        <span>•</span>
                        <span>{sale.items_count ?? sale.item_count ?? '?'} ítems</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                      {t('sales.checkoutWizard.total', 'Total')}
                    </p>
                    <p className="font-data-mono font-bold text-on-surface">
                      {formatCurrency(Number(sale.total_amount) || 0, sale.currency || 'PYG')}
                    </p>
                    {isFromOtherBranch && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase text-orange-700 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
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

        <p className="text-xs text-on-surface-variant">
          {t('sales.checkoutWizard.action.continueSelected', 'Continuar seleccionada')} ·{' '}
          {t('sales.checkoutWizard.action.newSale', 'Nueva venta')} (↑↓ para navegar)
        </p>
      </div>
    )
  },
)

PendingSalesStep.displayName = 'PendingSalesStep'
