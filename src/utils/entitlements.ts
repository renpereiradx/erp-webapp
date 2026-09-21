/**
 * Espejo localStorage de los entitlements de licenciamiento
 * (PLAN_BI_PACK_PREMIUM F3, mismo patrón fail-open que userPermissions).
 *
 * Los entitlements describen lo que la INSTALACIÓN compró (packs), no lo que
 * el usuario puede hacer (permisos). Fuente canónica: `entitlements` en
 * /users/me y login (ADR-5); el espejo alimenta gates no-React y el primer
 * render antes de que /me responda.
 */

export const ENTITLEMENTS_KEY = 'entitlements'

/** Módulo licenciado del pack BI Premium (único pack vendido hoy). */
export const BI_PACK_MODULE = 'bi'

export interface Entitlements {
  edition: string
  modules: string[]
  bi_expires_at: string | null
}

/** Proyección de una instalación sin packs (ERP Core puro). */
export const CORE_ENTITLEMENTS: Entitlements = {
  edition: 'core',
  modules: [],
  bi_expires_at: null,
}

/** Proyección de una instalación con el pack BI completo (demo / fail-open). */
export const BI_ENTITLEMENTS: Entitlements = {
  edition: 'core+bi',
  modules: [BI_PACK_MODULE],
  bi_expires_at: null,
}

export function isValidEntitlements(value: unknown): value is Entitlements {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Entitlements>
  return typeof candidate.edition === 'string' && Array.isArray(candidate.modules)
}

export function persistEntitlements(entitlements?: Entitlements | null): void {
  if (isValidEntitlements(entitlements)) {
    localStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify(entitlements))
  }
}

export function clearStoredEntitlements(): void {
  localStorage.removeItem(ENTITLEMENTS_KEY)
}

export function readStoredEntitlements(): Entitlements | null {
  try {
    const raw = localStorage.getItem(ENTITLEMENTS_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidEntitlements(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Gate no-React (stores/servicios). Fail-open como hasStoredPermission:
 * sin espejo persistido (backend legacy, primer arranque) el módulo se
 * considera disponible — el enforcement real es server-side (403
 * MODULE_NOT_LICENSED) y el BiModuleRoute corrige el render en cuanto /me
 * llega con entitlements reales.
 */
export function hasStoredEntitlement(module: string): boolean {
  const entitlements = readStoredEntitlements()
  if (!entitlements) return true
  return entitlements.modules.includes(module)
}
