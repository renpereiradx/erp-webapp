/**
 * Shared pure helpers for the dashboard pages (Dashboard, DetailedKPIs).
 * Extracted from code duplicated inline in both pages
 * (PLAN_ALINEACION_BI_FRONTEND F1). No React, no i18n — the caller
 * translates the "now" label.
 */

type Timestamp = string | number | Date | null | undefined

/**
 * Relative-time label: '' for falsy timestamps, the translated "now" label
 * under a minute, then 'Xm' / 'Xh', falling back to the locale date string.
 */
export const getTimeAgo = (
  timestamp: Timestamp,
  nowLabel = 'ahora',
  now: Date = new Date(),
): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return nowLabel
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h`
  return date.toLocaleDateString()
}

export interface ActivityDetails {
  sale_id?: string | number | null
  purchase_id?: string | number | null
  [key: string]: unknown
}

export interface ActivityLike {
  type?: string | null
  details?: ActivityDetails | null
}

/** Route an activity card navigates to, by activity type. */
export const getActivityRoute = (activity: ActivityLike): string => {
  if (activity.type === 'sale') return `/cobros-ventas/${activity.details?.sale_id || ''}`
  if (activity.type === 'purchase') return `/pagos-compras/${activity.details?.purchase_id || ''}`
  if (activity.type === 'payment') {
    return activity.details?.sale_id
      ? `/cobros-ventas/${activity.details.sale_id}/pagos`
      : '/movimientos-caja'
  }
  return '/dashboard'
}
