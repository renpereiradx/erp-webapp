import { useId } from 'react'
import { Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SegmentedControl from '@/components/ui/SegmentedControl'
import {
  AUDIT_FILTER_ACTIONS,
  AUDIT_FILTER_CATEGORIES,
  AUDIT_FILTER_LEVELS,
  auditActionFallback,
  auditActionLabelKey,
  auditCategoryFallback,
  auditCategoryLabelKey,
  auditLevelFallback,
  auditLevelLabelKey,
} from '@/domain/audit/labels'
import type { AuditCatalogOption } from '@/types/bi'
import {
  AUDIT_RESULT_FILTERS,
  type AuditLogFilters,
  type AuditRangeState,
  type AuditResultFilter,
} from '@/domain/audit/filters'

const RESULT_LABELS: Record<AuditResultFilter, { key: string; fallback: string }> = {
  ALL: { key: 'audit.filters.allResults', fallback: 'Todos' },
  SUCCESS: { key: 'audit.filters.success', fallback: 'Éxitos' },
  FAILURE: { key: 'audit.filters.failure', fallback: 'Fallos' },
}

const SELECT_CLASS =
  'h-10 w-full rounded-md border border-slate-400 bg-white px-3 text-sm text-foreground transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'

interface AuditFiltersProps {
  filters: AuditLogFilters
  searchDraft: string
  rangeState: AuditRangeState
  hasActiveFilters: boolean
  /** Tipos de entidad del catálogo real (`/api/v1/audit/entity-types`). */
  entityTypeOptions: readonly AuditCatalogOption[]
  onCategoryChange: (value: string) => void
  onActionChange: (value: string) => void
  onEntityTypeChange: (value: string) => void
  onLevelChange: (value: string) => void
  onResultChange: (value: AuditResultFilter) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onSearchDraftChange: (value: string) => void
  onApplySearch: () => void
  onClear: () => void
}

/**
 * Barra de filtros del registro. Todos los filtros viajan al BE
 * (start_date/end_date/search/category/action/entity_type/level/success); el
 * texto se aplica con Enter o "Aplicar" para no refetchear por tecla.
 * Categoría, acción y nivel ofrecen el vocabulario del modelo (+ LEGACY del
 * backfill); los tipos de entidad salen del catálogo real
 * (`/api/v1/audit/entity-types`). Un código histórico fuera de esas listas se
 * sigue viendo en la tabla, pero no se puede elegir acá.
 */
export const AuditFilters = ({
  filters,
  searchDraft,
  rangeState,
  hasActiveFilters,
  entityTypeOptions,
  onCategoryChange,
  onActionChange,
  onEntityTypeChange,
  onLevelChange,
  onResultChange,
  onStartDateChange,
  onEndDateChange,
  onSearchDraftChange,
  onApplySearch,
  onClear,
}: AuditFiltersProps) => {
  const { t } = useI18n()
  const ids = useId()
  const searchId = `${ids}-search`
  const fromId = `${ids}-from`
  const toId = `${ids}-to`
  const categoryId = `${ids}-category`
  const actionId = `${ids}-action`
  const entityTypeId = `${ids}-entity-type`
  const levelId = `${ids}-level`

  const invalidRange = rangeState === 'invalid'
  const incompleteRange = rangeState === 'incomplete' || rangeState === 'empty'

  return (
    <section
      aria-label={t('audit.filters.aria', 'Filtros del registro de auditoría')}
      className="rounded-md bg-surface p-md shadow-whisper"
      data-testid="audit-filters"
    >
      <div className="flex flex-col gap-md">
        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-xs">
            <Label htmlFor={fromId} className="text-body-sm-bold text-foreground">
              {t('audit.filters.from', 'Desde')}
            </Label>
            <Input
              id={fromId}
              type="date"
              value={filters.startDate}
              state={invalidRange ? 'error' : ''}
              onChange={(event) => onStartDateChange(event.target.value)}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor={toId} className="text-body-sm-bold text-foreground">
              {t('audit.filters.to', 'Hasta')}
            </Label>
            <Input
              id={toId}
              type="date"
              value={filters.endDate}
              state={invalidRange ? 'error' : ''}
              onChange={(event) => onEndDateChange(event.target.value)}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor={categoryId} className="text-body-sm-bold text-foreground">
              {t('audit.filters.category', 'Categoría')}
            </Label>
            <select
              id={categoryId}
              className={SELECT_CLASS}
              value={filters.category}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="">{t('audit.filters.allCategories', 'Todas')}</option>
              {AUDIT_FILTER_CATEGORIES.map((code) => (
                <option key={code} value={code}>
                  {t(auditCategoryLabelKey(code), auditCategoryFallback(code))}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-xs">
            <Label htmlFor={actionId} className="text-body-sm-bold text-foreground">
              {t('audit.filters.action', 'Acción')}
            </Label>
            <select
              id={actionId}
              className={SELECT_CLASS}
              value={filters.action}
              onChange={(event) => onActionChange(event.target.value)}
            >
              <option value="">{t('audit.filters.allActions', 'Todas')}</option>
              {AUDIT_FILTER_ACTIONS.map((code) => (
                <option key={code} value={code}>
                  {t(auditActionLabelKey(code), auditActionFallback(code))}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-xs">
            <Label htmlFor={entityTypeId} className="text-body-sm-bold text-foreground">
              {t('audit.filters.entityType', 'Tipo de entidad')}
            </Label>
            <select
              id={entityTypeId}
              className={SELECT_CLASS}
              value={filters.entityType}
              onChange={(event) => onEntityTypeChange(event.target.value)}
            >
              <option value="">{t('audit.filters.allEntityTypes', 'Todos')}</option>
              {entityTypeOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name || option.code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-xs">
            <Label htmlFor={levelId} className="text-body-sm-bold text-foreground">
              {t('audit.filters.level', 'Nivel')}
            </Label>
            <select
              id={levelId}
              className={SELECT_CLASS}
              value={filters.level}
              onChange={(event) => onLevelChange(event.target.value)}
            >
              <option value="">{t('audit.filters.allLevels', 'Todos')}</option>
              {AUDIT_FILTER_LEVELS.map((code) => (
                <option key={code} value={code}>
                  {t(auditLevelLabelKey(code), auditLevelFallback(code))}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
          <div className="shrink-0 space-y-xs">
            <p className="text-body-sm-bold text-foreground">
              {t('audit.filters.result', 'Resultado')}
            </p>
            <SegmentedControl
              options={AUDIT_RESULT_FILTERS.map((filter) => ({
                value: filter,
                label: t(RESULT_LABELS[filter].key, RESULT_LABELS[filter].fallback),
              }))}
              value={filters.result}
              onChange={(next: string) => onResultChange(next as AuditResultFilter)}
              aria-label={t('audit.filters.resultAria', 'Filtrar por resultado')}
              size="small"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-sm">
            <div className="w-full min-w-[220px] flex-1 space-y-xs">
              <Label htmlFor={searchId} className="text-body-sm-bold text-foreground">
                {t('audit.filters.search', 'Buscar')}
              </Label>
              <Input
                id={searchId}
                type="search"
                value={searchDraft}
                placeholder={t(
                  'audit.filters.searchPlaceholder',
                  'Descripción o ID de entidad',
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
            <div className="flex shrink-0 gap-sm">
              <Button variant="primary" type="button" onClick={onApplySearch}>
                <Search size={16} className="mr-xs" aria-hidden="true" />
                {t('audit.filters.apply', 'Aplicar')}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={onClear}
                disabled={!hasActiveFilters}
              >
                {t('audit.filters.clear', 'Limpiar')}
              </Button>
            </div>
          </div>
        </div>

        {invalidRange ? (
          <p role="alert" className="text-body-sm text-error">
            {t(
              'audit.filters.invalidRange',
              'La fecha «Desde» no puede ser posterior a «Hasta».',
            )}
          </p>
        ) : null}
        {incompleteRange ? (
          <p role="alert" className="text-body-sm text-warning">
            {t(
              'audit.filters.incompleteRange',
              'Completá ambas fechas para consultar el registro.',
            )}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default AuditFilters
