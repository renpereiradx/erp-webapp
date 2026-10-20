import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { ShieldCheck } from 'lucide-react'
import {
  inventoryAlertRoute,
  inventoryAlertSeverityKey,
  inventoryAlertTypeKey,
  type InventoryAlertSeverityKey,
  type InventoryAlertTypeKey,
} from '@/domain/inventory-analytics/alerts'
import type { InventoryAlert } from '@/types/bi'
import { InventoryBadge, type InventoryBadgeTone } from './InventoryBadge'

const TYPE_KEYS: Record<InventoryAlertTypeKey, string> = {
  outOfStock: 'inventoryAnalytics.alerts.type.outOfStock',
  lowStock: 'inventoryAnalytics.alerts.type.lowStock',
  overstock: 'inventoryAnalytics.alerts.type.overstock',
  deadStock: 'inventoryAnalytics.alerts.type.deadStock',
  expiring: 'inventoryAnalytics.alerts.type.expiring',
  other: 'inventoryAnalytics.alerts.type.other',
}

const TYPE_FALLBACKS: Record<InventoryAlertTypeKey, string> = {
  outOfStock: 'Sin stock',
  lowStock: 'Bajo stock',
  overstock: 'Sobre-stock',
  deadStock: 'Stock muerto',
  expiring: 'Por vencer',
  other: 'Inventario',
}

const SEVERITY_KEYS: Record<InventoryAlertSeverityKey, string> = {
  critical: 'inventoryAnalytics.alerts.severity.critical',
  high: 'inventoryAnalytics.alerts.severity.high',
  medium: 'inventoryAnalytics.alerts.severity.medium',
  low: 'inventoryAnalytics.alerts.severity.low',
}

const SEVERITY_FALLBACKS: Record<InventoryAlertSeverityKey, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const SEVERITY_TONES: Record<InventoryAlertSeverityKey, InventoryBadgeTone> = {
  critical: 'error',
  high: 'warning',
  medium: 'primary',
  low: 'neutral',
}

/**
 * Alertas generadas por las reglas del dashboard de inventario. El `message`
 * es dato del servidor (mismo criterio que F2); el título y la acción son de
 * la UI. Solo se enlazan destinos que existen (stock-levels/risk).
 */
export const InventoryAlertsPanel = ({ alerts }: { alerts: InventoryAlert[] }) => {
  const { t } = useI18n()

  if (alerts.length === 0) {
    return (
      <div className="py-lg" data-testid="inventory-alerts-empty">
        <TableEmptyState
          icon={ShieldCheck}
          title={t('inventoryAnalytics.alerts.empty', 'Sin alertas de inventario')}
          description={t(
            'inventoryAnalytics.alerts.emptyHint',
            'El reporte no detectó situaciones que superen sus umbrales.',
          )}
        />
      </div>
    )
  }

  return (
    <div className="space-y-sm" data-testid="inventory-alerts">
      {alerts.map((alert, index) => {
        const typeKey = inventoryAlertTypeKey(alert.type)
        const severityKey = inventoryAlertSeverityKey(alert.severity)
        const route = inventoryAlertRoute(alert.type)
        return (
          <article
            key={`${alert.type}-${index}`}
            className="rounded-md border border-border-subtle bg-surface p-md"
            data-testid={`inventory-alert-${index}`}
          >
            <div className="flex flex-wrap items-center gap-sm">
              <InventoryBadge tone={SEVERITY_TONES[severityKey]}>
                {t(SEVERITY_KEYS[severityKey], SEVERITY_FALLBACKS[severityKey])}
              </InventoryBadge>
              <span className="text-label-caps uppercase text-on-surface-deep">
                {t(TYPE_KEYS[typeKey], TYPE_FALLBACKS[typeKey])}
              </span>
              {route ? (
                <Link
                  to={route}
                  className="ml-auto text-body-sm-bold text-primary hover:underline"
                >
                  {t('inventoryAnalytics.alerts.manage', 'Gestionar')}
                </Link>
              ) : null}
            </div>
            <p className="mt-sm text-body-md text-foreground">{alert.message}</p>
          </article>
        )
      })}
    </div>
  )
}

export default InventoryAlertsPanel
