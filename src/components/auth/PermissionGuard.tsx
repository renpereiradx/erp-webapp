import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  redirectTo?: string;
  showError?: boolean;
}

/**
 * PermissionGuard protege rutas o secciones basándose en los permisos (recurso:acción) del usuario.
 * Evita errores 403 Forbidden interceptándolos en el Frontend antes de montar componentes complejos.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  redirectTo,
  showError = true
}) => {
  const { isAuthenticated, loading, authLoading, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowed = hasPermission(permission);

  if (!allowed) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="size-20 rounded-full bg-error/10 text-error flex items-center justify-center mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2">
            Acceso Restringido
          </h2>
          <p className="text-text-secondary max-w-md mb-8">
            Lo sentimos, no cuentas con el permiso requerido (<span className="font-mono font-bold">{permission}</span>) para acceder a esta sección.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Regresar
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }
  return <>{children}</>;
};

export default PermissionGuard;
