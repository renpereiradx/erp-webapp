import { useI18n } from '@/lib/i18n'
import { formatCount, formatMoney, formatPercent } from '@/domain/inventory-analytics/format'
import { buildAbcClassRows, type AbcClass } from '@/domain/inventory-analytics/abc'
import type { ABCSummary } from '@/types/bi'
import { InventoryBadge, type InventoryBadgeTone } from './InventoryBadge'

const CLASS_LABEL_KEYS: Record<AbcClass, string> = {
  A: 'inventoryAnalytics.abc.classA',
  B: 'inventoryAnalytics.abc.classB',
  C: 'inventoryAnalytics.abc.classC',
}

const CLASS_FALLBACKS: Record<AbcClass, string> = {
  A: 'Clase A',
  B: 'Clase B',
  C: 'Clase C',
}

const CLASS_TONES: Record<AbcClass, InventoryBadgeTone> = {
  A: 'primary',
  B: 'secondary',
  C: 'neutral',
}

/**
 * Resumen A/B/C por ventas del período. Se presenta como ledger y no como
 * tabla: cuatro columnas no entran en mobile y el scroll de un resumen de 3
 * filas era peor que la lista (`Gs. 1.55…` recortado).
 */
export const AbcSummaryTable = ({ summary }: { summary?: ABCSummary }) => {
  const { t } = useI18n()
  const rows = buildAbcClassRows(summary)

  return (
    <ul className="divide-y divide-divider" data-testid="abc-summary-table">
      {rows.map((row) => (
        <li
          key={row.class}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-sm py-sm first:pt-0 last:pb-0"
        >
          <InventoryBadge tone={CLASS_TONES[row.class]}>
            {t(CLASS_LABEL_KEYS[row.class], CLASS_FALLBACKS[row.class])}
          </InventoryBadge>
          <div className="min-w-0">
            <p className="text-body-sm text-foreground">
              {t('inventoryAnalytics.abc.productsShort', '{count} productos', {
                count: formatCount(row.count),
              })}
            </p>
            <p className="text-body-sm text-on-surface-deep">
              {t('inventoryAnalytics.abc.shareOfSales', '{pct} de las ventas', {
                pct: formatPercent(row.percentage),
              })}
            </p>
          </div>
          <p className="whitespace-nowrap text-right font-data-mono text-body-md text-foreground">
            {formatMoney(row.value)}
          </p>
        </li>
      ))}
    </ul>
  )
}

export default AbcSummaryTable
