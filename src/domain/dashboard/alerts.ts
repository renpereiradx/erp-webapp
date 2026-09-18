/**
 * Pure logic for the consolidated alerts view (ConsolidatedAlerts page).
 * Extracted from pages/ConsolidatedAlerts.jsx (PLAN_ALINEACION_BI_FRONTEND F1).
 * Category labels are the legacy hardcoded Spanish strings — they move to
 * i18n keys when the page is migrated (FASE 5, decisión D6 del plan).
 */

export interface AlertLike {
  id: string | number
  severity?: string | null
  category?: string | null
  title?: string | null
  message?: string | null
  details?: Record<string, unknown> | null
}

/** Unique lowercase categories present in the alerts, alphabetically sorted. */
export const getAvailableCategories = (
  alerts: AlertLike[] | null | undefined,
): string[] => {
  if (!alerts) return []
  const cats = new Set<string>()
  alerts.forEach((a) => {
    if (a.category) cats.add(a.category.toLowerCase())
  })
  return Array.from(cats).sort()
}

/** Material icon name for a category, matched by substring heuristics. */
export const getCategoryIcon = (category: string | null | undefined): string => {
  const cat = category?.toLowerCase() || ''
  if (cat.includes('inv') || cat.includes('stock')) return 'inventory_2'
  if (cat.includes('fin') || cat.includes('pay') || cat.includes('cash')) return 'payments'
  if (cat.includes('sal') || cat.includes('order')) return 'shopping_cart'
  if (cat.includes('sec') || cat.includes('auth')) return 'shield'
  if (cat.includes('infra') || cat.includes('sys')) return 'dns'
  if (cat.includes('client') || cat.includes('cust')) return 'groups'
  return 'notifications'
}

/** Human label for a category, capitalizing the raw value as fallback. */
export const getCategoryLabel = (category: string | null | undefined): string => {
  const cat = category?.toLowerCase() || ''
  if (cat.includes('inv') || cat.includes('stock')) return 'Inventario'
  if (cat.includes('fin')) return 'Finanzas'
  if (cat.includes('sal')) return 'Ventas'
  if (cat.includes('sec')) return 'Seguridad'
  if (cat.includes('infra')) return 'Infraestructura'
  if (cat.includes('client') || cat.includes('cust')) return 'Clientes'

  return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Sistema'
}

export interface AlertMetrics {
  total: number
  critical: number
  inventory: number
  sales: number
}

/** Summary counters for the KPI cards; zeroed shape for missing alerts. */
export const getAlertMetrics = (alerts: AlertLike[] | null | undefined): AlertMetrics => {
  if (!alerts) return { total: 0, critical: 0, inventory: 0, sales: 0 }
  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical' || a.severity === 'error').length,
    inventory: alerts.filter((a) => {
      const c = a.category?.toLowerCase() || ''
      return c.includes('inv') || c.includes('stock')
    }).length,
    sales: alerts.filter((a) => {
      const c = a.category?.toLowerCase() || ''
      return c.includes('sal') || c.includes('client') || c.includes('cust')
    }).length,
  }
}

export interface AlertFilters {
  severity: string
  category: string
  search: string
}

/** Combined severity + category + free-text (title/message/id) filter. */
export const filterAlerts = (
  alerts: AlertLike[] | null | undefined,
  filters: AlertFilters,
): AlertLike[] => {
  if (!alerts) return []
  let result = alerts

  if (filters.severity !== 'all') {
    result = result.filter(
      (a) => a.severity === filters.severity || (filters.severity === 'critical' && a.severity === 'error'),
    )
  }

  if (filters.category !== 'all') {
    result = result.filter((a) => a.category?.toLowerCase().includes(filters.category.toLowerCase()))
  }

  if (filters.search) {
    const query = filters.search.toLowerCase()
    result = result.filter(
      (a) =>
        a.title?.toLowerCase().includes(query) ||
        a.message?.toLowerCase().includes(query) ||
        String(a.id).includes(query),
    )
  }

  return result
}

const FINANCIAL_DETAIL_KEYS = ['total', 'amount', 'revenue', 'profit', 'cost', 'price', 'balance', 'ticket']

/** Detail keys that render as PYG amounts in the expanded alert. */
export const isFinancialDetailKey = (label: string): boolean => {
  const lower = label.toLowerCase()
  return FINANCIAL_DETAIL_KEYS.some((key) => lower.includes(key))
}
