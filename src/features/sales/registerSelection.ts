/**
 * Selección de caja registradora para el cobro (lógica pura, testeable).
 *
 * Regla de producto: la caja NO es obligatoria. Si el operador elige una caja,
 * debe estar abierta y pertenecer a la sucursal de la venta (el SQL de pago
 * rechaza cajas cerradas o de otra sucursal). Sin caja seleccionada, el pago
 * se procesa sin caja y el backend NO adivina nada.
 */

export interface RegisterOption {
  id: number
  branchId: number | null | undefined
}

export interface PartitionedRegisters<T extends RegisterOption = RegisterOption> {
  /** Cajas abiertas de la sucursal actual (seleccionables). */
  inBranch: T[]
  /** Cajas abiertas de otras sucursales (se muestran deshabilitadas). */
  otherBranches: T[]
  /** Hay alguna caja abierta en cualquier sucursal. */
  hasAny: boolean
}

/** Separa las cajas abiertas por sucursal. Sin branchId conocido, todas van a inBranch. */
export function partitionOpenRegisters<T extends RegisterOption>(
  registers: T[],
  branchId: number | null | undefined,
): PartitionedRegisters<T> {
  const inBranch: T[] = []
  const otherBranches: T[] = []
  for (const r of registers) {
    if (branchId == null || r.branchId == null || Number(r.branchId) === Number(branchId)) {
      inBranch.push(r)
    } else {
      otherBranches.push(r)
    }
  }
  return { inBranch, otherBranches, hasAny: inBranch.length + otherBranches.length > 0 }
}

/**
 * Resuelve la caja por defecto: la caja activa del operador solo se preselecciona
 * si está en la lista de cajas abiertas de la sucursal actual. En cualquier otro
 * caso (activa de otra sucursal, sin caja activa) el default es null = "Sin caja",
 * para que el backend nunca resuelva una caja de otra sucursal.
 */
export function resolveDefaultRegisterId(
  inBranchRegisters: RegisterOption[],
  activeRegisterId: number | null | undefined,
): number | null {
  if (activeRegisterId == null) return null
  const found = inBranchRegisters.some((r) => Number(r.id) === Number(activeRegisterId))
  return found ? Number(activeRegisterId) : null
}
