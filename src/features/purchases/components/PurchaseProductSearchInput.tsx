/**
 * PurchaseProductSearchInput — buscador de productos de compras + dropdown.
 *
 * Una sola implementación para las dos superficies que buscan productos en
 * compras: el encabezado del carrito (entrada principal — al elegir una fila
 * se abre el modal de detalles con el producto precargado) y el buscador
 * interno del modal (cambiar de producto).
 *
 * Presentacional: el estado (término, resultados con debounce, highlight)
 * vive en usePurchasesLogic y llega por props. `open` lo decide el llamador
 * (p.ej. el carrito no muestra el dropdown mientras el modal está abierto).
 */
import React from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export interface PurchaseProductSearchInputProps {
  id: string
  search: string
  onSearchChange: (value: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  dropdownRef: React.RefObject<HTMLDivElement | null>
  results: any[]
  searching: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onSelect: (product: any) => void
  getProductName: (product: any) => string
  placeholder: string
  /** Etiqueta visible sobre el input (buscador interno del modal). */
  label?: string
  /** Clases extra para el input (p.ej. bg-surface sobre header muted). */
  inputClassName?: string
  /** Sin permiso de escritura la búsqueda queda deshabilitada. */
  disabled?: boolean
}

export const PurchaseProductSearchInput: React.FC<PurchaseProductSearchInputProps> = ({
  id,
  search,
  onSearchChange,
  inputRef,
  dropdownRef,
  results,
  searching,
  open,
  onOpenChange,
  activeIndex,
  onActiveIndexChange,
  onKeyDown,
  onSelect,
  getProductName,
  placeholder,
  label,
  inputClassName,
  disabled,
}) => {
  const { t } = useI18n()

  return (
    <div className='space-y-xs'>
      {label && (
        <label htmlFor={id} className='text-label-caps uppercase text-on-surface-deep block'>
          {label}
        </label>
      )}
      <div className='relative'>
        <Search
          className='absolute left-3 top-1/2 -translate-y-1/2 text-outline-fg'
          size={16}
          aria-hidden='true'
        />
        <input
          ref={inputRef}
          id={id}
          type='text'
          disabled={disabled}
          aria-label={placeholder}
          className={cn(
            'w-full pl-9 pr-9 py-2.5 bg-surface-muted border border-border-subtle rounded-input text-body-md text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-150',
            inputClassName,
          )}
          placeholder={placeholder}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => onOpenChange(true)}
        />
        {searching && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin' aria-hidden='true' />
        )}

        {open && results.length > 0 && (
          <div
            ref={dropdownRef}
            className='absolute top-full left-0 right-0 mt-1 bg-surface rounded-md shadow-fluent-8 border border-border-subtle overflow-hidden z-50 max-h-[220px] overflow-y-auto py-1'
            role='listbox'
          >
            {results.map((p, index) => {
              const isActive = activeIndex === index

              return (
                <div
                  key={p.variant_id || p.id || p.product_id}
                  data-product-index={index}
                  role='option'
                  aria-selected={isActive}
                  className={cn(
                    'relative px-md py-2.5 cursor-pointer flex justify-between items-center transition-colors duration-150',
                    index < results.length - 1 && 'border-b border-border-subtle',
                    isActive
                      ? 'bg-primary/5 ring-1 ring-inset ring-primary'
                      : 'hover:bg-surface-muted'
                  )}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  onClick={() => onSelect(p)}
                >
                  {isActive && (
                    <span
                      className='absolute left-0 top-1 bottom-1 w-1 rounded-r-sm bg-primary'
                      aria-hidden='true'
                    />
                  )}
                  <div className='min-w-0 flex-1'>
                    <div
                      className={cn(
                        'text-body-md-bold truncate',
                        isActive ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {/* Fila plana: "Producto · Variante" cuando la unidad es una variante */}
                      {p.variant_name
                        ? `${getProductName(p)} · ${p.variant_name}`
                        : getProductName(p)}
                    </div>
                    <div className='flex flex-wrap gap-1.5 mt-0.5 items-center'>
                      <span className='text-body-sm font-data-mono text-outline-fg'>
                        {p.sku || `ID: ${p.id || p.product_id || '-'}`}
                      </span>
                      {/* Fila base de un producto con variantes */}
                      {p.is_base_row && (
                        <Badge variant='secondary' size='sm'>
                          {t('purchases.product_modal.base_row', 'Producto base')}
                        </Badge>
                      )}
                      {/* Indicador de variantes (solo filas sin variante resuelta) */}
                      {!p.variant_id && ((p.has_variant || p.has_variants) || (Array.isArray(p.variants) && p.variants.length > 0)) && (
                        <Badge variant='info' size='sm'>
                          {t('purchases.product_modal.variants_badge', 'Variantes')}
                        </Badge>
                      )}
                      {/* Marca */}
                      {p.brand_name && (
                        <Badge variant='secondary' size='sm'>
                          {p.brand_name}
                        </Badge>
                      )}
                      {/* Tags (máx 2, color dinámico del dato) */}
                      {Array.isArray(p.tags) && p.tags.slice(0, 2).map((tag: any) => (
                        <span
                          key={tag.id}
                          className='inline-flex items-center px-1.5 py-0.5 rounded-xs text-body-sm-bold text-on-primary'
                          style={tag.color ? { backgroundColor: tag.color } : undefined}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className='text-right shrink-0 ml-3'>
                    <div
                      className={cn(
                        'text-body-sm font-data-mono',
                        (p.stock_quantity ?? p.stock ?? p.quantity_available ?? 0) > 0 ? 'text-success' : 'text-error'
                      )}
                    >
                      {t('purchases.product_modal.stock_label', 'Stock:')}{' '}
                      {p.stock_quantity ?? p.stock ?? p.quantity_available ?? 0}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchaseProductSearchInput
