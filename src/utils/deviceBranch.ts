// ===========================================================================
// deviceBranch (D.3/D.4 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Emparejamiento nivel 1: esta terminal (navegador) queda vinculada a una
// sucursal vía localStorage. BranchContext fuerza esa sucursal para usuarios
// sin `branches:switch`; el nivel 2 (FASE E) lo reemplazará por devices en
// backend con header X-Device-ID.
// ===========================================================================

export const DEVICE_DEFAULT_BRANCH_KEY = 'device.defaultBranch'

export function readDeviceDefaultBranch(): number | null {
  const raw = localStorage.getItem(DEVICE_DEFAULT_BRANCH_KEY)
  if (raw === null) return null
  const parsed = parseInt(raw, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function pairDeviceWithBranch(branchId: number): void {
  localStorage.setItem(DEVICE_DEFAULT_BRANCH_KEY, String(branchId))
  window.dispatchEvent(new CustomEvent('device:branch_changed', { detail: { branchId } }))
}

export function unpairDevice(): void {
  localStorage.removeItem(DEVICE_DEFAULT_BRANCH_KEY)
  window.dispatchEvent(new CustomEvent('device:branch_changed', { detail: { branchId: null } }))
}
