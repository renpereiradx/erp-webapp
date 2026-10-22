/**
 * Vocabulario de Auditoría (F10) → claves i18n, fallbacks y tonos.
 *
 * `category`, `action` y `level` son VARCHAR libres en `audit_logs`: el write
 * path actual usa el vocabulario de `models/audit.go`, pero la migración
 * `20260916183127_backfill_legacy_audits_to_audit_logs` inserta filas con
 * `category = 'LEGACY'` y `action = INSERT`. Las categorías del enum vigente y
 * `LEGACY` se traducen; cualquier otro código se muestra CRUDO (nunca un
 * nombre inventado). `severity` y `type` de las alertas sí son cerrados
 * (`getSecurityAlerts` del repo).
 *
 * Este módulo es puro: no importa React ni i18n; expone claves y fallbacks en
 * español que el componente pasa a `t(key, fallback)`.
 */

export type AuditBadgeTone = 'info' | 'success' | 'warning' | 'error' | 'neutral'

const normalize = (code: string | null | undefined): string =>
  (code ?? '').trim().toUpperCase()

const rawOrDash = (code: string | null | undefined): string => {
  const trimmed = (code ?? '').trim()
  return trimmed === '' ? '—' : trimmed
}

// --- Categorías -------------------------------------------------------------

export type AuditCategoryKey =
  | 'auth'
  | 'sale'
  | 'purchase'
  | 'inventory'
  | 'product'
  | 'client'
  | 'supplier'
  | 'payment'
  | 'user'
  | 'config'
  | 'report'
  | 'commission'
  | 'loyalty'
  | 'cashRegister'
  | 'manufacturing'
  | 'system'
  | 'legacy'
  | 'unknown'

const CATEGORY_BY_CODE: Record<string, Exclude<AuditCategoryKey, 'unknown'>> = {
  AUTH: 'auth',
  SALE: 'sale',
  PURCHASE: 'purchase',
  INVENTORY: 'inventory',
  PRODUCT: 'product',
  CLIENT: 'client',
  SUPPLIER: 'supplier',
  PAYMENT: 'payment',
  USER: 'user',
  CONFIG: 'config',
  REPORT: 'report',
  COMMISSION: 'commission',
  LOYALTY: 'loyalty',
  CASH_REGISTER: 'cashRegister',
  MANUFACTURING: 'manufacturing',
  SYSTEM: 'system',
  LEGACY: 'legacy',
}

export const auditCategoryKey = (code: string | null | undefined): AuditCategoryKey =>
  CATEGORY_BY_CODE[normalize(code)] ?? 'unknown'

const CATEGORY_FALLBACK: Record<AuditCategoryKey, string> = {
  auth: 'Autenticación',
  sale: 'Ventas',
  purchase: 'Compras',
  inventory: 'Inventario',
  product: 'Productos',
  client: 'Clientes',
  supplier: 'Proveedores',
  payment: 'Pagos',
  user: 'Usuarios',
  config: 'Configuración',
  report: 'Reportes',
  commission: 'Comisiones',
  loyalty: 'Fidelización',
  cashRegister: 'Caja',
  manufacturing: 'Manufactura',
  system: 'Sistema',
  legacy: 'Histórico',
  unknown: '',
}

/** Clave i18n de la categoría; `unknown` no tiene traducción (se usa el código). */
export const auditCategoryLabelKey = (code: string | null | undefined): string =>
  `audit.category.${auditCategoryKey(code)}`

/** Etiqueta de respaldo: conocida en español o el código crudo. */
export const auditCategoryFallback = (code: string | null | undefined): string =>
  CATEGORY_FALLBACK[auditCategoryKey(code)] || rawOrDash(code)

/** Opciones del filtro: enum vigente + LEGACY (backfill documentado). */
export const AUDIT_FILTER_CATEGORIES: readonly string[] = [
  'AUTH',
  'SALE',
  'PURCHASE',
  'INVENTORY',
  'PRODUCT',
  'CLIENT',
  'SUPPLIER',
  'PAYMENT',
  'USER',
  'CONFIG',
  'REPORT',
  'COMMISSION',
  'LOYALTY',
  'CASH_REGISTER',
  'MANUFACTURING',
  'SYSTEM',
  'LEGACY',
]

// --- Acciones ---------------------------------------------------------------

export type AuditActionKey =
  | 'create'
  | 'insert'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'reverse'
  | 'adjust'
  | 'transfer'
  | 'generate'
  | 'process'
  | 'open'
  | 'close'
  | 'void'
  | 'failure'
  | 'unknown'

const ACTION_BY_CODE: Record<string, Exclude<AuditActionKey, 'unknown'>> = {
  CREATE: 'create',
  INSERT: 'insert',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  REJECT: 'reject',
  CANCEL: 'cancel',
  REVERSE: 'reverse',
  ADJUST: 'adjust',
  TRANSFER: 'transfer',
  GENERATE: 'generate',
  PROCESS: 'process',
  OPEN: 'open',
  CLOSE: 'close',
  VOID: 'void',
  FAILURE: 'failure',
}

export const auditActionKey = (code: string | null | undefined): AuditActionKey =>
  ACTION_BY_CODE[normalize(code)] ?? 'unknown'

