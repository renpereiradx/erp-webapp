import { useI18n } from '@/lib/i18n'

/**
 * Selector de período segmentado compartido por las 6 páginas del feature
 * de rentabilidad (antes: grupos de botones artesanales por página con
 * hex). Tokens DESIGN; estado con aria-pressed. FASE 2.
 */

export const PROFITABILITY_PERIODS = ['today', 'week', 'month', 'quarter', 'year'] as const

export type ProfitabilityPeriod = (typeof PROFITABILITY_PERIODS)[number]

const PERIOD_FALLBACK: Record<ProfitabilityPeriod, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  quarter: 'Trim.',
  year: 'Año',
}

interface PeriodSelectorProps {
  value: ProfitabilityPeriod
  onChange: (period: ProfitabilityPeriod) => void
  /** Subconjunto visible (default: today/week/month/year). */
  periods?: ProfitabilityPeriod[]
  testId?: string
}

const PeriodSelector = ({
  value,
  onChange,
  periods = ['today', 'week', 'month', 'year'],
  testId,
}: PeriodSelectorProps) => {
  const { t } = useI18n()

  return (
    <div
      className="inline-flex p-xs bg-surface-muted rounded-md border border-border-subtle"
      role="group"
      aria-label={t('bi.profitability.period.label', 'Período', {})}
      data-testid={testId}
    >
      {periods.map((period) => {
        const active = value === period
        return (
          <button
            key={period}
            type="button"
            aria-pressed={active}
            data-testid={`period-${period}`}
            onClick={() => onChange(period)}
            className={`px-md py-xs rounded-xs text-body-sm-bold uppercase tracking-wide transition-colors duration-150 ${
              active
                ? 'bg-surface text-primary shadow-sm'
                : 'text-on-surface-deep hover:text-foreground'
            }`}
          >
            {t(`bi.profitability.period.${period}`, PERIOD_FALLBACK[period], {})}
          </button>
        )
      })}
    </div>
  )
}

export default PeriodSelector
