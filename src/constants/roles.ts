/**
 * IDs canónicos de roles — espejo de `business_management/constants/roles.go`.
 * Sincronizados con las migraciones RBAC (20260212123000 y siguientes).
 * §7.2 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES): única fuente de verdad para
 * gates por rol en el frontend (RoleGuard, etc.). No hardcodear IDs en UI.
 */

export const ROLES = {
  ADMIN: 'F2VLso',
  BUYER: 'BUYR01',
  CAJERO: 'CAJA01',
  CLIENT: 'CLNT01',
  DEPOSITO: 'DEPO01',
  INVENTORY: 'SUPL01',
  SUPPLIER: 'SUPLR01',
  VENDOR: 'VNDR01',
  ENCARGADO: 'ENCR01',
} as const

export type RoleId = (typeof ROLES)[keyof typeof ROLES]

/** Nombre legible por ID (para mensajes de error de RoleGuard, etc.). */
export const ROLE_NAMES: Record<string, string> = {
  [ROLES.ADMIN]: 'ADMIN',
  [ROLES.BUYER]: 'BUYER',
  [ROLES.CAJERO]: 'CAJERO',
  [ROLES.CLIENT]: 'CLIENT',
  [ROLES.DEPOSITO]: 'DEPOSITO',
  [ROLES.INVENTORY]: 'INVENTORY',
  [ROLES.SUPPLIER]: 'SUPPLIER',
  [ROLES.VENDOR]: 'VENDOR',
  [ROLES.ENCARGADO]: 'ENCARGADO',
}
