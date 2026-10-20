import { useId, type RefObject } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DrilldownFilterControls } from '../types'

interface DrilldownFiltersProps {
  controls: DrilldownFilterControls
  searchInputRef: RefObject<HTMLInputElement | null>
  searchPlaceholder: string
}

/**
 * Barra de filtros de los drill-downs: rango de fechas (server-side),
 * búsqueda con draft/aplicado (Enter o Aplicar) y refresh manual. Los atajos
 * anunciados son los realmente cableados: F2 (foco al buscador, §12) y Enter.
 */
export const DrilldownFilters = ({
  controls,
  searchInputRef,
  searchPlaceholder,
}: DrilldownFiltersProps) => {
  const { t } = useI18n()
  const ids = useId()
  const fromId = `${ids}-from`
  const toId = `${ids}-to`
  const searchId = `${ids}-search`

  const {
    qDraft,
    setQDraft,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    dateRangeInvalid,
    isFetching,
    refetch,
  } = controls

  return (
    <section
      aria-label={t('relationalAnalytics.filters.aria', 'Filtros del análisis')}
      className="rounded-md bg-surface p-md shadow-whisper"
    >
      <div className="flex flex-col gap-md xl:flex-row xl:items-end">
        <div className="flex flex-wrap items-end gap-md">
          <div className="space-y-xs">
            <Label htmlFor={fromId} className="text-body-sm-bold text-foreground">
              {t('relationalAnalytics.filters.from', 'Desde')}
            </Label>
            <Input
              id={fromId}
              type="date"
              value={dateFrom}
              state={dateRangeInvalid ? 'error' : ''}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor={toId} className="text-body-sm-bold text-foreground">
              {t('relationalAnalytics.filters.to', 'Hasta')}
            </Label>
            <Input
              id={toId}
              type="date"
              value={dateTo}
              state={dateRangeInvalid ? 'error' : ''}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-sm">
          <div className="w-full min-w-0 space-y-xs sm:w-auto sm:flex-1">
            <Label htmlFor={searchId} className="text-body-sm-bold text-foreground">
              {t('relationalAnalytics.filters.search', 'Buscar')}
            </Label>
            <Input
              id={searchId}
              ref={searchInputRef}
              type="search"
              value={qDraft}
              placeholder={searchPlaceholder}
              onChange={(event) => setQDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyFilters()
                }
              }}
            />
          </div>
          <Button variant="primary" type="button" onClick={applyFilters}>
            {t('relationalAnalytics.filters.apply', 'Aplicar')}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            {t('relationalAnalytics.filters.clear', 'Limpiar')}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            type="button"
            onClick={refetch}
            disabled={isFetching}
            aria-label={t('relationalAnalytics.filters.refresh', 'Actualizar')}
            title={t('relationalAnalytics.filters.refresh', 'Actualizar')}
          >
            <RefreshCw
              className={`size-4 ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      <p className="mt-sm flex flex-wrap items-center gap-x-sm gap-y-1 font-data-mono text-body-sm text-outline-fg">
        <span>[F2] {t('relationalAnalytics.filters.search', 'Buscar')}</span>
        <span aria-hidden="true">·</span>
        <span>[Enter] {t('relationalAnalytics.filters.apply', 'Aplicar')}</span>
      </p>

      {dateRangeInvalid ? (
        <div
          role="alert"
          className="mt-sm flex items-start gap-sm rounded-md bg-surface-muted px-md py-sm text-foreground"
        >
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="text-body-md-bold">
              {t('relationalAnalytics.filters.rangeTitle', 'Rango de fechas inválido')}
            </p>
            <p className="text-body-sm text-on-surface-deep">
              {t(
                'relationalAnalytics.filters.rangeMessage',
                'La fecha "Desde" no puede ser posterior a "Hasta".',
              )}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default DrilldownFilters
