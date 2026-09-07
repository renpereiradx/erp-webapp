import { useState } from 'react'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import type { CatalogProduct } from '../types'
import { useCatalogVariants } from '../hooks/useCatalogProducts'

interface CatalogCardProps {
  product: CatalogProduct
}

/**
 * Tarjeta del catálogo comercial (PLAN_CATALOGO_VENDEDOR 3.3): imagen,
 * nombre, marca/categoría, SKU/código de barras, P.V.P. con IVA, indicador
 * de stock y variantes expandibles. Nada de costo, margen ni proveedor.
 */
export function CatalogCard({ product }: CatalogCardProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const variantsQuery = useCatalogVariants(expanded && product.has_variant ? product.id : null)

  const stock = product.stock_quantity ?? 0
  const isOutOfStock = product.stock_status === 'out_of_stock' || stock <= 0
  const isLowStock = !isOutOfStock && product.stock_status === 'low_stock'

  return (
    <article
      data-testid={`catalog-card-${product.id}`}
      className="bg-surface rounded-md shadow-whisper border border-border-subtle p-md flex flex-col gap-sm animate-in fade-in duration-200"
    >
      <div className="flex items-start gap-md">
        <div className="size-14 bg-surface-muted rounded-sm border border-border-subtle flex items-center justify-center overflow-hidden text-on-surface-deep shrink-0">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-body-md-bold text-foreground break-words">{product.name}</h3>
          <p className="text-body-sm text-on-surface-deep truncate">
            {[product.brand_name, product.category_name].filter(Boolean).join(' · ') || '—'}
          </p>
          {(product.barcode || product.base_unit) && (
            <p className="text-label-caps uppercase text-on-surface-deep mt-xs font-data-mono">
              {product.barcode || product.base_unit}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-sm mt-auto pt-sm border-t border-border-subtle">
        <div className="flex flex-col">
          <span className="text-label-caps uppercase text-on-surface-deep">
            {t('catalog.card.pvp', 'P.V.P. (Con IVA)')}
          </span>
          <span
            data-testid={`catalog-price-${product.id}`}
            className="font-data-mono text-title-md text-primary leading-none"
          >
            {product.current_price != null ? formatCurrency(product.current_price) : '—'}
          </span>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-body-sm-bold uppercase',
            isOutOfStock
              ? 'bg-error/10 text-error'
              : isLowStock
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success'
          )}
        >
          {isOutOfStock
            ? t('catalog.card.out_of_stock', 'Sin stock')
            : `${t('catalog.card.stock', 'Stock')}: ${stock} ${product.base_unit || ''}`}
        </span>
      </div>

      {product.has_variant && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between rounded-button"
            aria-expanded={expanded}
            onClick={() => setExpanded(prev => !prev)}
          >
            <span>
              {t('catalog.card.variants', 'Variantes')} ({product.variant_count})
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          {expanded && (
            <ul className="mt-xs space-y-xs" data-testid={`catalog-variants-${product.id}`}>
              {variantsQuery.isLoading && (
                <li className="text-body-sm text-on-surface-deep animate-pulse">
                  {t('catalog.card.loading_variants', 'Cargando variantes…')}
                </li>
              )}
              {(variantsQuery.data ?? []).map(variant => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-sm rounded-sm bg-surface-muted px-sm py-xs"
                >
                  <span className="min-w-0">
                    <span className="text-body-sm-bold text-foreground block truncate">
                      {variant.variant_name}
                    </span>
                    <span className="text-label-caps uppercase text-on-surface-deep font-data-mono">
                      {variant.sku}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="text-body-sm-bold text-foreground block font-data-mono">
                      {variant.current_price != null ? formatCurrency(variant.current_price) : '—'}
                    </span>
                    <span className="text-label-caps uppercase text-on-surface-deep">
                      {t('catalog.card.stock', 'Stock')}: {variant.stock_quantity ?? 0}
                    </span>
                  </span>
                </li>
              ))}
              {!variantsQuery.isLoading && (variantsQuery.data ?? []).length === 0 && (
                <li className="text-body-sm text-on-surface-deep">
                  {t('catalog.card.no_variants', 'Sin variantes activas.')}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}
