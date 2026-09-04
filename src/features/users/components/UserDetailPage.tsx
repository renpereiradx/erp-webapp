import { useState } from 'react';
import {
  Ban,
  Calendar,
  Check,
  History,
  Info,
  KeyRound,
  Monitor,
  Pencil,
  ShieldCheck,
  Trash2,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import { formatDateOrFallback, getRoleBadgeTone } from '@/domain/users/userDisplay';

import { useUserDetail } from '../hooks/useUserDetail';
import { ManageRolesPanel } from './ManageRolesPanel';
import { UserFormModal } from './UserFormModal';

const PageHeaderX = PageHeader as unknown as React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: string | Array<{ href?: string; label: string }>;
}>;

/** /configuracion/usuarios/:id — user detail workspace. */
export function UserDetailPage() {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string };
  const {
    user,
    loading,
    error,
    isToggling,
    handleToggleStatus,
    requestDeleteUser,
    confirmRequest,
    isConfirming,
    handleConfirm,
    closeConfirm,
    backToList,
    refresh,
  } = useUserDetail();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center py-xl">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if ((!user && !loading) || error) {
    return (
      <div className="py-xl text-center space-y-md">
        <h2 className="text-title-md text-foreground">{t('users.notFound', 'Usuario no encontrado')}</h2>
        <Button variant="link" onClick={backToList}>
          {t('users.backToList', 'Volver a la lista')}
        </Button>
      </div>
    );
  }

  if (!user) return null;

  const isActive = user.status === 'active';

  const handleResetPassword = () => {
    toast.info(t('users.resetPasswordSoon', 'El restablecimiento de contraseña estará disponible pronto.'));
  };

  return (
    <div className="space-y-xl animate-in fade-in duration-300">
      <PageHeaderX
        breadcrumb={[
          { href: '/configuracion/usuarios', label: t('users.title', 'Usuarios') },
          { label: `${user.first_name} ${user.last_name}` },
        ]}
        title={
          <span className="inline-flex items-center gap-sm">
            {`${user.first_name} ${user.last_name}`}
            <Badge
              size="sm"
              variant={isActive ? 'success' : 'secondary'}
            >
              {isActive ? t('users.status.active', 'Activo') : t('users.status.inactive', 'Inactivo')}
            </Badge>
          </span>
        }
        subtitle={`@${user.username} · ${user.email}`}
        actions={
          <>
            <Button variant="secondary" onClick={handleResetPassword}>
              <KeyRound className="size-4 mr-sm" />
              {t('users.resetPassword', 'Restablecer contraseña')}
            </Button>
            <Button variant="primary" onClick={() => setIsEditOpen(true)}>
              <Pencil className="size-4 mr-sm" />
              {t('users.actions.edit', 'Editar')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left column: summary + quick actions */}
        <div className="space-y-lg">
          <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
            <h3 className="text-label-caps uppercase text-on-surface-deep flex items-center gap-sm mb-md">
              <Info className="size-4 text-primary" />
              {t('users.profile.summary', 'Resumen de Usuario')}
            </h3>
            <div className="p-0 space-y-md">
              <div className="space-y-xs">
                <p className="text-label-caps uppercase text-on-surface-deep">{t('users.systemId', 'ID del Sistema')}</p>
                <p className="text-data-mono font-data-mono text-body-sm text-foreground bg-surface-muted rounded-sm p-sm break-all">
                  {user.id}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-md pt-sm">
                <div className="space-y-xs">
                  <p className="text-label-caps uppercase text-on-surface-deep">{t('users.lastAccess', 'Último Acceso')}</p>
                  <p className="text-data-mono font-data-mono text-body-sm text-foreground">
                    {formatDateOrFallback(user.last_login_at, t('users.lastActiveNever', 'Nunca'))}
                  </p>
                </div>
                <div className="space-y-xs">
                  <p className="text-label-caps uppercase text-on-surface-deep">{t('users.memberSince', 'Miembro desde')}</p>
                  <p className="text-data-mono font-data-mono text-body-sm text-foreground">
                    {formatDateOrFallback(user.created_at, '—')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
            <h3 className="text-label-caps uppercase text-on-surface-deep mb-md">
              {t('users.profile.quickActions', 'Gestión Rápida')}
            </h3>
            <div className="p-0 space-y-sm">
              <Button
                variant="ghost"
                className="w-full justify-start"
                disabled={isToggling}
                onClick={() => void handleToggleStatus(user)}
              >
                {isActive ? (
                  <Ban className="size-4 mr-sm text-error" />
                ) : (
                  <Unlock className="size-4 mr-sm text-success" />
                )}
                {isActive ? t('users.deactivate', 'Desactivar') : t('users.activate', 'Activar')}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-error hover:bg-error/5"
                onClick={() => requestDeleteUser(user)}
              >
                <Trash2 className="size-4 mr-sm" />
                {t('users.actions.delete', 'Eliminar')}
              </Button>
            </div>
          </div>
        </div>

        {/* Right column: roles + security */}
        <div className="lg:col-span-2 space-y-lg">
          <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-label-caps uppercase text-on-surface-deep flex items-center gap-sm">
                <ShieldCheck className="size-4 text-primary" />
                {t('users.rolesPermissions', 'Roles y Permisos')}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsRolesOpen(true)}>
                {t('users.actions.manageRoles', 'Gestionar Roles')}
              </Button>
            </div>
            <div className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {(user.roles ?? []).map((role) => (
                  <div
                    key={role.id}
                    className="p-md rounded-md border border-border-subtle bg-surface-muted space-y-sm transition-colors duration-150 hover:border-primary/20"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={getRoleBadgeTone(role) === 'primary' ? 'default' : 'secondary'}>
                        {role.name}
                      </Badge>
                      <Check className="size-4 text-success" aria-label={t('users.status.active', 'Activo')} />
                    </div>
                    <p className="text-body-sm text-on-surface-deep">
                      {role.id === 'F2VLso'
                        ? t('users.roles.adminFull', 'Acceso total al sistema.')
                        : t('users.roles.standardFull', 'Acceso operativo estándar.')}
                    </p>
                  </div>
                ))}
                {(!user.roles || user.roles.length === 0) && (
                  <p className="text-body-md text-on-surface-deep p-md text-center col-span-2">
                    {t('users.noRoles', 'No hay roles asignados a este usuario.')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
            <h3 className="text-label-caps uppercase text-on-surface-deep flex items-center gap-sm mb-md">
              <History className="size-4 text-primary" />
              {t('users.securityActivity', 'Actividad de Seguridad')}
            </h3>
            <div className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex items-center gap-md p-md rounded-md bg-primary/5 border border-primary/10">
                  <div className="size-12 rounded-md bg-surface shadow-whisper flex items-center justify-center text-primary shrink-0">
                    <Monitor className="size-5" />
                  </div>
                  <div>
                    <p className="text-label-caps uppercase text-on-surface-deep">
                      {t('users.profile.activeSessions', 'Sesiones Activas')}
                    </p>
                    <p className="text-data-mono font-data-mono text-title-md text-primary">
                      {user.sessions_count ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-md p-md rounded-md bg-warning/5 border border-warning/10">
                  <div className="size-12 rounded-md bg-surface shadow-whisper flex items-center justify-center text-warning shrink-0">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <p className="text-label-caps uppercase text-on-surface-deep">
                      {t('users.profile.failedAttempts', 'Intentos Fallidos')}
                    </p>
                    <p className="text-data-mono font-data-mono text-title-md text-warning">
                      {user.failed_login_attempts ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UserFormModal
        user={user}
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) refresh();
        }}
      />
      <ManageRolesPanel user={user} open={isRolesOpen} onOpenChange={setIsRolesOpen} />
      <ConfirmDialog
        open={Boolean(confirmRequest)}
        title={confirmRequest?.title ?? ''}
        description={confirmRequest?.description}
        confirmLabel={confirmRequest?.confirmLabel}
        loading={isConfirming}
        onConfirm={() => void handleConfirm()}
        onOpenChange={(open) => (open ? undefined : closeConfirm())}
      />
    </div>
  );
}
