/**
 * SupplierStep — paso 1 del PurchaseCheckoutWizard.
 *
 * Búsqueda y selección del proveedor. La búsqueda y navegación por teclado
 * del dropdown se delegan al hook usePurchasesLogic (vía props), que ya tiene
 * debounce, activeSupplierIndex y handleSupplierSearchKeyDown.
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
          <Building size={18} className="text-primary" aria-hidden="true" />
          <h3 className="text-label-caps uppercase text-on-surface-deep">
            {t('purchases.checkoutWizard.step.supplier', 'Proveedor')}
          </h3>
        </div>

        {!selectedSupplier ? (
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-fg" size={16} aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                aria-label={t('purchases.checkoutWizard.supplier.placeholder', 'Buscar proveedor por nombre o RUC... (F3)')}
                placeholder={t(
                  'purchases.checkoutWizard.supplier.placeholder',
                  'Buscar proveedor por nombre o RUC... (F3)',
                )}
                className="w-full pl-9 pr-9 py-2.5 bg-surface border border-border-subtle rounded-input text-body-md text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-150"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                onFocus={() => setShowSupplierDropdown(true)}
                onKeyDown={onSearchKeyDown}
              />
              {searchingSuppliers && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              )}
            </div>

            {showSupplierDropdown && supplierResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-md shadow-fluent-8 border border-border-subtle overflow-hidden z-30 py-1 max-h-[220px] overflow-y-auto" role="listbox">
                {supplierResults.map((s, index) => {
                  const isActive = activeSupplierIndex === index
                  return (
                    <button
                      key={s.id}
                      role="option"
                      aria-selected={isActive}
                      className={cn(
                        'w-full px-4 py-2.5 text-left flex justify-between items-center transition-colors duration-150 cursor-pointer',
                        index < supplierResults.length - 1 && 'border-b border-border-subtle',
                        isActive ? 'bg-primary/5 ring-1 ring-inset ring-primary' : 'hover:bg-surface-muted',
                      )}
                      onClick={() => onSupplierSelect(s)}
                      onMouseEnter={() => setActiveSupplierIndex(index)}
                    >
                      <span className={cn('text-body-md-bold', isActive ? 'text-primary' : 'text-foreground')}>
                        {getSupplierName(s)}
                      </span>
                      <span className="text-body-sm font-data-mono text-outline-fg">ID: {s.id}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-surface rounded-md border border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-title-md text-primary leading-tight mb-1">
                  {getSupplierName(selectedSupplier)}
                </p>
                {selectedSupplier.tax_id && (
                  <div className="text-body-md text-on-surface-deep flex items-center gap-1.5">
                    <Badge variant="secondary" size="sm">RUC</Badge>
                    <span className="font-data-mono">{selectedSupplier.tax_id}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearSupplier}
                aria-label={t('purchases.checkoutWizard.supplier.clear', 'Quitar proveedor')}
                className="text-outline-fg hover:text-error hover:bg-error-container"
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  },
)

SupplierStep.displayName = 'SupplierStep'
