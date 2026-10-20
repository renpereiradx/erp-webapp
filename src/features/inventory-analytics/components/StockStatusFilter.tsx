import { useI18n } from '@/lib/i18n'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { STOCK_STATUS_FILTERS } from '@/domain/inventory-analytics/stock'
import type { InventoryStatusFilter } from '@/types/bi'

export type StockFilterValue = InventoryStatusFilter | 'all'

const FILTER_LABEL_KEYS: Record<StockFilterValue, string> = {
  all: 'inventoryAnalytics.stockLevels.filters.all',
  IN_STOCK: 'inventoryAnalytics.stockLevels.filters.inStock',
  LOW_STOCK: 'inventoryAnalytics.stockLevels.filters.lowStock',
  OUT_OF_STOCK: 'inventoryAnalytics.stockLevels.filters.outOfStock',
  OVERSTOCK: 'inventoryAnalytics.stockLevels.filters.overstock',
}

const FILTER_FALLBACKS: Record<StockFilterValue, string> = {
  all: 'Todos',
  IN_STOCK: 'Con stock (> 5)',
  LOW_STOCK: 'Bajo stock (1-5)',
  OUT_OF_STOCK: 'Sin stock',
  OVERSTOCK: 'Sobre-stock (> 15)',
}


interface StockStatusFilterProps {
  value: StockFilterValue
  onChange: (value: StockFilterValue) => void
}

/** Filtro server-side por estado (el BE aplica `?status=`). */
export const StockStatusFilter = ({ value, onChange }: StockStatusFilterProps) => {
  const { t } = useI18n()
  return (
    <SegmentedControl
      options={STOCK_STATUS_FILTERS.map((filter) => ({
        value: filter,
        label: t(FILTER_LABEL_KEYS[filter], FILTER_FALLBACKS[filter]),
      }))}
      value={value}
      onChange={(next: string) => onChange(next as StockFilterValue)}
      aria-label={t('inventoryAnalytics.stockLevels.filterLabel', 'Filtrar por estado')}
      size="small"
    />
  )
}

export default StockStatusFilter
