/**
 * Derivaciones puras del dashboard de pronósticos (F11).
 *
 * `GET /forecast/dashboard` ya compone los 4 pronósticos y genera
 * `key_insights` (con `type` estable) y `recommendations` (texto en español
 * sin clave de traducción). La UI:
 *  - traduce los insights por `type` y usa el `value` real del payload;
 *  - deriva las recomendaciones de las MISMAS condiciones y umbrales del BE
 *    (cobertura < 14 días, productos de riesgo > 0, tendencia DECREASING,
 *    estacionalidad con picos, confianza de ingresos < 70), con i18n propio.
 *    Los textos en español del servidor no se renderizan.
 *
 * El dashboard llama al BE con un historial de 6 meses para ventas y 12 para
 * ingresos, y `forecast_months = months`: sus cifras pueden diferir de las
 * pantallas que usan otro historial. La UI lo dice en la descripción.
 */
import type { ForecastDashboard, ForecastInsightType } from '@/types/bi'
import {
  INVENTORY_COVERAGE_THRESHOLD_DAYS,
  REVENUE_LOW_CONFIDENCE,
} from './constants'
import {
  formatCount,
  formatDecimal,
  formatMoney,
  formatPercent,
  formatSignedPercent,
  toNumberOrNull,
  type ForecastKpiValue,
} from './format'
import { demandUnitTotals } from './demand'
import { salesSeasonality } from './sales'

export type DashboardRecommendationId =
  | 'inventoryHighRisk'
  | 'inventoryCoverage'
  | 'salesDecline'
  | 'salesSeasonality'
  | 'revenueLowConfidence'

export interface DashboardRecommendationView {
  id: DashboardRecommendationId
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  values: Record<string, string>
  href: string
}

export interface DashboardInsightView {
  id: string
  type: ForecastInsightType
  impact: string
  valueLabel: string
  /** Detalle ya localizado cuando el insight no tiene cifra (estacionalidad). */
  detail?: string
}

export interface DashboardGroupSummary {
  id: 'sales' | 'revenue' | 'inventory' | 'demand'
  metricLabelKey: string
  valueLabel: string
  hintLabel: string
  href: string
}

const KNOWN_INSIGHTS: readonly ForecastInsightType[] = [
  'SALES_TREND',
  'SEASONALITY',
  'INVENTORY_RISK',
  'INVENTORY_COVERAGE',
  'REVENUE_PROJECTION',
]

export const dashboardKpis = (
  dashboard: ForecastDashboard | null | undefined,
): ForecastKpiValue[] => {
  const demand = demandUnitTotals(dashboard?.demand_forecast)
  return [
    {
      id: 'salesForecast',
      kind: 'money',
      value: toNumberOrNull(dashboard?.sales_forecast?.summary?.total_forecast),
    },
    {
      id: 'annualRevenue',
      kind: 'money',
      value: toNumberOrNull(dashboard?.revenue_forecast?.summary?.annual_projection),
    },
    {
      id: 'riskProducts',
      kind: 'count',
      value: toNumberOrNull(dashboard?.inventory_forecast?.summary?.high_risk_products),
    },
    {
      id: 'demandUnits',
      kind: 'count',
      value: dashboard?.demand_forecast ? demand.forecast : null,
    },
    {
      id: 'coverage',
      kind: 'decimal',
      value: toNumberOrNull(dashboard?.inventory_forecast?.summary?.overall_coverage),
    },
  ]
}

/** Insights conocidos, en el orden del BE; un tipo desconocido se omite. */
export const dashboardInsightViews = (
  dashboard: ForecastDashboard | null | undefined,
  lang?: string,
): DashboardInsightView[] => {
  const sales = dashboard?.sales_forecast
  const inventory = dashboard?.inventory_forecast
  const revenue = dashboard?.revenue_forecast
  const seasonality = salesSeasonality(sales?.seasonality, lang)

  return (dashboard?.key_insights ?? []).flatMap((insight, index) => {
    if (!KNOWN_INSIGHTS.includes(insight.type as ForecastInsightType)) return []
    const type = insight.type as ForecastInsightType
    let valueLabel = '—'
    let detail: string | undefined

    switch (type) {
      case 'SALES_TREND':
        valueLabel = formatSignedPercent(sales?.summary?.growth_rate)
        break
      case 'SEASONALITY':
        valueLabel = seasonality.peaks.length
          ? seasonality.peaks.join(', ')
          : '—'
        detail = seasonality.lows.length ? seasonality.lows.join(', ') : undefined
        break
      case 'INVENTORY_RISK':
        valueLabel = formatCount(inventory?.summary?.high_risk_products)
        break
      case 'INVENTORY_COVERAGE':
        valueLabel = formatDecimal(inventory?.summary?.overall_coverage, 1)
        break
      case 'REVENUE_PROJECTION':
        valueLabel = formatMoney(revenue?.summary?.annual_projection)
        break
      default:
        break
    }

    return [
      {
        id: `${type}-${index}`,
        type,
        impact: insight.impact,
        valueLabel,
        detail,
      },
    ]
  })
}

