import type { RefObject } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import {
  EMPTY_ALERT_FILTERS,
  type AlertFilters,
} from '@/domain/dashboard/alerts'

const SEVERITY_OPTIONS: Array<{ value: AlertFilters['severity']; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'critical', label: 'Críticas' },
  { value: 'warning', label: 'Advertencias' },
  { value: 'info', label: 'Informativas' },
]

const CATEGORY_OPTIONS: Array<{ value: AlertFilters['category']; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'inventory', label: 'Inventario' },
  { value: 'financial', label: 'Finanzas' },
  { value: 'sales', label: 'Ventas' },
]

interface AlertsToolbarProps {
  filters: AlertFilters
  onChange: (filters: AlertFilters) => void
  searchInputRef: RefObject<HTMLInputElement | null>
}

const chipClass = (active: boolean): string =>
  `rounded-full px-md py-1 text-body-sm-bold transition-colors duration-150 ${
    active
      ? 'bg-primary text-on-primary'
      : 'bg-surface-muted text-on-surface-deep hover:text-foreground'
  }`

/** Filtros de la bandeja de alertas: severidad, categoría y búsqueda (F2). */
export const AlertsToolbar = ({ filters, onChange, searchInputRef }: AlertsToolbarProps) => {
  const { t } = useI18n()
  const hasFilters =
    filters.severity !== 'all' || filters.category !== 'all' || filters.search.trim() !== ''

  return (
    <div className="space-y-sm">
      <div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-sm">
          <div
            role="group"
            aria-label={t('dashboard.alerts.filters.severity', 'Severidad')}
            className="flex flex-wrap items-center gap-xs"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filters.severity === option.value}
                onClick={() => onChange({ ...filters, severity: option.value })}
                className={chipClass(filters.severity === option.value)}
              >
                {t(`dashboard.alerts.severity.${option.value}`, option.label)}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label={t('dashboard.alerts.filters.category', 'Categoría')}
            className="flex flex-wrap items-center gap-xs"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filters.category === option.value}
                onClick={() => onChange({ ...filters, category: option.value })}
                className={chipClass(filters.category === option.value)}
              >
                {t(`dashboard.alerts.category.${option.value}`, option.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <Input
            ref={searchInputRef}
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder={t(
              'dashboard.alerts.filters.searchPlaceholder',
              'Buscar alertas (F2)…',
            )}
            aria-label={t('dashboard.alerts.filters.search', 'Buscar alertas')}
            className="w-full sm:w-72"
          />
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...EMPTY_ALERT_FILTERS })}
            >
              <X size={14} className="mr-xs" aria-hidden="true" />
              {t('dashboard.actions.clearFilters', 'Limpiar')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
