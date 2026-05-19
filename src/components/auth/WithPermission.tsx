import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WithPermissionProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

/**
 * WithPermission es un wrapper ligero para renderizado condicional de elementos de la interfaz.
 * Utilizado típicamente para ocultar botones o acciones que requieren permisos de escritura (ej. `products:write`).
 */
export const WithPermission: React.FC<WithPermissionProps> = ({
  children,
  permission,
  fallback = null
}) => {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default WithPermission;