const ACTION_FALLBACK: Record<AuditActionKey, string> = {
  create: 'Creación',
  insert: 'Alta (histórico)',
  read: 'Lectura',
  update: 'Actualización',
  delete: 'Eliminación',
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  export: 'Exportación',
  import: 'Importación',
  approve: 'Aprobación',
  reject: 'Rechazo',
  cancel: 'Cancelación',
  reverse: 'Reversión',
  adjust: 'Ajuste',
  transfer: 'Transferencia',
  generate: 'Generación',
  process: 'Proceso',
  open: 'Apertura',
  close: 'Cierre',
  void: 'Anulación',
  failure: 'Fallo',
  unknown: '',
}

export const auditActionLabelKey = (code: string | null | undefined): string =>
  `audit.action.${auditActionKey(code)}`

export const auditActionFallback = (code: string | null | undefined): string =>
  ACTION_FALLBACK[auditActionKey(code)] || rawOrDash(code)

/** Opciones del filtro de acción (vocabulario cerrado del modelo). */
export const AUDIT_FILTER_ACTIONS: readonly string[] = [
  'CREATE',
  // Acción histórica del backfill LEGACY (audit_logs.action = 'INSERT').
  'INSERT',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
  'APPROVE',
  'REJECT',
  'CANCEL',
  'REVERSE',
  'ADJUST',
  'TRANSFER',
  'GENERATE',
  'PROCESS',
  'OPEN',
  'CLOSE',
  'VOID',
  'FAILURE',
]

// --- Niveles ----------------------------------------------------------------

export type AuditLevelKey = 'info' | 'warning' | 'error' | 'critical' | 'unknown'

const LEVEL_BY_CODE: Record<string, Exclude<AuditLevelKey, 'unknown'>> = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
}

export const auditLevelKey = (code: string | null | undefined): AuditLevelKey =>
  LEVEL_BY_CODE[normalize(code)] ?? 'unknown'

const LEVEL_FALLBACK: Record<AuditLevelKey, string> = {
  info: 'Informativo',
  warning: 'Advertencia',
  error: 'Error',
  critical: 'Crítico',
  unknown: '',
}

export const auditLevelLabelKey = (code: string | null | undefined): string =>
  `audit.level.${auditLevelKey(code)}`

export const auditLevelFallback = (code: string | null | undefined): string =>
  LEVEL_FALLBACK[auditLevelKey(code)] || rawOrDash(code)

export const AUDIT_LEVEL_TONE: Record<AuditLevelKey, AuditBadgeTone> = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  critical: 'error',
  unknown: 'neutral',
}

/** Opciones del filtro de nivel (los cuatro del modelo). */
export const AUDIT_FILTER_LEVELS: readonly string[] = [
  'INFO',
  'WARNING',
  'ERROR',
  'CRITICAL',
]

// --- Resultado --------------------------------------------------------------

export type AuditResultKey = 'success' | 'failure'

export const auditResultKey = (success: boolean | null | undefined): AuditResultKey =>
  success === false ? 'failure' : 'success'

export const auditResultLabelKey = (success: boolean | null | undefined): string =>
  `audit.result.${auditResultKey(success)}`

export const AUDIT_RESULT_TONE: Record<AuditResultKey, AuditBadgeTone> = {
  success: 'success',
  failure: 'error',
}

// --- Severidad y tipo de alerta de seguridad --------------------------------

export type AuditSeverityKey = 'high' | 'medium' | 'low' | 'unknown'

const SEVERITY_BY_CODE: Record<string, Exclude<AuditSeverityKey, 'unknown'>> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

export const auditSeverityKey = (code: string | null | undefined): AuditSeverityKey =>
  SEVERITY_BY_CODE[normalize(code)] ?? 'unknown'

const SEVERITY_FALLBACK: Record<AuditSeverityKey, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  unknown: '',
}

export const auditSeverityLabelKey = (code: string | null | undefined): string =>
  `audit.severity.${auditSeverityKey(code)}`

export const auditSeverityFallback = (code: string | null | undefined): string =>
  SEVERITY_FALLBACK[auditSeverityKey(code)] || rawOrDash(code)

export const AUDIT_SEVERITY_TONE: Record<AuditSeverityKey, AuditBadgeTone> = {
  high: 'error',
  medium: 'warning',
  low: 'neutral',
  unknown: 'neutral',
}

export type AuditAlertTypeKey = 'failedLogins' | 'unusualActivity' | 'unknown'

const ALERT_TYPE_BY_CODE: Record<string, Exclude<AuditAlertTypeKey, 'unknown'>> = {
  FAILED_LOGINS: 'failedLogins',
  UNUSUAL_ACTIVITY: 'unusualActivity',
}

export const auditAlertTypeKey = (code: string | null | undefined): AuditAlertTypeKey =>
  ALERT_TYPE_BY_CODE[normalize(code)] ?? 'unknown'

const ALERT_TYPE_FALLBACK: Record<AuditAlertTypeKey, string> = {
  failedLogins: 'Intentos de login fallidos',
  unusualActivity: 'Actividad inusual',
  unknown: '',
}

export const auditAlertTypeLabelKey = (code: string | null | undefined): string =>
  `audit.alertType.${auditAlertTypeKey(code)}`

export const auditAlertTypeFallback = (code: string | null | undefined): string =>
  ALERT_TYPE_FALLBACK[auditAlertTypeKey(code)] || rawOrDash(code)
