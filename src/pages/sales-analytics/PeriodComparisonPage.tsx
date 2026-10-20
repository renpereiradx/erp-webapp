import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/DataSkeletons'
import type { DashboardPeriod } from '@/types/bi'
import {
  buildComparisonParams,
  defaultComparisonDraft,
  validateComparisonDraft,
  type ComparisonDraft,
  type ComparisonMode,
} from '@/domain/sales-analytics/comparison'
import {
  ComparisonControls,
  ComparisonResult,
  SalesPageLayout,
  SalesRefreshButton,
  TableCard,
  useSalesComparison,
} from '@/features/sales-analytics'

/**
 * F4 — Comparativa de períodos. Modo período: ventana actual vs la anterior
 * equivalente (ambas resueltas por el BE). Modo personalizado: dos rangos con
 * fechas explícitas. Las variaciones son relativas y el rango se muestra con
 * el fin inclusivo.
 */
const PeriodComparisonPage = () => {
  const { t } = useI18n()
  const [mode, setMode] = useState<ComparisonMode>('period')
  const [period, setPeriod] = useState<DashboardPeriod>('month')
  const [initialDraft] = useState<ComparisonDraft>(() => defaultComparisonDraft(new Date()))
  const [draft, setDraft] = useState<ComparisonDraft>(initialDraft)
  const [applied, setApplied] = useState<ComparisonDraft>(initialDraft)

  const draftValidation = validateComparisonDraft(draft)
  const appliedValidation = validateComparisonDraft(applied)
  const enabled = mode === 'period' || appliedValidation.valid
  const params = buildComparisonParams(mode, period, applied)

  const comparisonQuery = useSalesComparison(params, enabled)
  const errorTitle = t('salesAnalytics.errors.title', 'No se pudieron cargar los datos')

  const handleModeChange = (next: ComparisonMode) => {
    setMode(next)
    if (next === 'custom' && validateComparisonDraft(draft).valid) {
      // El modo personalizado arranca con el rango default ya aplicado.
      setApplied(draft)
    }
  }

  const handleApply = () => {
    if (draftValidation.valid) setApplied(draft)
  }

  return (
    <SalesPageLayout
      title={t('salesAnalytics.comparison.title', 'Comparativa de períodos')}
      subtitle={t(
        'salesAnalytics.comparison.subtitle',
        'Variaciones del período.',
      )}
      actions={<SalesRefreshButton />}
    >
      <SectionCard
        title={t('salesAnalytics.comparison.controlsTitle', 'Parámetros')}
        description={t(
          'salesAnalytics.comparison.controlsSubtitle',
          'Compará el período actual contra el anterior o elegí dos rangos.',
        )}
        testId="sales-comparison-controls"
      >
        <ComparisonControls
          mode={mode}
          onModeChange={handleModeChange}
          period={period}
          onPeriodChange={setPeriod}
          draft={draft}
          onDraftChange={setDraft}
          onApply={handleApply}
          invalidFields={mode === 'custom' ? draftValidation.invalidFields : []}
          isFetching={comparisonQuery.isFetching}
        />
      </SectionCard>

      <TableCard
        title={t('salesAnalytics.comparison.resultTitle', 'Resultado')}
        description={t(
          'salesAnalytics.comparison.resultSubtitle',
          'Período A contra período B; la variación es A − B.',
        )}
        testId="sales-comparison-result"
      >
        {!enabled ? (
          <p className="px-lg pb-lg text-body-md text-on-surface-deep">
            {t(
              'salesAnalytics.comparison.fixRange',
              'Corregí el rango de fechas para ver la comparación.',
            )}
          </p>
        ) : (
          <QueryBoundary
            isLoading={comparisonQuery.isLoading}
            error={comparisonQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void comparisonQuery.refetch()}
            skeleton={<TableSkeleton rows={6} testId="sales-comparison-skeleton" />}
          >
            {comparisonQuery.data?.comparison ? (
              <ComparisonResult comparison={comparisonQuery.data.comparison} />
            ) : null}
          </QueryBoundary>
        )}
        {mode === 'period' ? (
          <p className="border-t border-divider px-md py-sm text-body-sm text-on-surface-deep">
            {t(
              'salesAnalytics.comparison.partialHint',
              'La ventana actual incluye solo las ventas registradas hasta hoy; el período B es la ventana previa de igual duración.',
            )}
          </p>
        ) : null}
      </TableCard>
    </SalesPageLayout>
  )
}

export default PeriodComparisonPage
