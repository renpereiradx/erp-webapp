import { useI18n } from '@/lib/i18n'
import { formatCount, formatRate } from '@/domain/inventory-analytics/format'
import { usableTurnoverDays } from '@/domain/inventory-analytics/turnover'
import type { ProductTurnover } from '@/types/bi'

interface MoversListProps {
  items: ProductTurnover[]
  /** `top` muestra rotación/días; `slow` solo unidades y stock (el resto es relleno). */
  mode: 'top' | 'slow'
  testId?: string
}

/**
 * Lista compacta de productos con mayor/menor movimiento. En `slow` NO se
 * muestran `turnover_rate` ni `days_of_inventory`: el SQL del dashboard los
 * rellena con 0/999, no son métricas calculadas.
 */
export const MoversList = ({ items, mode, testId }: MoversListProps) => {
  const { t } = useI18n()

  return (
    <ul className="divide-y divide-divider" data-testid={testId}>
      {items.map((item) => {
        const days = usableTurnoverDays(item.days_of_inventory)
        return (
          <li
            key={item.product_id}
            className="flex flex-col gap-xs py-sm first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-md"
          >
            <div className="min-w-0">
              <p className="truncate text-body-md-bold text-foreground">{item.product_name}</p>
              <p className="text-body-sm text-on-surface-deep">
                {item.category_name}
                <span aria-hidden="true"> · </span>
                {t('inventoryAnalytics.movers.unitsSold', 'Vendidas: {value}', {
                  value: formatCount(item.units_sold, 2),
                })}
                <span aria-hidden="true"> · </span>
                {t('inventoryAnalytics.movers.stock', 'Stock: {value}', {
                  value: formatCount(item.current_stock),
                })}
              </p>
            </div>
            {mode === 'top' ? (
              <div className="shrink-0 text-left sm:text-right">
                <p className="font-data-mono text-title-md text-foreground">
                  {t('inventoryAnalytics.common.rateValue', '{value}x', {
                    value: formatRate(item.turnover_rate),
                  })}
                </p>
                <p className="text-body-sm text-on-surface-deep">
                  {t('inventoryAnalytics.movers.days', 'Días: {value}', {
                    value:
                      days === null
                        ? t('inventoryAnalytics.common.unavailable', '—')
                        : formatCount(days, 0),
                  })}
                </p>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export default MoversList
