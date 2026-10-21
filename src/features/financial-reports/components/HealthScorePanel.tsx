import { useI18n } from '@/lib/i18n'
import type { HealthScoreView } from '@/domain/finance/overview'
import { formatDate } from '@/domain/finance/format'
import { HealthRatingBadge } from './Badges'

/**
 * Score de salud financiera (0-100) y rating del BE. Los ratios se muestran
 * en el ledger de la página; acá van el score, el rating y la ventana.
 */
export const HealthScorePanel = ({ view }: { view: HealthScoreView }) => {
  const { t, lang } = useI18n()
  return (
    <div className="space-y-sm" data-testid="finance-health-panel">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <p className="font-data-mono text-display-sm text-foreground">
          {view.score === null ? '—' : view.score}
          <span className="ml-xs text-body-md text-on-surface-deep">/100</span>
        </p>
        <HealthRatingBadge rating={view.rating} />
      </div>
      <p className="text-body-sm text-on-surface-deep">
        {t('finance.health.window', 'Ventana evaluada: {start} – {end}', {
          start: formatDate(view.periodStart, lang),
          end: formatDate(view.periodEnd, lang),
        })}
      </p>
      <p className="text-body-sm text-on-surface-deep">
        {t(
          'finance.health.note',
          'El score lo calcula el backend con los ratios del resumen (liquidez y margen ingresos − compras). No incluye DSO, DPO ni rotaciones: esos campos no se calculan.',
        )}
      </p>
    </div>
  )
}

export default HealthScorePanel
