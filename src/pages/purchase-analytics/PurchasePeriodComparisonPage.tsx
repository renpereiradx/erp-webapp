import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/DataSkeletons'
import { TableCard } from '@/components/ui/TableCard'
import type { DashboardPeriod } from '@/types/bi'
import {
  buildPurchaseComparisonParams,
  defaultPurchaseComparisonDraft,
  validatePurchaseComparisonDraft,
  type PurchaseComparisonDraft,
  type PurchaseComparisonMode,
} from '@/domain/purchase-analytics/comparison'
import {
  PurchaseComparisonControls,
  PurchaseComparisonResult,
  PurchasePageLayout,
  PurchaseRefreshButton,
  usePurchaseComparison,
} from '@/features/purchase-analytics'

/**
 * Comparativa de ventanas de compras. Modo período: ventana actual vs la
 * anterior equivalente (ambas resueltas por el BE). Modo personalizado: dos
 * rangos con fechas explícitas. Las variaciones son relativas y los rangos se
 * muestran con el fin inclusivo.
 */
const PurchasePeriodComparisonPage = () => {
  const { t } = useI18n()
  const [mode, setMode] = useState<PurchaseComparisonMode>('period')
  const [period, setPeriod] = useState<DashboardPeriod>('month')
  const [initialDraft] = useState<PurchaseComparisonDraft>(() =>
    defaultPurchaseComparisonDraft(new Date()),
  )
  const [draft, setDraft] = useState<PurchaseComparisonDraft>(initialDraft)
  const [applied, setApplied] = useState<PurchaseComparisonDraft>(initialDraft)

  const draftValidation = validatePurchaseComparisonDraft(draft)
  const appliedValidation = validatePurchaseComparisonDraft(applied)
  const enabled = mode === 'period' || appliedValidation.valid
  const params = buildPurchaseComparisonParams(mode, period, applied)

  const comparisonQuery = usePurchaseComparison(params, enabled)
  const errorTitle = t('purchaseAnalytics.errors.title', 'No se pudieron cargar los datos')

  const handleModeChange = (next: PurchaseComparisonMode) => {
    setMode(next)
    if (next === 'custom' && validatePurchaseComparisonDraft(draft).valid) {
      // El modo personalizado arranca con el rango default ya aplicado.
      setApplied(draft)
    }
  }

  const handleApply = () => {
    if (draftValidation.valid) setApplied(draft)
  }

  return (
    <PurchasePageLayout
      title={t('purchaseAnalytics.comparison.title', 'Comparativa de compras')}
      actions={<PurchaseRefreshButton />}
    >
      <SectionCard
        title={t('purchaseAnalytics.comparison.controlsTitle', 'Parámetros')}
        testId="purchase-comparison-controls"
      >
        <PurchaseComparisonControls
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
        title={t('purchaseAnalytics.comparison.resultTitle', 'Resultado')}
        description={t(
          'purchaseAnalytics.comparison.resultSubtitle',
          'Ventana A contra ventana B; la variación es A − B.',
        )}
        testId="purchase-comparison-result"
      >
        {!enabled ? (
          <p className="px-lg pb-lg text-body-md text-on-surface-deep">
            {t(
              'purchaseAnalytics.comparison.fixRange',
              'Corregí el rango de fechas para ver la comparación.',
            )}
          </p>
        ) : (
          <QueryBoundary
            isLoading={comparisonQuery.isLoading}
            error={comparisonQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void comparisonQuery.refetch()}
            skeleton={<TableSkeleton rows={5} testId="purchase-comparison-skeleton" />}
          >
            {comparisonQuery.data?.comparison ? (
              <PurchaseComparisonResult comparison={comparisonQuery.data.comparison} />
            ) : null}
          </QueryBoundary>
        )}
        {mode === 'period' ? (
          <p className="border-t border-divider px-md py-sm text-body-sm text-on-surface-deep">
            {t(
              'purchaseAnalytics.comparison.partialHint',
              'La ventana actual incluye solo las compras registradas hasta hoy; la ventana B es la previa de igual duración.',
            )}
          </p>
        ) : null}
      </TableCard>
    </PurchasePageLayout>
  )
}

export default PurchasePeriodComparisonPage
