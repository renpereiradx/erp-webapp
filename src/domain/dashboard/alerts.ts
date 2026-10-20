/**
 * Pure logic for the consolidated alerts view (`/dashboard/alerts`).
 *
 * Fuente: `GET /dashboard/alerts` → `DashboardAlerts`. El backend emite
 * `severity` ∈ {critical, warning, info} y `category` ∈ {inventory,
 * financial, sales}; `title`/`message` son datos del servidor (se renderizan
 * tal cual) y las etiquetas de severidad/categoría se traducen en la UI.
 *
 * No React, no i18n, no fetch.
 */

import type { AlertDetails } from '@/types/bi'

export interface AlertLike {
  id: string | number
  severity?: string | null
  category?: string | null
  title?: string | null
  message?: string | null
  details?: AlertDetails | null
  created_at?: string | null
  action_url?: string | null
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  error: 0, // alias legacy del backend
  warning: 1,
  info: 2,
}

const KNOWN_CATEGORIES = new Set(['inventory', 'financial', 'sales'])

/** Clave i18n de severidad; `unknown` para valores no previstos. */
export const getSeverityKey = (severity: string | null | undefined): string => {
  const normalized = severity?.toLowerCase() ?? ''
  if (normalized === 'error') return 'critical'
  return normalized === 'critical' || normalized === 'warning' || normalized === 'info'
    ? normalized
    : 'unknown'
}

/** Clave i18n de categoría; las desconocidas caen a `other`. */
export const getCategoryKey = (category: string | null | undefined): string => {
  const normalized = category?.toLowerCase() ?? ''
  return KNOWN_CATEGORIES.has(normalized) ? normalized : 'other'
}

/** Categorías presentes en el payload, alfabéticas y sin duplicados. */
export const getAvailableCategories = (alerts: AlertLike[] | null | undefined): string[] => {
  if (!alerts) return []
  const categories = new Set<string>()
  for (const alert of alerts) {
    if (alert.category) categories.add(alert.category.toLowerCase())
  }
  return Array.from(categories).sort()
}

export interface AlertMetrics {
  total: number
  critical: number
  warning: number
  info: number
}

/** Conteos por severidad sobre el conjunto recibido. */
export const getAlertMetrics = (alerts: AlertLike[] | null | undefined): AlertMetrics => {
  const metrics: AlertMetrics = { total: 0, critical: 0, warning: 0, info: 0 }
  if (!alerts) return metrics

  for (const alert of alerts) {
    metrics.total += 1
    const key = getSeverityKey(alert.severity)
    if (key === 'critical') metrics.critical += 1
    else if (key === 'warning') metrics.warning += 1
    else if (key === 'info') metrics.info += 1
  }
  return metrics
}

/** Orden estable: críticas primero, luego advertencias, luego informativas. */
export const sortAlertsBySeverity = <T extends AlertLike>(alerts: T[] | null | undefined): T[] => {
  if (!alerts) return []
  return [...alerts].sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity?.toLowerCase() ?? ''] ?? 3) -
      (SEVERITY_RANK[b.severity?.toLowerCase() ?? ''] ?? 3),
  )
}

export interface AlertFilters {
  severity: 'all' | 'critical' | 'warning' | 'info'
  category: 'all' | 'inventory' | 'financial' | 'sales'
  search: string
}

export const EMPTY_ALERT_FILTERS: AlertFilters = {
  severity: 'all',
  category: 'all',
  search: '',
}

/** Filtro combinado severidad + categoría + texto (título/mensaje/id). */
export const filterAlerts = <T extends AlertLike>(
  alerts: T[] | null | undefined,
  filters: AlertFilters,
): T[] => {
  if (!alerts) return []
  const query = filters.search.trim().toLowerCase()

  return alerts.filter((alert) => {
    if (filters.severity !== 'all' && getSeverityKey(alert.severity) !== filters.severity) {
      return false
    }
    if (filters.category !== 'all' && getCategoryKey(alert.category) !== filters.category) {
      return false
    }
    if (!query) return true
    return (
      (alert.title?.toLowerCase().includes(query) ?? false) ||
      (alert.message?.toLowerCase().includes(query) ?? false) ||
      String(alert.id).toLowerCase().includes(query)
    )
  })
}
