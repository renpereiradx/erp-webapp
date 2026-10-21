import { useId } from 'react'
import { Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SegmentedControl from '@/components/ui/SegmentedControl'
import {
  PAYABLES_PRIORITY_FILTERS,
  PAYABLES_STATUS_FILTERS,
  type PayablesPriorityFilter,
  type PayablesStatusFilter,
} from '@/domain/payables/status'

const STATUS_LABELS: Record<PayablesStatusFilter, { key: string; fallback: string }> = {
  ALL: { key: 'payables.filters.allStatus', fallback: 'Todos' },
  PENDING: { key: 'payables.filters.pending', fallback: 'Pendientes' },
  PARTIAL: { key: 'payables.filters.partial', fallback: 'Parciales' },
  OVERDUE: { key: 'payables.filters.overdue', fallback: 'Vencidas' },
}

const PRIORITY_LABELS: Record<PayablesPriorityFilter, { key: string; fallback: string }> = {
  ALL: { key: 'payables.filters.allPriority', fallback: 'Todas' },
  URGENT: { key: 'payables.filters.urgent', fallback: 'Urgentes' },
  HIGH: { key: 'payables.filters.high', fallback: 'Alta' },
  MEDIUM: { key: 'payables.filters.medium', fallback: 'Media' },
  LOW: { key: 'payables.filters.low', fallback: 'Baja' },
}

interface PayablesFiltersProps {
  status: PayablesStatusFilter
  priority: PayablesPriorityFilter
  searchDraft: string
  startDate: string
  endDate: string
  dateRangeInvalid: boolean
  hasActiveFilters: boolean
  onStatusChange: (value: PayablesStatusFilter) => void
  onPriorityChange: (value: PayablesPriorityFilter) => void
  onSearchDraftChange: (value: string) => void
  onApplySearch: () => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onClear: () => void
}

/**
 * Barra de filtros del listado. Todos los filtros viajan al BE (el endpoint
 * acepta status/priority/search/start_date/end_date); el texto se aplica con
 * Enter o "Aplicar" para no refetchear por tecla.
 */
export const PayablesFilters = ({
  status,
  priority,
  searchDraft,
  startDate,
  endDate,
  dateRangeInvalid,
  hasActiveFilters,
  onStatusChange,
  onPriorityChange,
  onSearchDraftChange,
  onApplySearch,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: PayablesFiltersProps) => {
  const { t } = useI18n()
  const ids = useId()
  const searchId = `${ids}-search`
  const fromId = `${ids}-from`
  const toId = `${ids}-to`

  return (
    <section
      aria-label={t('payables.filters.aria', 'Filtros de cuentas por pagar')}
      className="rounded-md bg-surface p-md shadow-whisper"
      data-testid="payables-filters"
    >
      <div className="flex flex-col gap-md">
        <div className="flex flex-wrap items-end gap-md">
          <div className="space-y-xs">
            <p className="text-body-sm-bold text-foreground">
              {t('payables.filters.status', 'Estado')}
            </p>
            <SegmentedControl
              options={PAYABLES_STATUS_FILTERS.map((filter) => ({
                value: filter,
                label: t(STATUS_LABELS[filter].key, STATUS_LABELS[filter].fallback),
              }))}
              value={status}
              onChange={(next: string) => onStatusChange(next as PayablesStatusFilter)}
              aria-label={t('payables.filters.statusAria', 'Filtrar por estado')}
              size="small"
            />
          </div>
          <div className="space-y-xs">
            <p className="text-body-sm-bold text-foreground">
              {t('payables.filters.priority', 'Prioridad')}
            </p>
            <SegmentedControl
              options={PAYABLES_PRIORITY_FILTERS.map((filter) => ({
                value: filter,
                label: t(PRIORITY_LABELS[filter].key, PRIORITY_LABELS[filter].fallback),
              }))}
              value={priority}
              onChange={(next: string) => onPriorityChange(next as PayablesPriorityFilter)}
              aria-label={t('payables.filters.priorityAria', 'Filtrar por prioridad')}
              size="small"
            />
          </div>
        </div>

        <div className="flex flex-col gap-md lg:flex-row lg:items-end">
          <div className="flex flex-wrap items-end gap-md">
            <div className="space-y-xs">
              <Label htmlFor={fromId} className="text-body-sm-bold text-foreground">
                {t('payables.filters.from', 'Desde')}
              </Label>
              <Input
                id={fromId}
                type="date"
                value={startDate}
                state={dateRangeInvalid ? 'error' : ''}
                onChange={(event) => onStartDateChange(event.target.value)}
              />
            </div>
            <div className="space-y-xs">
              <Label htmlFor={toId} className="text-body-sm-bold text-foreground">
                {t('payables.filters.to', 'Hasta')}
              </Label>
              <Input
                id={toId}
                type="date"
                value={endDate}
                state={dateRangeInvalid ? 'error' : ''}
                onChange={(event) => onEndDateChange(event.target.value)}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-sm">
            <div className="w-full min-w-0 space-y-xs sm:w-auto sm:flex-1">
              <Label htmlFor={searchId} className="text-body-sm-bold text-foreground">
                {t('payables.filters.search', 'Buscar')}
              </Label>
              <Input
                id={searchId}
                type="search"
                value={searchDraft}
                placeholder={t(
                  'payables.filters.searchPlaceholder',
                  'Orden, proveedor, RUC o CI',
                )}
                onChange={(event) => onSearchDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    onApplySearch()
                  }
                }}
              />
            </div>
            <Button variant="primary" type="button" onClick={onApplySearch}>
              <Search size={16} className="mr-xs" aria-hidden="true" />
              {t('payables.filters.apply', 'Aplicar')}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={onClear}
              disabled={!hasActiveFilters}
            >
              {t('payables.filters.clear', 'Limpiar')}
            </Button>
          </div>
        </div>

        {dateRangeInvalid ? (
          <p role="alert" className="text-body-sm text-error">
            {t(
              'payables.filters.invalidRange',
              'La fecha "Desde" no puede ser posterior a "Hasta".',
            )}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default PayablesFilters
