import { useI18n } from '@/lib/i18n'
import SegmentedControl from '@/components/ui/SegmentedControl'
import {
  RECEIVABLES_STATUS_FILTERS,
  type ReceivablesStatusFilter,
} from '@/domain/receivables/status'

const LABELS: Record<ReceivablesStatusFilter, { key: string; fallback: string }> = {
  ALL: { key: 'receivables.filters.all', fallback: 'Todas' },
  PENDING: { key: 'receivables.filters.pending', fallback: 'Pendientes' },
  PARTIAL: { key: 'receivables.filters.partial', fallback: 'Parciales' },
  OVERDUE: { key: 'receivables.filters.overdue', fallback: 'Vencidas' },
}

/**
 * Filtro por estado del listado. Solo los 3 estados que acepta el BE (más
 * "Todas"); `ALL` no viaja en el query string.
 */
export const ReceivablesStatusFilterControl = ({
  value,
  onChange,
}: {
  value: ReceivablesStatusFilter
  onChange: (value: ReceivablesStatusFilter) => void
}) => {
  const { t } = useI18n()

  return (
    <SegmentedControl
      options={RECEIVABLES_STATUS_FILTERS.map((filter) => ({
        value: filter,
        label: t(LABELS[filter].key, LABELS[filter].fallback),
      }))}
      value={value}
      onChange={(next: string) => onChange(next as ReceivablesStatusFilter)}
      aria-label={t('receivables.filters.label', 'Filtrar por estado')}
      size="small"
    />
  )
}

export default ReceivablesStatusFilterControl
