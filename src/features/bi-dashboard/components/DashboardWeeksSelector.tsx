import SegmentedControl from '@/components/ui/SegmentedControl'
import { useI18n } from '@/lib/i18n'
import { DASHBOARD_HEATMAP_WEEKS, useDashboardStore } from '@/store/useDashboardStore'

/** Selector de ventana del heatmap (4 / 8 / 12 semanas). */
export const DashboardWeeksSelector = () => {
  const { t } = useI18n()
  const weeks = useDashboardStore((state) => state.heatmapWeeks)
  const setWeeks = useDashboardStore((state) => state.setHeatmapWeeks)

  return (
    <SegmentedControl
      options={DASHBOARD_HEATMAP_WEEKS.map((value) => ({
        value: String(value),
        label: t('dashboard.heatmap.weeksOption', '{weeks} sem.', { weeks: value }),
      }))}
      value={String(weeks)}
      onChange={(value: string) => setWeeks(Number(value))}
      aria-label={t('dashboard.heatmap.weeks', 'Ventana de análisis')}
      size="small"
    />
  )
}
