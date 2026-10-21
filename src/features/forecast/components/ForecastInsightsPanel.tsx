import { Link } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Boxes, Coins, Flame, LineChart, PackageSearch } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { DashboardInsightView } from '@/domain/forecast/dashboard'
import { ForecastImpactBadge } from './ForecastBadges'

const INSIGHT_META: Record<
  string,
  { key: string; href: string; icon: LucideIcon; fallbackTitle: string; fallbackDescription: string }
> = {
  SALES_TREND: {
    key: 'salesTrend',
    href: '/bi/pronosticos/ventas',
    icon: LineChart,
    fallbackTitle: 'Tendencia de ventas',
    fallbackDescription: 'Promedio proyectado vs. histórico: {value}.',
  },
  SEASONALITY: {
    key: 'seasonality',
    href: '/bi/pronosticos/ventas',
    icon: Flame,
    fallbackTitle: 'Patrón estacional detectado',
    fallbackDescription: 'Meses pico: {value}.',
  },
  INVENTORY_RISK: {
    key: 'inventoryRisk',
    href: '/bi/pronosticos/inventario',
    icon: PackageSearch,
    fallbackTitle: 'Productos en riesgo de agotamiento',
    fallbackDescription: '{value} productos con riesgo alto de quedarse sin stock.',
  },
  INVENTORY_COVERAGE: {
    key: 'inventoryCoverage',
    href: '/bi/pronosticos/inventario',
    icon: Boxes,
    fallbackTitle: 'Cobertura de inventario',
    fallbackDescription: 'El inventario cubre {value} días de demanda proyectada.',
  },
  REVENUE_PROJECTION: {
    key: 'revenueProjection',
    href: '/bi/pronosticos/ingresos',
    icon: Coins,
    fallbackTitle: 'Proyección de ingresos anual',
    fallbackDescription: 'Se proyectan {value} de ingresos anuales.',
  },
}

interface ForecastInsightsPanelProps {
  insights: DashboardInsightView[]
  testId?: string
}

/**
 * Insights del dashboard: se traduce el `type` estable del BE y se usa el
 * `value` real del payload. El `title`/`description` en español del repo no se
 * renderiza. Un tipo desconocido ya viene filtrado por el dominio.
 */
export const ForecastInsightsPanel = ({ insights, testId }: ForecastInsightsPanelProps) => {
  const { t } = useI18n()

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-sm py-lg text-center text-on-surface-deep">
        <Lightbulb size={24} strokeWidth={1.5} aria-hidden="true" />
        <p className="text-body-md-bold text-foreground">
          {t('forecast.dashboard.insightsEmpty', 'El backend no generó insights')}
        </p>
        <p className="text-body-sm">
          {t(
            'forecast.dashboard.insightsEmptyHint',
            'Se calculan sobre los pronósticos del período; sin datos suficientes no hay insight.',
          )}
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-divider" data-testid={testId}>
      {insights.map((insight) => {
        const meta = INSIGHT_META[insight.type]
        if (!meta) return null
        const Icon = meta.icon
        return (
          <li key={insight.id} className="py-sm first:pt-0 last:pb-0">
            <div className="flex items-start gap-sm">
              <span
                className="mt-xs flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-sm">
                  <p className="text-body-md-bold text-foreground">
                    {t(
                      `forecast.dashboard.insights.${meta.key}.title`,
                      meta.fallbackTitle,
                    )}
                  </p>
                  <span className="font-data-mono text-data-mono text-foreground">
                    {insight.valueLabel}
                  </span>
                  <ForecastImpactBadge impact={insight.impact} />
                </div>
                <p className="text-body-sm text-on-surface-deep">
                  {t(
                    `forecast.dashboard.insights.${meta.key}.description`,
                    meta.fallbackDescription,
                    {
                      value: insight.valueLabel,
                      detail: insight.detail ?? '',
                    },
                  )}
                </p>
                <Link
                  to={meta.href}
                  className="text-body-sm-bold text-primary hover:underline"
                >
                  {t('forecast.dashboard.openScreen', 'Ver pantalla')}
                </Link>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default ForecastInsightsPanel
