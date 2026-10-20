import { CalendarDays } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCompactMoney, formatCount, formatMoney } from '@/domain/sales-analytics/format'
import { buildWeekdayPoints } from '@/domain/sales-analytics/velocity'
import type { DayOfWeekSales } from '@/types/bi'
import { BarColumns } from './BarColumns'

const DAY_FALLBACKS = {
  sunday: 'Dom',
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
} as const

/**
 * Perfil semanal (domingo→sábado). El `day_name` del BE viene en español: se
 * traduce por índice para que la UI en inglés no muestre "Martes". El mejor
 * día se deriva del máximo del propio payload.
 */
export const WeekdayProfile = ({ daily }: { daily: DayOfWeekSales[] }) => {
  const { t } = useI18n()

  if (daily.length === 0) {
    return (
      <TableEmptyState
        icon={CalendarDays}
        title={t('salesAnalytics.velocity.weekdayEmpty', 'Sin ventas por día')}
        description={t(
          'salesAnalytics.velocity.weekdayEmptyHint',
          'El período seleccionado no registra ventas para distribuir por día.',
        )}
      />
    )
  }

  const points = buildWeekdayPoints(daily)
  const labelFor = (key: keyof typeof DAY_FALLBACKS): string =>
    t(`salesAnalytics.days.${key}`, DAY_FALLBACKS[key])

  const best = points.find((point) => point.highlight)

  const data = points.map((point) => {
    const key = point.dayKey ?? 'sunday'
    const label = labelFor(key)
    return {
      key: point.key,
      label,
      value: point.value,
      valueText: formatCompactMoney(point.value),
      ariaLabel: t('salesAnalytics.velocity.dayAria', '{day}: {amount} · {count} ventas', {
        day: label,
        amount: formatMoney(point.value),
        count: formatCount(point.secondary),
      }),
      highlight: point.highlight,
    }
  })

  return (
    <div className="space-y-md">
      {best ? (
        <p className="text-body-md text-foreground" data-testid="weekday-best">
          {t('salesAnalytics.velocity.bestDay', 'Mejor día')}:{' '}
          <span className="text-body-md-bold">{labelFor(best.dayKey ?? 'sunday')}</span> ·{' '}
          <span className="font-data-mono text-data-mono">{formatMoney(best.value)}</span>
        </p>
      ) : null}
      <BarColumns
        data={data}
        ariaLabel={t('salesAnalytics.velocity.weekdayAria', 'Ventas por día de la semana')}
        showValues
        minWidthClass="min-w-[560px]"
        testId="weekday-profile"
      />
    </div>
  )
}

export default WeekdayProfile