/**
 * Recomendaciones derivadas con los umbrales del BE. Se emiten en el mismo
 * orden que el servidor (inventario antes de ventas; ANALYTICS al final) y
 * solo cuando la condición real se cumple.
 */
export const dashboardRecommendationViews = (
  dashboard: ForecastDashboard | null | undefined,
  lang?: string,
): DashboardRecommendationView[] => {
  const views: DashboardRecommendationView[] = []
  const inventory = dashboard?.inventory_forecast?.summary
  const sales = dashboard?.sales_forecast
  const revenue = dashboard?.revenue_forecast?.summary
  const seasonality = salesSeasonality(sales?.seasonality, lang)

  const highRisk = toNumberOrNull(inventory?.high_risk_products) ?? 0
  const coverage = toNumberOrNull(inventory?.overall_coverage)
  const growth = toNumberOrNull(sales?.summary?.growth_rate)
  const revenueConfidence = toNumberOrNull(revenue?.confidence_level)

  if (highRisk > 0) {
    views.push({
      id: 'inventoryHighRisk',
      priority: 'HIGH',
      values: { count: formatCount(highRisk) },
      href: '/bi/pronosticos/inventario',
    })
  }

  if (coverage !== null && coverage < INVENTORY_COVERAGE_THRESHOLD_DAYS) {
    views.push({
      id: 'inventoryCoverage',
      priority: 'MEDIUM',
      values: {
        days: formatDecimal(coverage, 1),
        threshold: formatCount(INVENTORY_COVERAGE_THRESHOLD_DAYS),
      },
      href: '/bi/pronosticos/inventario',
    })
  }

  if (sales?.summary?.trend === 'DECREASING') {
    views.push({
      id: 'salesDecline',
      priority: 'HIGH',
      values: { growth: formatSignedPercent(growth) },
      href: '/bi/pronosticos/ventas',
    })
  }

  if (seasonality.hasSeasonality && seasonality.peaks.length > 0) {
    views.push({
      id: 'salesSeasonality',
      priority: 'MEDIUM',
      values: { peaks: seasonality.peaks.join(', ') },
      href: '/bi/pronosticos/ventas',
    })
  }

  if (revenueConfidence !== null && revenueConfidence < REVENUE_LOW_CONFIDENCE) {
    views.push({
      id: 'revenueLowConfidence',
      priority: 'LOW',
      values: {
        confidence: formatPercent(revenueConfidence),
        threshold: formatPercent(REVENUE_LOW_CONFIDENCE),
      },
      href: '/bi/pronosticos/ingresos',
    })
  }

  return views
}

/** Resumen por pantalla del grupo (valores reales embebidos en el payload). */
export const dashboardGroupSummaries = (
  dashboard: ForecastDashboard | null | undefined,
): DashboardGroupSummary[] => {
  const demand = demandUnitTotals(dashboard?.demand_forecast)
  const inventory = dashboard?.inventory_forecast?.summary
  const revenue = dashboard?.revenue_forecast?.summary
  return [
    {
      id: 'sales',
      metricLabelKey: 'forecast.dashboard.groups.salesMetric',
      valueLabel: formatMoney(dashboard?.sales_forecast?.summary?.total_forecast),
      hintLabel: formatSignedPercent(dashboard?.sales_forecast?.summary?.growth_rate),
      href: '/bi/pronosticos/ventas',
    },
    {
      id: 'revenue',
      metricLabelKey: 'forecast.dashboard.groups.revenueMetric',
      valueLabel: formatMoney(revenue?.forecast_revenue),
      hintLabel: formatMoney(revenue?.annual_projection),
      href: '/bi/pronosticos/ingresos',
    },
    {
      id: 'inventory',
      metricLabelKey: 'forecast.dashboard.groups.inventoryMetric',
      valueLabel: `${formatDecimal(inventory?.overall_coverage, 1)}`,
      hintLabel: formatCount(inventory?.high_risk_products),
      href: '/bi/pronosticos/inventario',
    },
    {
      id: 'demand',
      metricLabelKey: 'forecast.dashboard.groups.demandMetric',
      valueLabel: formatCount(demand.forecast),
      hintLabel: formatCount((dashboard?.demand_forecast?.categories ?? []).length),
      href: '/bi/pronosticos/demanda',
    },
  ]
}
