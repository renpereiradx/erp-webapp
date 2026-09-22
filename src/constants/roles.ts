/**
 * IDs canónicos de roles — espejo de `business_management/constants/roles.go`.
 * Sincronizados con las migraciones RBAC (20260212123000 y siguientes).
 * §7.2 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES): única fuente de verdad para
 * gates por rol en el frontend (RoleGuard, etc.). No hardcodear IDs en UI.
 *
 * 20260921220741 (decisión owner 2026-09-21): nombres de rol en español;
 * SUPL01 pasó a ser PROVEEDOR, SUPLR01 descartado, INVENTARIO es INVR01.
 */

export const ROLES = {
  ADMIN: 'F2VLso',
  BUYER: 'BUYR01',
  CAJERO: 'CAJA01',
  CLIENT: 'CLNT01',
  DEPOSITO: 'DEPO01',
  INVENTORY: 'INVR01',
  PROVEEDOR: 'SUPL01',
  VENDOR: 'VNDR01',
  ENCARGADO: 'ENCR01',
} as const

export type RoleId = (typeof ROLES)[keyof typeof ROLES]

/** Nombre legible por ID (para mensajes de error de RoleGuard, etc.). */
export const ROLE_NAMES: Record<string, string> = {
  [ROLES.ADMIN]: 'ADMINISTRADOR',
  [ROLES.BUYER]: 'COMPRADOR',
  [ROLES.CAJERO]: 'CAJERO',
  [ROLES.CLIENT]: 'CLIENTE',
  [ROLES.DEPOSITO]: 'DEPOSITO',
  [ROLES.INVENTORY]: 'INVENTARIO',
  [ROLES.PROVEEDOR]: 'PROVEEDOR',
  [ROLES.VENDOR]: 'VENDEDOR',
  [ROLES.ENCARGADO]: 'ENCARGADO',
}
