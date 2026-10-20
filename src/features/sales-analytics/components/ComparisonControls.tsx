import { useI18n } from '@/lib/i18n'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BiPeriodSelector } from '@/components/bi/BiPeriodSelector'
import type { DashboardPeriod } from '@/types/bi'
import type { ComparisonDraft, ComparisonMode } from '@/domain/sales-analytics/comparison'

type InvalidField = keyof ComparisonDraft | 'range1' | 'range2'

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: 'Hoy',
  week: 'Últimos 7 días',
  month: 'Este mes',
  year: 'Este año',
}

interface ComparisonControlsProps {
  mode: ComparisonMode
  onModeChange: (mode: ComparisonMode) => void
  period: DashboardPeriod
  onPeriodChange: (period: DashboardPeriod) => void
  draft: ComparisonDraft
  onDraftChange: (draft: ComparisonDraft) => void
  onApply: () => void
  invalidFields: InvalidField[]
  isFetching?: boolean
}

/**
 * Controles de la comparativa: período vs ventana previa (aplica al elegir) o
 * dos rangos personalizados (draft + "Comparar"). Un rango inválido no
 * dispara request y se avisa explícitamente.
 */
export const ComparisonControls = ({
  mode,
  onModeChange,
  period,
  onPeriodChange,
  draft,
  onDraftChange,
  onApply,
  invalidFields,
  isFetching = false,
}: ComparisonControlsProps) => {
  const { t } = useI18n()
  const invalid = (field: InvalidField) => invalidFields.includes(field)

  const setField = (field: keyof ComparisonDraft, value: string) => {
    onDraftChange({ ...draft, [field]: value })
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          options={[
            {
              value: 'period',
              label: t('salesAnalytics.comparison.modePeriod', 'Período vs anterior'),
            },
            {
              value: 'custom',
              label: t('salesAnalytics.comparison.modeCustom', 'Rangos personalizados'),
            },
          ]}
          value={mode}
          onChange={(next: string) => onModeChange(next as ComparisonMode)}
          aria-label={t('salesAnalytics.comparison.modeLabel', 'Modo de comparación')}
          size="small"
        />
        {mode === 'period' ? (
          <BiPeriodSelector
            value={period}
            onChange={onPeriodChange}
            label={t('salesAnalytics.period.label', 'Período')}
            optionLabels={{
              today: t('salesAnalytics.period.today', PERIOD_LABELS.today),
              week: t('salesAnalytics.period.week', PERIOD_LABELS.week),
              month: t('salesAnalytics.period.month', PERIOD_LABELS.month),
              year: t('salesAnalytics.period.year', PERIOD_LABELS.year),
            }}
          />
        ) : null}
      </div>

      {mode === 'custom' ? (
        <form
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault()
            onApply()
          }}
          className="space-y-md"
        >
          <div className="grid gap-md md:grid-cols-2">
            <fieldset className="min-w-0 space-y-sm">
              <legend className="text-label-caps uppercase text-on-surface-deep">
                {t('salesAnalytics.comparison.periodA', 'Período A')}
              </legend>
              <div className="grid gap-sm sm:grid-cols-2">
                <div className="space-y-xs">
                  <Label htmlFor="comparison-start1">
                    {t('salesAnalytics.comparison.from', 'Desde')}
                  </Label>
                  <Input
                    id="comparison-start1"
                    type="date"
                    value={draft.start1}
                    max={draft.end1 || undefined}
                    aria-invalid={invalid('start1') || invalid('range1')}
                    onChange={(event) => setField('start1', event.target.value)}
                  />
                </div>
                <div className="space-y-xs">
                  <Label htmlFor="comparison-end1">
                    {t('salesAnalytics.comparison.to', 'Hasta')}
                  </Label>
                  <Input
                    id="comparison-end1"
                    type="date"
                    value={draft.end1}
                    min={draft.start1 || undefined}
                    aria-invalid={invalid('end1') || invalid('range1')}
                    onChange={(event) => setField('end1', event.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="min-w-0 space-y-sm">
              <legend className="text-label-caps uppercase text-on-surface-deep">
                {t('salesAnalytics.comparison.periodB', 'Período B')}
              </legend>
              <div className="grid gap-sm sm:grid-cols-2">
                <div className="space-y-xs">
                  <Label htmlFor="comparison-start2">
                    {t('salesAnalytics.comparison.from', 'Desde')}
                  </Label>
                  <Input
                    id="comparison-start2"
                    type="date"
                    value={draft.start2}
                    max={draft.end2 || undefined}
                    aria-invalid={invalid('start2') || invalid('range2')}
                    onChange={(event) => setField('start2', event.target.value)}
                  />
                </div>
                <div className="space-y-xs">
                  <Label htmlFor="comparison-end2">
                    {t('salesAnalytics.comparison.to', 'Hasta')}
                  </Label>
                  <Input
                    id="comparison-end2"
                    type="date"
                    value={draft.end2}
                    min={draft.start2 || undefined}
                    aria-invalid={invalid('end2') || invalid('range2')}
                    onChange={(event) => setField('end2', event.target.value)}
                  />
                </div>
              </div>
            </fieldset>
          </div>

          {invalidFields.length > 0 ? (
            <p role="alert" className="text-body-md text-error">
              {t(
                'salesAnalytics.comparison.invalidRange',
                'Cada rango debe tener una fecha válida con "Desde" no posterior a "Hasta".',
              )}
            </p>
          ) : null}

          <div>
            <Button type="submit" variant="primary" size="md" loading={isFetching}>
              {t('salesAnalytics.comparison.apply', 'Comparar')}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default ComparisonControls
