import { Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatHour, formatMoney } from '@/domain/sales-analytics/format'
import { buildHourlyPoints } from '@/domain/sales-analytics/velocity'
import type { HourlySales } from '@/types/bi'
import { BarColumns } from './BarColumns'

interface HourlyProfileProps {
  hourly: HourlySales[]
  peakHour: number
  peakSales: number
}

/**
 * Perfil horario (0-23 h). La hora pico viene del payload (`peak_hour`), no de
 * un literal: la pantalla vieja mostraba "14:00" fijo. Las horas sin ventas se
 * dibujan en cero para que el valle sea visible.
 */
export const HourlyProfile = ({ hourly, peakHour, peakSales }: HourlyProfileProps) => {
  const { t } = useI18n()

  if (hourly.length === 0) {
    return (
      <TableEmptyState
        icon={Clock}
        title={t('salesAnalytics.velocity.hourlyEmpty', 'Sin ventas por hora')}
        description={t(
          'salesAnalytics.velocity.hourlyEmptyHint',
          'El período seleccionado no registra ventas para distribuir por hora.',
        )}
      />
    )
  }

  const data = buildHourlyPoints(hourly, peakHour).map((point, hour) => ({
    key: point.key,
    label: '',
    value: point.value,
    ariaLabel: t('salesAnalytics.velocity.hourAria', '{hour}: {amount} · {count} ventas', {
      hour: formatHour(hour),
      amount: formatMoney(point.value),
      count: formatCount(point.secondary),
    }),
    highlight: point.highlight,
  }))

  return (
    <div className="space-y-md">
      {peakSales > 0 ? (
        <p className="text-body-md text-foreground" data-testid="hourly-peak">
          {t('salesAnalytics.velocity.peakHour', 'Hora pico')}:{' '}
          <span className="text-body-md-bold">{formatHour(peakHour)}</span> ·{' '}
          <span className="font-data-mono text-data-mono">{formatMoney(peakSales)}</span>
        </p>
      ) : null}
      <BarColumns
        data={data}
        ariaLabel={t('salesAnalytics.velocity.hourlyAria', 'Ventas por hora')}
        minWidthClass="min-w-[360px]"
        testId="hourly-profile"
        axisLabels={[formatHour(0), formatHour(6), formatHour(12), formatHour(18), formatHour(23)]}
      />
    </div>
  )
}

export default HourlyProfile
