import { useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import {
  HEATMAP_HOURS,
  HEATMAP_UI_DAY_KEYS,
  computeMaxSales,
  formatHour,
  getCellIntensity,
  type HeatmapCell,
  type IntensityLevel,
} from '@/domain/dashboard/heatmap'

const LEVEL_CLASSES: Record<IntensityLevel, string> = {
  0: 'bg-surface-muted text-on-surface-deep',
  1: 'bg-primary/15 text-foreground',
  2: 'bg-primary/35 text-on-surface-deep',
  3: 'bg-primary text-on-primary',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
}

/**
 * Grilla día × hora (0-23) del heatmap real. La intensidad se deriva del
 * máximo de ventas del propio payload; el número de la celda es `sales_count`
 * y el tooltip/aria muestra el monto en guaraníes.
 */
export const HeatmapGrid = ({ cells }: { cells: HeatmapCell[] }) => {
  const { t } = useI18n()
  const maxSales = useMemo(() => computeMaxSales(cells), [cells])

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-1">
          <caption className="sr-only">
            {t('dashboard.heatmap.gridCaption', 'Ventas por día y hora de la ventana seleccionada')}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-16 text-left text-label-caps uppercase text-on-surface-deep" />
              {HEATMAP_HOURS.map((hour) => (
                <th
                  key={hour}
                  scope="col"
                  className="text-center text-label-caps text-on-surface-deep"
                >
                  {String(hour).padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HEATMAP_UI_DAY_KEYS.map((dayKey, uiIndex) => (
              <tr key={dayKey}>
                <th
                  scope="row"
                  className="pr-sm text-left text-label-caps uppercase text-on-surface-deep"
                >
                  {t(`dashboard.heatmap.days.${dayKey}`, DAY_LABELS[dayKey])}
                </th>
                {HEATMAP_HOURS.map((hour) => {
                  const cell = getCellIntensity(cells, maxSales, uiIndex, hour)
                  const dayLabel = t(`dashboard.heatmap.days.${dayKey}`, DAY_LABELS[dayKey])
                  const label = t(
                    'dashboard.heatmap.cellAria',
                    '{day} {hour}: {count} ventas · {total}',
                    {
                      day: dayLabel,
                      hour: formatHour(hour),
                      count: formatNumber(cell.sales, 0),
                      total: formatPYG(cell.total),
                    },
                  )

                  return (
                    <td key={hour} className="p-0">
                      <div
                        className={`flex h-8 items-center justify-center rounded-xs text-body-sm-bold ${LEVEL_CLASSES[cell.level]}`}
                        title={label}
                        aria-label={label}
                        data-testid={`heatmap-cell-${dayKey}-${hour}`}
                      >
                        {cell.sales > 0 ? formatNumber(cell.sales, 0) : ''}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-sm flex items-center justify-end gap-xs text-body-sm text-on-surface-deep">
        <span>{t('dashboard.heatmap.legend.less', 'Menos ventas')}</span>
        {([0, 1, 2, 3] as IntensityLevel[]).map((level) => (
          <span
            key={level}
            className={`size-4 rounded-xs ${LEVEL_CLASSES[level]}`}
            aria-hidden="true"
          />
        ))}
        <span>{t('dashboard.heatmap.legend.more', 'Más ventas')}</span>
      </div>
    </div>
  )
}
