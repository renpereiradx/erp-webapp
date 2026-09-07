/**
 * Acceso no-React a los permisos del usuario autenticado.
 *
 * AuthContext mantiene los permisos en memoria (fuente canónica: /me), pero
 * stores y servicios fuera del árbol de React (p. ej. useDashboardStore)
 * también necesitan gatear llamadas por permiso para no disparar requests
 * que el backend rechaza con 403. Se persisten en localStorage con el mismo
 * ciclo de vida que el resto del contexto (roleId, allowedBranches…): se
 * refrescan en cada login y en cada init vía /me.
 */
const PERMISSIONS_KEY = 'permissions';

export function persistPermissions(permissions?: string[] | null): void {
  if (Array.isArray(permissions)) {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  }
}

export function clearStoredPermissions(): void {
  localStorage.removeItem(PERMISSIONS_KEY);
}

export function readStoredPermissions(): string[] | null {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * hasStoredPermission devuelve true cuando no hay lista persistida
 * (sesiones iniciadas antes de esta clave o entornos sin permisos):
 * comportamiento previo — disparar el request y dejar que el backend
 * decida.
 */
export function hasStoredPermission(permission: string): boolean {
  const permissions = readStoredPermissions();
  if (!permissions) return true;
  return permissions.includes(permission);
}
