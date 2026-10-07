/**
 * Lógica pura de la versión del sistema (PLAN_VERSION_UI_FRONTEND_2026-10-07).
 *
 * La versión mostrada por la UI proviene de dos fuentes:
 *  - Build FE: `__APP_VERSION__` (package.json, inyectado por el `define` de Vite).
 *  - Runtime BE: `GET /version` (git describe inyectado por ldflags al compilar).
 *
 * El render pasa EXCLUSIVAMENTE por SystemVersionBadge; prohibido renderizar
 * literales de versión en cualquier otro componente (guard version-literal en
 * lint:design). Este módulo no conoce React ni hace side effects.
 */

/** Metadata de build que reporta `GET /version` (raíz del router, sin auth). */
export interface BackendBuildInfo {
  version: string
  commit: string
  build_date: string
}

/** Quita el prefijo `v` y espacios (" v1.2.0-3-gabc " → "1.2.0-3-gabc"). */
export function normalizeVersion(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.trim().replace(/^v/i, '')
}

/** Base SemVer (major.minor.patch): descarta sufijos de build (-3-gabc, -dirty). */
export function versionBase(raw: string | null | undefined): string {
  return normalizeVersion(raw).split('-')[0] ?? ''
}

export type VersionDivergence = 'match' | 'diverged' | 'unknown'

/**
 * Compara el bundle FE contra el binario BE (D4 del plan).
 * - 'match': misma base (el BE puede llevar sufijos de build adicionales).
 * - 'diverged': bases distintas → instalación parcialmente actualizada.
 * - 'unknown': sin datos del backend (endpoint inalcanzable / fetch previo).
 */
export function compareWithBackend(
  feRaw: string,
  backend: BackendBuildInfo | null | undefined,
): VersionDivergence {
  if (!backend || !backend.version) return 'unknown'
  const feBase = versionBase(feRaw)
  const beBase = versionBase(backend.version)
  if (!feBase || !beBase) return 'unknown'
  return feBase === beBase ? 'match' : 'diverged'
}

/** Texto del badge: "v1.2.0". Vacío si no hay versión (el badge no renderiza). */
export function displayVersion(raw: string | null | undefined): string {
  const base = versionBase(raw)
  return base ? `v${base}` : ''
}

/** Fecha de compilación, solo la parte fecha (RFC3339 → 2026-10-07); "" si no hay. */
export function displayBuildDate(buildDate: string | null | undefined): string {
  if (!buildDate) return ''
  const date = buildDate.trim().split('T')[0] ?? ''
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''
}
