/**
 * Alertas del dashboard de inventario (F5).
 *
 * El endpoint `/inventory-analytics/dashboard` genera alertas por reglas
 * (sin stock > 10 %, bajo stock > 20 %, stock muerto > 15 % y reposición
 * urgente). El `message` lo arma el BE en español y se renderiza como dato,
 * igual que en el dashboard F2; el título y la acción los pone la UI.
 *
 * Solo se enlazan destinos que existen: niveles de stock (F5) y riesgos (F5).
 * El tipo EXPIRING no tiene pantalla todavía.
 */
export type InventoryAlertTypeKey =
  | 'outOfStock'
  | 'lowStock'
  | 'overstock'
  | 'deadStock'
  | 'expiring'
  | 'other'

export type InventoryAlertSeverityKey = 'critical' | 'high' | 'medium' | 'low'

export const inventoryAlertTypeKey = (
  type: string | null | undefined,
): InventoryAlertTypeKey => {
  switch (type) {
    case 'OUT_OF_STOCK':
      return 'outOfStock'
    case 'LOW_STOCK':
      return 'lowStock'
    case 'OVERSTOCK':
      return 'overstock'
    case 'DEAD_STOCK':
      return 'deadStock'
    case 'EXPIRING':
      return 'expiring'
    default:
      return 'other'
  }
}

export const inventoryAlertSeverityKey = (
  severity: string | null | undefined,
): InventoryAlertSeverityKey => {
  switch ((severity ?? '').toUpperCase()) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    default:
      return 'low'
  }
}

/** Destino accionable de la alerta; `null` = no hay pantalla para ese tipo. */
export const inventoryAlertRoute = (type: string | null | undefined): string | null => {
  switch (inventoryAlertTypeKey(type)) {
    case 'outOfStock':
    case 'lowStock':
    case 'overstock':
      return '/inventory-analytics/stock-levels'
    case 'deadStock':
      return '/inventory-analytics/risk'
    default:
      return null
  }
}
