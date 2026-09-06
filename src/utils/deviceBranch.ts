// ===========================================================================
// deviceBranch (D.3/D.4 + FASE E — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Emparejamiento de esta terminal (navegador) con una sucursal vía
// localStorage. BranchContext fuerza esa sucursal para usuarios sin
// `branches:switch` (nivel 1, D.4).
// FASE E: la terminal queda además REGISTRADA en backend (`device.id`) y
// cada request lleva el header X-Device-ID — el middleware la resuelve
// server-side; localStorage queda como fallback.
// ===========================================================================

export const DEVICE_DEFAULT_BRANCH_KEY = 'device.defaultBranch'
export const DEVICE_ID_KEY = 'device.id'

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

/** Id de la terminal registrada en backend (FASE E), o null si no la hay. */
export function readDeviceId(): number | null {
  const raw = localStorage.getItem(DEVICE_ID_KEY)
  if (raw === null) return null
  const parsed = parseInt(raw, 10)
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed
}

/**
 * Guarda el binding completo de la terminal registrada (FASE E): id de
 * device para el header X-Device-ID + sucursal para el fallback de nivel 1.
 */
export function setPairedDevice(deviceId: number, branchId: number): void {
  localStorage.setItem(DEVICE_ID_KEY, String(deviceId))
  pairDeviceWithBranch(branchId)
}

/** Borra el binding completo de la terminal (registrada + nivel 1). */
export function clearPairedDevice(): void {
  localStorage.removeItem(DEVICE_ID_KEY)
  unpairDevice()
}
