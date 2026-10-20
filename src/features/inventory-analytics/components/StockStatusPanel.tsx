import { useI18n } from '@/lib/i18n'
import { formatCount, formatPercent } from '@/domain/inventory-analytics/format'
import {
  buildStockStatusRows,
  type StockStatusKey,
} from '@/domain/inventory-analytics/stock'
import type { InventoryStockStatus } from '@/types/bi'

const LABEL_KEYS: Record<StockStatusKey, string> = {
  inStock: 'inventoryAnalytics.stockStatus.inStock',
  lowStock: 'inventoryAnalytics.stockStatus.lowStock',
  outOfStock: 'inventoryAnalytics.stockStatus.outOfStock',
  overstock: 'inventoryAnalytics.stockStatus.overstock',
}

const FALLBACK_LABELS: Record<StockStatusKey, string> = {
  inStock: 'Con stock',
  lowStock: 'Bajo stock',
  outOfStock: 'Sin stock',
  overstock: 'Sobre-stock',
}

const DOT_CLASSES: Record<StockStatusKey, string> = {
  inStock: 'bg-success',
  lowStock: 'bg-warning',
  outOfStock: 'bg-error',
  overstock: 'bg-secondary',
}

/**
 * Conteo por umbral del resumen del BE. NO es una torta: las categorías se
 * superponen (sobre-stock también cuenta como con stock), por eso se listan
 * con su porcentaje y se explica la superposición.
 */
export const StockStatusPanel = ({ status }: { status?: InventoryStockStatus }) => {
  const { t } = useI18n()
  const rows = buildStockStatusRows(status)

  return (
    <div data-testid="inventory-stock-status">
      <ul className="divide-y divide-divider">
        {rows.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-md py-sm first:pt-0 last:pb-0"
            data-testid={`stock-status-${row.key}`}
          >
            <span
              className={`size-3 shrink-0 rounded-full ${DOT_CLASSES[row.key]}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-body-md-bold text-foreground">
                {t(LABEL_KEYS[row.key], FALLBACK_LABELS[row.key])}
              </p>
              <p className="text-body-sm text-on-surface-deep">
                {t('inventoryAnalytics.stockStatus.shareHint', '{pct} del catálogo', {
                  pct: formatPercent(row.percentage),
                })}
              </p>
            </div>
            <p className="whitespace-nowrap font-data-mono text-title-md text-foreground">
              {formatCount(row.count)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-md text-body-sm text-on-surface-deep">
        {t(
          'inventoryAnalytics.stockStatus.overlapNote',
          'Las categorías se superponen: sobre-stock también cuenta como con stock.',
        )}
      </p>
    </div>
  )
}

export default StockStatusPanel
