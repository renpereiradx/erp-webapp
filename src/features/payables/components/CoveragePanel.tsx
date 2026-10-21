import { useI18n } from '@/lib/i18n'
import { formatPercent, formatRatio } from '@/domain/payables/format'
import type { CoverageStatusKey } from '@/domain/payables/cashFlow'
import { PayablesBadge } from './PayablesBadges'

const STATUS_LABEL: Record<CoverageStatusKey, { key: string; fallback: string }> = {
  critical: { key: 'payables.cashFlow.coverageCritical', fallback: 'Cobertura crítica' },
  warning: { key: 'payables.cashFlow.coverageWarning', fallback: 'Cobertura ajustada' },
  healthy: { key: 'payables.cashFlow.coverageHealthy', fallback: 'Cobertura suficiente' },
}

const STATUS_TONE: Record<CoverageStatusKey, 'error' | 'warning' | 'success'> = {
  critical: 'error',
  warning: 'warning',
  healthy: 'success',
}

/**
 * Cobertura de pagos esperados = cobros / pagos de la ventana. El ratio se
 * deriva con la fórmula del BE; sin pagos esperados se muestra `—` (un 0 %
 * sugeriría una cobertura nula que no existe).
 */
export const CoveragePanel = ({
  ratio,
  status,
}: {
  ratio: number | null
  status: CoverageStatusKey | null
}) => {
  const { t } = useI18n()

  return (
    <div className="space-y-sm" data-testid="payables-coverage-panel">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <p className="text-label-caps uppercase text-on-surface-deep">
          {t('payables.cashFlow.coverage', 'Cobertura de pagos')}
        </p>
        {status ? (
          <PayablesBadge tone={STATUS_TONE[status]} testId={`payables-coverage-${status}`}>
            {t(STATUS_LABEL[status].key, STATUS_LABEL[status].fallback)}
          </PayablesBadge>
        ) : null}
      </div>
      <p className="font-data-mono text-title-lg text-foreground">
        {ratio === null
          ? '—'
          : t('payables.cashFlow.coverageValue', '{ratio} ({percent})', {
              ratio: formatRatio(ratio / 100),
              percent: formatPercent(ratio),
            })}
      </p>
      <p className="text-body-sm text-on-surface-deep">
        {t(
          'payables.cashFlow.coverageHint',
          'Cobros esperados ÷ pagos esperados de la ventana. Debajo de 80 % es crítico y debajo de 100 % es ajustado.',
        )}
      </p>
    </div>
  )
}

export default CoveragePanel
