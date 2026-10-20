import { useI18n } from '@/lib/i18n'
import { formatNumber } from '@/utils/currencyUtils'
import { dayNameToKey, formatHour } from '@/domain/dashboard/heatmap'
import type { HeatmapPeakTime } from '@/types/bi'

const DAY_FALLBACKS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const PeakList = ({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: HeatmapPeakTime[]
}) => {
  const { t } = useI18n()

  return (
    <div>
      <h3 className="text-body-md-bold text-foreground">{title}</h3>
      <p className="mb-sm text-body-sm text-on-surface-deep">{description}</p>
      {items.length === 0 ? (
        <p className="text-body-md text-on-surface-deep">
          {t('dashboard.heatmap.peaks.empty', 'Sin datos suficientes en la ventana.')}
        </p>
      ) : (
        <ul className="divide-y divide-divider">
          {items.map((item, index) => {
            const dayKey = dayNameToKey(item.day)
            const dayLabel = dayKey
              ? t(`dashboard.heatmap.days.${dayKey}`, DAY_FALLBACKS[dayKey])
              : item.day

            return (
              <li
                key={`${item.day}-${item.hour}-${index}`}
                className="flex items-center justify-between gap-md py-sm first:pt-0 last:pb-0"
              >
                <span className="text-body-md text-foreground">
                  {dayLabel} · {formatHour(item.hour)}
                </span>
                <span className="font-data-mono text-data-mono text-on-surface-deep">
                  {formatNumber(item.average_sales, 1)}{' '}
                  {t('dashboard.heatmap.averagePerWeek', 'promedio/semana')}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Horarios pico y valle tal como los calcula el backend (count/weeks). */
export const HeatmapPeaksPanel = ({
  peakTimes,
  slowTimes,
}: {
  peakTimes: HeatmapPeakTime[]
  slowTimes: HeatmapPeakTime[]
}) => {
  const { t } = useI18n()

  return (
    <div className="grid gap-lg md:grid-cols-2">
      <PeakList
        title={t('dashboard.heatmap.peaks.title', 'Horarios pico')}
        description={t('dashboard.heatmap.peaks.subtitle', 'Día y hora con más ventas en la ventana.')}
        items={peakTimes}
      />
      <PeakList
        title={t('dashboard.heatmap.peaks.slowTitle', 'Horarios valle')}
        description={t('dashboard.heatmap.peaks.slowSubtitle', 'Día y hora con menos ventas en la ventana.')}
        items={slowTimes}
      />
    </div>
  )
}
