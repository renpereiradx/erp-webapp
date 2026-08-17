import React, { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

interface WithPermissionProps {
  children: React.ReactNode;
  /** Permiso único (retrocompat). */
  permission?: string;
  /** Semántica OR: renderiza si el usuario tiene al menos uno de estos permisos. */
  anyOf?: string[];
  fallback?: React.ReactNode;
}

/**
 * WithPermission es un wrapper ligero para renderizado condicional de elementos de la interfaz.
 * Utilizado típicamente para ocultar botones o acciones que requieren permisos de escritura (ej. `products:write`).
 * Soporta un permiso único (`permission`) o una lista OR (`anyOf`).
 * Sin AuthProvider (tests/SSR) no hay sesión: no renderiza (fail-closed).
 */
export const WithPermission: React.FC<WithPermissionProps> = ({
  children,
  permission,
  anyOf,
  fallback = null
}) => {
  const ctx = useContext(AuthContext);

  const allowed = ctx
    ? anyOf && anyOf.length > 0
      ? ctx.hasAnyPermission(...anyOf)
      : permission
        ? ctx.hasPermission(permission)
        : false
    : false;

  if (allowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default WithPermission;
