import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { DashboardRecommendationView } from '@/domain/forecast/dashboard'
import { ForecastPriorityBadge } from './ForecastBadges'

const RECOMMENDATION_META: Record<
  string,
  { key: string; fallbackTitle: string; fallbackDescription: string }
> = {
  inventoryHighRisk: {
    key: 'inventoryHighRisk',
    fallbackTitle: 'Reabastecer productos en riesgo',
    fallbackDescription: 'Hay {count} productos con riesgo alto de agotamiento.',
  },
  inventoryCoverage: {
    key: 'inventoryCoverage',
    fallbackTitle: 'Aumentar niveles de inventario',
    fallbackDescription:
      'La cobertura es de {days} días; el umbral del backend es {threshold}.',
  },
  salesDecline: {
    key: 'salesDecline',
    fallbackTitle: 'Revertir tendencia de ventas',
    fallbackDescription: 'Las ventas muestran una tendencia decreciente de {growth}.',
  },
  salesSeasonality: {
    key: 'salesSeasonality',
    fallbackTitle: 'Prepararse para temporada alta',
    fallbackDescription: 'Picos de ventas detectados en: {peaks}.',
  },
  revenueLowConfidence: {
    key: 'revenueLowConfidence',
    fallbackTitle: 'Mejorar precisión de pronósticos',
    fallbackDescription:
      'La confianza de ingresos es {confidence}, por debajo de {threshold}.',
  },
}

interface ForecastRecommendationsPanelProps {
  recommendations: DashboardRecommendationView[]
  testId?: string
}

/**
 * Recomendaciones derivadas de las mismas condiciones/umbrales que usa el BE
 * (documentadas en `domain/forecast/dashboard.ts`). El título/descripción en
 * español del servidor no se renderiza: la UI usa i18n propio con las cifras
 * reales del payload.
 */
export const ForecastRecommendationsPanel = ({
  recommendations,
  testId,
}: ForecastRecommendationsPanelProps) => {
  const { t } = useI18n()

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-sm py-lg text-center text-on-surface-deep">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={22} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="text-body-md-bold text-foreground">
          {t('forecast.dashboard.recommendationsEmpty', 'Sin recomendaciones')}
        </p>
        <p className="text-body-sm">
          {t(
            'forecast.dashboard.recommendationsEmptyHint',
            'Las condiciones del backend (cobertura, riesgo, tendencia y confianza) no disparan ninguna acción.',
          )}
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-divider" data-testid={testId}>
      {recommendations.map((recommendation) => {
        const meta = RECOMMENDATION_META[recommendation.id]
        if (!meta) return null
        return (
          <li key={recommendation.id} className="py-sm first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-sm">
              <ForecastPriorityBadge priority={recommendation.priority} />
              <p className="text-body-md-bold text-foreground">
                {t(
                  `forecast.dashboard.recommendations.${meta.key}.title`,
                  meta.fallbackTitle,
                )}
              </p>
            </div>
            <p className="mt-xs text-body-sm text-on-surface-deep">
              {t(
                `forecast.dashboard.recommendations.${meta.key}.description`,
                meta.fallbackDescription,
                recommendation.values,
              )}
            </p>
            <Link
              to={recommendation.href}
              className="mt-xs inline-flex items-center gap-xs text-body-sm-bold text-primary hover:underline"
            >
              {t('forecast.dashboard.openScreen', 'Ver pantalla')}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default ForecastRecommendationsPanel
