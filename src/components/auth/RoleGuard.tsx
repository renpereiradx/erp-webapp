import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ROLES, ROLE_NAMES } from '@/constants/roles';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  showError?: boolean;
}

/**
 * RoleGuard component to protect routes or sections based on user roles.
 * Prevents 403 Forbidden errors by checking permissions before rendering protected content.
 * §7.2 (PLAN_VENDOR_ROLE): role IDs come from constants/roles.ts (mirror of
 * backend constants/roles.go) — never hardcode role IDs or name maps here.
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles = [ROLES.ADMIN],
  redirectTo,
  showError = true
}) => {
  const { user, isAuthenticated, loading, authLoading } = useAuth();
  const { t } = useI18n();
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

    const displayRoles = allowedRoles.map(role => ROLE_NAMES[role] || role).join(', ');

    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="size-20 rounded-full bg-error/10 text-error flex items-center justify-center mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2">
            {t('roleGuard.title', 'Acceso Restringido')}
          </h2>
          <p className="text-text-secondary max-w-md mb-8">
            {t('roleGuard.message',
              'Lo sentimos, no tenés los permisos suficientes para acceder a esta sección. Esta funcionalidad está reservada para usuarios con rol:')}{' '}
            <span className="font-bold">{displayRoles}</span>.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              {t('roleGuard.goBack', 'Regresar')}
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              {t('roleGuard.goDashboard', 'Ir al Dashboard')}
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
