import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  showError?: boolean;
}

/**
 * RoleGuard component to protect routes or sections based on user roles.
 * Prevents 403 Forbidden errors by checking permissions before rendering protected content.
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles = ['F2VLso'],
  redirectTo,
  showError = true
}) => {  const { user, isAuthenticated, loading, authLoading } = useAuth();
  const navigate = useNavigate();

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has any of the required roles
  // We check both direct role_id and roles array for compatibility
  const userRoles = user?.roles?.map(r => r.id) || [];
  const hasRole = allowedRoles.some(role => 
    user?.role_id === role || userRoles.includes(role)
  );

  if (!hasRole) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Map common role IDs to human-readable names for the error message
    const roleNames: Record<string, string> = {
      'F2VLso': 'Administrador',
      'VENDEDOR': 'Vendedor',
      'GESTOR': 'Gestor',
      // Add more common mappings if needed
    };

    const displayRoles = allowedRoles.map(role => roleNames[role] || role).join(', ');

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
            Lo sentimos, no tienes los permisos suficientes para acceder a esta sección.
            Esta funcionalidad está reservada para usuarios con rol: <span className="font-bold">{displayRoles}</span>.
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

export default RoleGuard;
