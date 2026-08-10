/**
 * SupplierStep — paso 1 del PurchaseCheckoutWizard.
 *
 * Búsqueda y selección del proveedor. Migra la lógica inline de
 * PurchaseCheckoutModal a un paso del stepper. La búsqueda y navegación
 * por teclado del dropdown se delegan al hook usePurchasesLogic (vía props),
 * que ya tiene debounce, activeSupplierIndex y handleSupplierSearchKeyDown.
 */
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Building, X, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export interface SupplierStepRef {
  focus: () => void
  focusSearch: () => void
}

interface SupplierStepProps {
  selectedSupplier: any | null
  supplierSearch: string
  setSupplierSearch: (v: string) => void
  supplierResults: any[]
  searchingSuppliers: boolean
  showSupplierDropdown: boolean
  setShowSupplierDropdown: (v: boolean) => void
  activeSupplierIndex: number
  setActiveSupplierIndex: (v: number) => void
  onSupplierSelect: (s: any) => void
  onClearSupplier: () => void
  onSearchKeyDown: (e: React.KeyboardEvent) => void
  searchRef: React.RefObject<HTMLDivElement | null>
  getSupplierName: (s: any) => string
}

export const SupplierStep = forwardRef<SupplierStepRef, SupplierStepProps>(
  (
    {
      selectedSupplier,
      supplierSearch,
      setSupplierSearch,
      supplierResults,
      searchingSuppliers,
      showSupplierDropdown,
      setShowSupplierDropdown,
      activeSupplierIndex,
      setActiveSupplierIndex,
      onSupplierSelect,
      onClearSupplier,
      onSearchKeyDown,
      searchRef,
      getSupplierName,
    },
    ref,
  ) => {
    const { t } = useI18n()
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      focusSearch: () => {
        inputRef.current?.focus()
        inputRef.current?.select?.()
      },
    }))

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Building size={18} className="text-primary" />
          <h3 className="text-label-caps text-on-surface-variant">
            {t('purchases.checkoutWizard.step.supplier', 'Proveedor')}
          </h3>
        </div>

        {!selectedSupplier ? (
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
              <input
                ref={inputRef}
                type="text"
                placeholder={t(
                  'purchases.checkoutWizard.supplier.placeholder',
                  'Buscar proveedor por nombre o RUC... (F3)',
                )}
                className="w-full pl-9 pr-9 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-md text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                onFocus={() => setShowSupplierDropdown(true)}
                onKeyDown={onSearchKeyDown}
              />
              {searchingSuppliers && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {showSupplierDropdown && supplierResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-md shadow-lg border border-outline-variant overflow-hidden z-30 py-1 max-h-[220px] overflow-y-auto">
                {supplierResults.map((s, index) => {
                  const isActive = activeSupplierIndex === index
                  return (
                    <button
                      key={s.id}
                      className={cn(
                        'w-full px-4 py-2.5 text-left border-b border-surface-variant last:border-none flex justify-between items-center transition-colors',
                        isActive ? 'bg-primary/5 ring-1 ring-inset ring-primary' : 'hover:bg-surface-container-low',
                      )}
                      onClick={() => onSupplierSelect(s)}
                      onMouseEnter={() => setActiveSupplierIndex(index)}
                    >
                      <span className={cn('font-medium text-sm', isActive ? 'text-primary' : 'text-on-surface')}>
                        {getSupplierName(s)}
                      </span>
                      <span className="text-xs text-outline">ID: {s.id}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-surface-container-lowest rounded-md border-2 border-primary/20 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-primary text-lg leading-tight mb-1">
                  {getSupplierName(selectedSupplier)}
                </p>
                {selectedSupplier.tax_id && (
                  <p className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">RUC</Badge>
                    {selectedSupplier.tax_id}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearSupplier}
                className="text-outline hover:text-error hover:bg-error-container"
              >
                <X size={18} />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  },
)

SupplierStep.displayName = 'SupplierStep'
