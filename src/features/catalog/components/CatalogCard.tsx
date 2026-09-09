import { useState } from 'react'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import type { CatalogProduct, ProductStockSummary } from '../types'
import { useCatalogVariants, useProductStockSummary } from '../hooks/useCatalogProducts'

interface CatalogCardProps {
  product: CatalogProduct
}

/** Chip de stock: verde con cantidad, rojo cuando no hay unidades. */
function StockChip({ stock, unit }: { stock: number; unit?: string | null }) {
  const { t } = useI18n()
  const out = stock <= 0
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-body-sm-bold uppercase whitespace-nowrap',
        out ? 'bg-error/10 text-error' : 'bg-success/10 text-success',
      )}
    >
      {out
        ? t('catalog.card.out_of_stock', 'Sin stock')
        : `${t('catalog.card.stock', 'Stock')}: ${stock}${unit ? ` ${unit}` : ''}`}
    </span>
  )
}

/**
 * Tarjeta del catálogo comercial (PLAN_CATALOGO_VENDEDOR 3.3): imagen,
 * nombre, marca/categoría, SKU/código de barras, P.V.P. con IVA, indicador
 * de stock y variantes expandibles. Nada de costo, margen ni proveedor.
 *
 * Stock (mapeo del admin de productos, en el alcance de la sucursal activa):
 * el chip muestra el total y el desglose base/variantes viene del summary
 * del backend — nunca se mezclan totales globales con stock por sucursal.
 */
export function CatalogCard({ product }: CatalogCardProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const variantsQuery = useCatalogVariants(expanded && product.has_variant ? product.id : null)
  const summaryQuery = useProductStockSummary(product.has_variant ? product.id : null)

  const summary: ProductStockSummary | null = summaryQuery.data ?? null
  // Total del alcance de la sucursal activa; fallback al proyectado global
  // (backends sin stock-summary) para no dejar la tarjeta sin número.
  const stock = product.has_variant
    ? (summary?.total_stock ?? product.stock_quantity ?? 0)
    : (product.stock_quantity ?? 0)
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
          <h3 className="text-body-md-bold text-foreground break-words" title={product.name}>
            {product.name}
          </h3>
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

      <div className="flex flex-wrap items-end justify-between gap-x-sm gap-y-xs mt-auto pt-sm border-t border-border-subtle">
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
            : `${t('catalog.card.stock', 'Stock')}: ${stock} ${product.base_unit || ''}`}
        </span>
      </div>

      {/* Desglose base/variantes (mismo mapeo del admin de productos). */}
      {product.has_variant && summary && (
        <p
          className="text-body-sm text-on-surface-deep font-data-mono"
          data-testid={`catalog-stock-breakdown-${product.id}`}
        >
          {t('catalog.card.stock_base', 'Base')}: {summary.base_stock}
          {' · '}
          {t('catalog.card.stock_variants', 'En variantes')}: {summary.variants_stock}
        </p>
      )}

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
                  className="flex items-center justify-between gap-md rounded-sm bg-surface-muted px-sm py-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm-bold text-foreground truncate" title={variant.variant_name}>
                      {variant.variant_name}
                    </p>
                    <p className="text-label-caps uppercase text-on-surface-deep font-data-mono truncate">
                      {variant.sku}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-body-sm-bold text-foreground font-data-mono whitespace-nowrap">
                      {variant.current_price != null ? formatCurrency(variant.current_price) : '—'}
                    </span>
                    <StockChip stock={variant.stock_quantity ?? 0} />
                  </div>
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
