/**
 * Constantes del dominio de Pronósticos (F11).
 *
 * Los valores reflejan el contrato real de `/forecast/*`:
 *  - métodos soportados por `validateForecastMethod` (un método desconocido es
 *    un 400, no una degradación silenciosa);
 *  - topes del handler: `forecast_months` 1-12 y `history_months` 1-24;
 *  - SEASONAL exige ≥ 12 puntos de historia con valores no nulos;
 *  - umbrales de las recomendaciones del BE (cobertura < 14 días, confianza
 *    < 70, tendencia DECREASING) y del riesgo de quiebre (≤3 / ≤7 / ≤14 días);
 *  - `days_until_stockout = 999` es el centinela de "sin velocidad de venta".
 *
 * Los textos `*_FALLBACK` son el fallback en español de `t(key, fallback)`;
 * la traducción real vive en `locales/{es,en}/forecast.ts`.
 */
import type {
  ForecastGranularity,
  ForecastInsightType,
  ForecastMethod,
  ForecastStockoutRisk,
  ForecastTrend,
  RevenueScenarioName,
} from '@/types/bi'

/**
 * Métodos que acepta el BE (`validateForecastMethod`). SEASONAL se conserva acá
 * por contrato, pero la UI no lo ofrece: exige ≥ 12 puntos de historia con
 * ventas no nulas y la ventana mensual puede no alcanzarlos (en dev, 12 meses
 * de ventana producen 6 puntos y el endpoint responde 400).
 */
export const FORECAST_METHODS: readonly ForecastMethod[] = [
  'LINEAR',
  'MOVING_AVG',
  'EXPONENTIAL',
  'SEASONAL',
]

/** Métodos seleccionables en la UI (SEASONAL no se expone). */
export const FORECAST_UI_METHODS: readonly ForecastMethod[] = [
  'LINEAR',
  'MOVING_AVG',
  'EXPONENTIAL',
]

export const FORECAST_GRANULARITIES: readonly ForecastGranularity[] = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
]

export const FORECAST_TRENDS: readonly ForecastTrend[] = ['INCREASING', 'DECREASING', 'STABLE']

export const FORECAST_RISKS: readonly ForecastStockoutRisk[] = ['HIGH', 'MEDIUM', 'LOW', 'NONE']

export const FORECAST_INSIGHT_TYPES: readonly ForecastInsightType[] = [
  'SALES_TREND',
  'SEASONALITY',
  'INVENTORY_RISK',
  'INVENTORY_COVERAGE',
  'REVENUE_PROJECTION',
]

export const REVENUE_SCENARIO_NAMES: readonly RevenueScenarioName[] = [
  'PESSIMISTIC',
  'BASELINE',
  'OPTIMISTIC',
]

/** Horizontes ofrecidos en la UI (todos dentro del tope de 12 del handler). */
export const FORECAST_HORIZONS = [3, 6, 12] as const
export const REVENUE_HORIZONS = [3, 6, 12] as const
export const DEMAND_HORIZONS = [3, 6, 12] as const
export const INVENTORY_HORIZONS = [30, 60, 90] as const

/** Meses de historia ofrecidos al BE (tope del handler: 24). */
export const FORECAST_HISTORY_MONTHS = [6, 12, 24] as const

export const DEFAULT_FORECAST_MONTHS = 3
export const DEFAULT_FORECAST_HISTORY = 6
export const DEFAULT_REVENUE_HISTORY = 12
export const DEFAULT_DEMAND_HISTORY = 6
export const DEFAULT_INVENTORY_DAYS = 30
export const DEFAULT_FORECAST_METHOD: ForecastMethod = 'LINEAR'
/** La UI solo consume buckets mensuales (las tablas diarias/semanales no son pantalla). */
export const SALES_FORECAST_GRANULARITY: ForecastGranularity = 'MONTHLY'

export const FORECAST_MAX_FORECAST_MONTHS = 12
export const FORECAST_MAX_HISTORY_MONTHS = 24
/** El repo corta el set de inventario con `LIMIT 100`. */
export const INVENTORY_MAX_PRODUCTS = 100
/** Regla del proyecto: 10 filas por página en tablas de datos. */
export const FORECAST_PAGE_SIZE = 10

/** Umbrales documentados del BE (no inventados por la UI). */
export const SALES_TREND_THRESHOLD = 5
export const INVENTORY_COVERAGE_THRESHOLD_DAYS = 14
export const REVENUE_LOW_CONFIDENCE = 70
export const HIGH_RISK_MAX_DAYS = 3
export const MEDIUM_RISK_MAX_DAYS = 7
export const LOW_RISK_MAX_DAYS = 14
export const STOCKOUT_SENTINEL_DAYS = 999
export const REORDER_LEAD_TIME_DAYS = 3

export const METHOD_FALLBACK: Record<string, string> = {
  LINEAR: 'Regresión lineal',
  MOVING_AVG: 'Media móvil',
  EXPONENTIAL: 'Suavizado exponencial',
  SEASONAL: 'Descomposición estacional',
}

/** Etiquetas cortas del selector (el modelo completo se muestra en la card). */
export const METHOD_SHORT_FALLBACK: Record<string, string> = {
  LINEAR: 'Lineal',
  MOVING_AVG: 'Media móvil',
  EXPONENTIAL: 'Exponencial',
}

export const GRANULARITY_FALLBACK: Record<string, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
}

export const TREND_FALLBACK: Record<string, string> = {
  INCREASING: 'En alza',
  DECREASING: 'En baja',
  STABLE: 'Estable',
}

export const RISK_FALLBACK: Record<string, string> = {
  HIGH: 'Alto',
  MEDIUM: 'Medio',
  LOW: 'Bajo',
  NONE: 'Sin riesgo',
}

export const INSIGHT_IMPACT_FALLBACK: Record<string, string> = {
  HIGH: 'Alto',
  MEDIUM: 'Medio',
  LOW: 'Bajo',
}

export const SCENARIO_FALLBACK: Record<string, string> = {
  PESSIMISTIC: 'Pesimista',
  BASELINE: 'Base',
  OPTIMISTIC: 'Optimista',
}

export const ALERT_TYPE_FALLBACK: Record<string, string> = {
  STOCKOUT_IMMINENT: 'Quiebre inminente',
  LOW_STOCK: 'Stock bajo',
}

export const SEVERITY_FALLBACK: Record<string, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
}

/** Claves i18n por tipo de alerta (claves camelCase, no el código crudo). */
export const ALERT_TYPE_I18N_KEYS: Record<string, string> = {
  STOCKOUT_IMMINENT: 'stockoutImminent',
  LOW_STOCK: 'lowStock',
}

/** Meses abreviados en español que emite el BE en `seasonality`. */
export const MONTH_ABBREVIATIONS_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const

/** Claves i18n por método/granularidad (las etiquetas viven en el locale). */
export const METHOD_I18N_KEYS: Record<string, string> = {
  LINEAR: 'linear',
  MOVING_AVG: 'movingAvg',
  EXPONENTIAL: 'exponential',
  SEASONAL: 'seasonal',
}

export const GRANULARITY_I18N_KEYS: Record<string, string> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
}
