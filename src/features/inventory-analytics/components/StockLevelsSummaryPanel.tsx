import { useI18n } from '@/lib/i18n'
import { formatCount, formatMoney } from '@/domain/inventory-analytics/format'
import type { StockLevelsSummary } from '@/types/bi'

/**
 * Resumen de la consulta de niveles de stock. `total_products` es el total del
 * filtro; unidades y valor suman SOLO la página que devolvió el BE (el repo no
 * agrega el filtro completo), por eso los labels lo dicen explícitamente.
 */
export const StockLevelsSummaryPanel = ({ summary }: { summary?: StockLevelsSummary }) => {
  const { t } = useI18n()

  const items = [
    {
      id: 'products',
      label: t('inventoryAnalytics.stockLevels.summary.filteredProducts', 'Productos con el filtro'),
      value: formatCount(summary?.total_products),
    },
    {
      id: 'units',
      label: t('inventoryAnalytics.stockLevels.summary.pageUnits', 'Unidades en esta página'),
      value: formatCount(summary?.total_units),
    },
    {
      id: 'value',
      label: t(
        'inventoryAnalytics.stockLevels.summary.pageValue',
        'Valor a costo en esta página',
      ),
      value: formatMoney(summary?.total_value),
    },
  ]

  return (
    <dl className="grid gap-md sm:grid-cols-3" data-testid="stock-levels-summary">
      {items.map((item) => (
        <div key={item.id} className="rounded-md bg-surface-muted p-md">
          <dt className="text-label-caps uppercase text-on-surface-deep">{item.label}</dt>
          <dd className="mt-xs whitespace-nowrap font-data-mono text-title-md text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default StockLevelsSummaryPanel
