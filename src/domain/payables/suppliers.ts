/**
 * Análisis de proveedor (F8).
 *
 * `GET /payables/supplier/{id}/analysis` devuelve un payload plano: saldo
 * pendiente y vencido, cantidad de cuentas, comportamiento de pago (derivado
 * por el BE del promedio compra→pago), peso sobre el total de CxP, importancia
 * (umbrales 5/15/30 % del BE) y `credit_terms`.
 *
 * `credit_terms` es el literal 30 del repositorio, no una condición negociada
 * con el proveedor: la UI lo muestra como plazo estándar del sistema.
 * `avg_days_to_pay` promedia TODOS los pagos; `0` puede ser pago el mismo día
 * o ausencia de pagos (el contrato no expone el conteo), así que no se
 * reinterpreta.
 */
import type { SupplierAnalysis } from '@/types/bi'
import { daysSince } from './format'

/** Vencido / pendiente del proveedor; null si no debe nada. */
export const supplierOverdueShare = (
  analysis: Pick<SupplierAnalysis, 'total_pending' | 'total_overdue'> | null | undefined,
): number | null => {
  const pending = Number(analysis?.total_pending ?? 0)
  if (!Number.isFinite(pending) || pending <= 0) return null
  return (Number(analysis?.total_overdue ?? 0) / pending) * 100
}

/** Antigüedad de la deuda más vieja (días desde la compra, criterio del BE). */
export const supplierOldestDebtAge = (
  analysis: Pick<SupplierAnalysis, 'oldest_debt'> | null | undefined,
  now: Date = new Date(),
): number | null => daysSince(analysis?.oldest_debt, now)
