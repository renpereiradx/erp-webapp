import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import { getCategoryKey } from '@/domain/dashboard/alerts'
import { getTimeAgo } from '@/domain/dashboard/shared'
import type { DashboardAlert } from '@/types/bi'
import { AlertSeverityBadge } from './AlertSeverityBadge'

const CATEGORY_LABELS: Record<string, string> = {
  inventory: 'Inventario',
  financial: 'Finanzas',
  sales: 'Ventas',
  other: 'Otra',
}

const MAX_PRODUCTS = 5

/**
 * Rutas de alerta que YA existen en el router: es el espejo del catálogo
 * canónico del BE (`analytics.AlertActionURLs`) y debe cambiar en el mismo
 * diff. F5 re-activó inventario, F6 el margen negativo, F7 las vencidas y
 * F10/BI-D03 presupuestos (ruta Core sin guard en el router; su página
 * degrada con toast si el usuario no tiene `budgets:read`). Un botón
 * "Gestionar" que cae en 404 es la affordance muerta de la auditoría 2026-09.
 */
const ACTIONABLE_ALERT_ROUTES = new Set([
  '/inventory-analytics/stock-levels',
  '/profitability/products',
  '/receivables/overdue',
  '/comercial/presupuestos',
])

/**
 * Tarjeta de alerta. Título y mensaje son datos del servidor (no se traducen).
 * La acción "Gestionar" solo se renderiza si su destino existe.
 */
export const AlertCard = ({ alert }: { alert: DashboardAlert }) => {
  const { t } = useI18n()
  const categoryKey = getCategoryKey(alert.category)
  const products = alert.details?.products ?? []
  const visibleProducts = products.slice(0, MAX_PRODUCTS)
  const hiddenProducts = products.length - visibleProducts.length
  const actionRoute =
    alert.action_url && ACTIONABLE_ALERT_ROUTES.has(alert.action_url) ? alert.action_url : null

  return (
    <article
      className="rounded-md border border-border-subtle bg-surface p-md"
      data-testid={`dashboard-alert-${alert.id}`}
    >
      <div className="flex flex-wrap items-center gap-sm">
        <AlertSeverityBadge severity={alert.severity} />
        <span className="text-label-caps uppercase text-on-surface-deep">
          {t(`dashboard.alerts.category.${categoryKey}`, CATEGORY_LABELS[categoryKey])}
        </span>
        {alert.created_at ? (
          <span className="ml-auto text-body-sm text-on-surface-deep">
            {getTimeAgo(alert.created_at, t('dashboard.activity.now', 'ahora'))}
          </span>
        ) : null}
      </div>

      <h3 className="mt-sm text-body-md-bold text-foreground">{alert.title}</h3>
      <p className="text-body-md text-on-surface-deep">{alert.message}</p>

      {alert.details?.count != null || alert.details?.total != null || products.length > 0 ? (
        <div className="mt-sm space-y-xs text-body-sm text-on-surface-deep">
          {alert.details?.count != null ? (
            <p className="font-data-mono text-data-mono">
              {t('dashboard.alerts.details.count', 'Afectados: {count}', {
                count: formatNumber(alert.details.count, 0),
              })}
            </p>
          ) : null}
          {alert.details?.total != null ? (
            <p className="font-data-mono text-data-mono">
              {t('dashboard.alerts.details.total', 'Saldo pendiente: {total}', {
                total: formatPYG(alert.details.total),
              })}
            </p>
          ) : null}
          {visibleProducts.length > 0 ? (
            <div>
              <p className="text-label-caps uppercase">
                {t('dashboard.alerts.details.products', 'Productos afectados')}
              </p>
              <ul className="mt-xs list-inside list-disc">
                {visibleProducts.map((product) => (
                  <li key={product.id}>{product.name}</li>
                ))}
              </ul>
              {hiddenProducts > 0 ? (
                <p className="mt-xs">
                  {t('dashboard.alerts.details.moreProducts', 'y {count} más', {
                    count: formatNumber(hiddenProducts, 0),
                  })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {actionRoute ? (
        <div className="mt-sm">
          <Link
            to={actionRoute}
            className="text-body-sm-bold text-primary hover:underline"
          >
            {t('dashboard.alerts.manage', 'Gestionar')}
          </Link>
        </div>
      ) : null}
    </article>
  )
}
