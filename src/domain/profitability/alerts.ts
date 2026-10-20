/**
 * Alertas del dashboard de rentabilidad (F6).
 *
 * El BE emite `message` en español hardcodeado ("Margen bruto bajo: 12,3 %").
 * La UI NO lo muestra: traduce el `type` real y formatea `value`/`threshold`
 * con el locale. Umbrales del SQL: margen 15 %, crecimiento de beneficio
 * -10 %/+20 % y productos con pérdida > 0.
 */
import type { ProfitabilityAlert } from '@/types/bi'
import { toNumberOrNull } from './format'

export type ProfitabilityAlertKey =
  | 'lowMargin'
  | 'decliningProfit'
  | 'unprofitableProducts'
  | 'profitGrowth'

export type ProfitabilityAlertTone = 'error' | 'warning' | 'success' | 'neutral'

export type ProfitabilityAlertValueKind = 'percent' | 'signedPercent' | 'count'

const ALERT_KEYS: Record<string, ProfitabilityAlertKey> = {
  LOW_MARGIN: 'lowMargin',
  DECLINING_PROFIT: 'decliningProfit',
  UNPROFITABLE_PRODUCTS: 'unprofitableProducts',
  PROFIT_GROWTH: 'profitGrowth',
}

const VALUE_KINDS: Record<ProfitabilityAlertKey, ProfitabilityAlertValueKind> = {
  lowMargin: 'percent',
  decliningProfit: 'signedPercent',
  unprofitableProducts: 'count',
  profitGrowth: 'signedPercent',
}

const TONES: Record<ProfitabilityAlertKey, ProfitabilityAlertTone> = {
  lowMargin: 'error',
  decliningProfit: 'warning',
  unprofitableProducts: 'warning',
  profitGrowth: 'success',
}

/** `LOW_MARGIN` → `lowMargin`; un tipo desconocido no se renderiza. */
export const alertKey = (type: string | null | undefined): ProfitabilityAlertKey | null => {
  if (!type) return null
  return ALERT_KEYS[type.toUpperCase()] ?? null
}

export const alertValueKind = (key: ProfitabilityAlertKey): ProfitabilityAlertValueKind =>
  VALUE_KINDS[key]

export const alertTone = (key: ProfitabilityAlertKey): ProfitabilityAlertTone => TONES[key]

export interface AlertView {
  key: ProfitabilityAlertKey
  alert: ProfitabilityAlert
  value: number
  threshold: number | null
}

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

/**
 * Normaliza las alertas: descarta tipos desconocidos, ordena por severidad y
 * expone `value`/`threshold` numéricos (nunca el mensaje en español).
 */
export const alertViews = (
  alerts: ProfitabilityAlert[] | null | undefined,
): AlertView[] => {
  const rows = Array.isArray(alerts) ? alerts : []
  return rows
    .flatMap((alert) => {
      const key = alertKey(alert.type)
      if (!key) return []
      return [
        {
          key,
          alert,
          value: toNumberOrNull(alert.value) ?? 0,
          threshold: toNumberOrNull(alert.threshold),
        },
      ]
    })
    .sort(
      (a, b) =>
        severityIndex(a.alert.severity) - severityIndex(b.alert.severity),
    )
}

const severityIndex = (severity: string | null | undefined): number => {
  const index = SEVERITY_ORDER.indexOf((severity ?? '').toUpperCase())
  return index === -1 ? SEVERITY_ORDER.length : index
}
