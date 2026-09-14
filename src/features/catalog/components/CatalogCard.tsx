import { Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatCurrency } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import type { CatalogSellableUnit } from '../types'

interface CatalogCardProps {
  unit: CatalogSellableUnit
}

/**
 * Tarjeta del catálogo comercial por unidad vendible
 * (PLAN_CATALOGO_VENDEDOR 3.3; PLAN_BUSQUEDA_VARIANTES_PLANAS F4): imagen,
 * nombre compuesto "Producto · Variante", marca/categoría, SKU/código,
 * P.V.P. con IVA e indicador de stock PROPIO de la unidad. Nada de costo,
 * margen ni proveedor; sin expandir variantes (ya son filas propias).
 */
export function CatalogCard({ unit }: CatalogCardProps) {
  const { t } = useI18n()
  const label = unit.variant_name ? `${unit.name} · ${unit.variant_name}` : unit.name
  const testId = unit.variant_id ?? unit.id
  const stock = unit.stock_quantity ?? 0
  const isOutOfStock = unit.stock_status === 'out_of_stock' || stock <= 0
  const isLowStock = !isOutOfStock && unit.stock_status === 'low_stock'

  return (
    <article
      data-testid={`catalog-card-${testId}`}
      className="bg-surface rounded-md shadow-whisper border border-border-subtle p-md flex flex-col gap-sm animate-in fade-in duration-200"
    >
      <div className="flex items-start gap-md">
        <div className="size-14 bg-surface-muted rounded-sm border border-border-subtle flex items-center justify-center overflow-hidden text-on-surface-deep shrink-0">
          {unit.image_url ? (
            <img src={unit.image_url} alt={label} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-body-md-bold text-foreground break-words" title={label}>
            {label}
          </h3>
          <p className="text-body-sm text-on-surface-deep truncate">
            {[unit.brand_name, unit.category_name].filter(Boolean).join(' · ') || '—'}
          </p>
          {(unit.sku || unit.barcode || unit.base_unit) && (
            <p className="text-label-caps uppercase text-on-surface-deep mt-xs font-data-mono truncate">
              {unit.sku || unit.barcode || unit.base_unit}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-sm gap-y-xs mt-auto pt-sm border-t border-border-subtle">
        <div className="flex flex-col">
          <span className="text-label-caps uppercase text-on-surface-deep">
            {t('catalog.card.pvp', 'P.V.P. (Con IVA)')}
          </span>
          <span
            data-testid={`catalog-price-${testId}`}
            className="font-data-mono text-title-md text-primary leading-none"
          >
            {unit.current_price != null ? formatCurrency(unit.current_price) : '—'}
          </span>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-body-sm-bold uppercase whitespace-nowrap',
            isOutOfStock
              ? 'bg-error/10 text-error'
              : isLowStock
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success',
          )}
        >
          {isOutOfStock
            ? t('catalog.card.out_of_stock', 'Sin stock')
            : `${t('catalog.card.stock', 'Stock')}: ${stock} ${unit.base_unit || ''}`}
        </span>
      </div>
    </article>
  )
}
