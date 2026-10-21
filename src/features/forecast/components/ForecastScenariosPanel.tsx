import { ShieldQuestion } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SCENARIO_FALLBACK } from '@/domain/forecast/constants'
import { formatMoney, formatPercent, formatSignedPercent } from '@/domain/forecast/format'
import type { RevenueScenarioRow } from '@/domain/forecast/revenue'
import { ForecastBadge } from './ForecastBadges'

interface ForecastScenariosPanelProps {
  scenarios: RevenueScenarioRow[]
  testId?: string
}

/**
 * Escenarios del BE (`include_scenarios=true`): base ±15 % con pesos
 * 20/60/20. Se muestran los importes y el peso que declara el modelo; el texto
 * `description` en español del repo no se renderiza.
 */
export const ForecastScenariosPanel = ({
  scenarios,
  testId,
}: ForecastScenariosPanelProps) => {
  const { t } = useI18n()

  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-sm py-lg text-center text-on-surface-deep">
        <ShieldQuestion size={24} strokeWidth={1.5} aria-hidden="true" />
        <p className="text-body-md-bold text-foreground">
          {t('forecast.revenue.scenariosEmpty', 'El backend no devolvió escenarios')}
        </p>
        <p className="text-body-sm">
          {t(
            'forecast.revenue.scenariosEmptyHint',
            'El endpoint los genera solo con include_scenarios=true.',
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-md sm:grid-cols-3" data-testid={testId}>
      {scenarios.map((scenario) => {
        const baseline = scenario.name === 'BASELINE'
        return (
          <div
            key={scenario.name}
            className={`rounded-md border p-md ${
              baseline ? 'border-primary bg-primary/5' : 'border-border-subtle bg-surface'
            }`}
            data-testid={`forecast-scenario-${scenario.name.toLowerCase()}`}
          >
            <div className="flex items-center justify-between gap-sm">
              <h3 className="text-body-md-bold text-foreground">
                {t(
                  `forecast.scenario.${scenario.name.toLowerCase()}`,
                  SCENARIO_FALLBACK[scenario.name] ?? scenario.name,
                )}
              </h3>
              {baseline ? (
                <ForecastBadge tone="primary">
                  {t('forecast.revenue.scenario.baselineTag', 'Base')}
                </ForecastBadge>
              ) : null}
            </div>
            <dl className="mt-sm space-y-xs">
              <div className="flex items-baseline justify-between gap-sm">
                <dt className="text-body-sm text-on-surface-deep">
                  {t('forecast.revenue.scenario.amount', 'Ingreso proyectado')}
                </dt>
                <dd className="whitespace-nowrap font-data-mono text-title-sm text-foreground">
                  {formatMoney(scenario.amount)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-sm">
                <dt className="text-body-sm text-on-surface-deep">
                  {t('forecast.revenue.scenario.weight', 'Peso del escenario')}
                </dt>
                <dd className="whitespace-nowrap font-data-mono text-data-mono text-foreground">
                  {formatPercent(scenario.probability, 0)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-sm">
                <dt className="text-body-sm text-on-surface-deep">
                  {t('forecast.revenue.scenario.growth', 'Crecimiento estimado')}
                </dt>
                <dd className="whitespace-nowrap font-data-mono text-data-mono text-foreground">
                  {formatSignedPercent(scenario.growth)}
                </dd>
              </div>
            </dl>
          </div>
        )
      })}
    </div>
  )
}

export default ForecastScenariosPanel
