import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, Lock, Search, X } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import useUserStore from '@/store/useUserStore';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { User } from '@/types';
import { getUserInitials, ADMIN_ROLE_ID } from '@/domain/users/userDisplay';

import type { Role, TFn } from '../types';

interface ManageRolesPanelProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UsersStoreSlice {
  roles: Role[];
  fetchRoles: () => Promise<void>;
  assignRole: (userId: string, roleId: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  removeRole: (userId: string, roleId: string) => Promise<{ success: boolean; error?: string; code?: string }>;
}

function roleDescription(role: Role, t: TFn): string {
  if (role.id === ADMIN_ROLE_ID) {
    return t(
      'users.roles.adminFull',
      'Acceso total al sistema, gestión de facturación y aprovisionamiento de usuarios.',
    );
  }
  return t('users.roles.standardFull', 'Acceso operativo estándar.');
}

/** Right-side sheet to assign/remove roles of a user (roles apply immediately). */
export function ManageRolesPanel({ user, open, onOpenChange }: ManageRolesPanelProps) {
  const { t } = useI18n() as unknown as { t: TFn };
  const { roles, fetchRoles, assignRole, removeRole } = useUserStore() as UsersStoreSlice;
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) fetchRoles();
  }, [open, fetchRoles]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const userRoleIds = useMemo(() => user?.roles?.map((role) => role.id) ?? [], [user]);

  const activeRoles = useMemo(
    () => roles.filter((role) => userRoleIds.includes(role.id)),
    [roles, userRoleIds],
  );

  const availableRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roles.filter((role) => {
      if (userRoleIds.includes(role.id)) return false;
      return !query || role.name?.toLowerCase().includes(query) || role.id?.toLowerCase().includes(query);
    });
  }, [roles, userRoleIds, search]);

  if (!user) return null;

  const isLastRole = userRoleIds.length <= 1;

  const handleToggle = async (roleId: string, assigned: boolean) => {
    if (assigned) {
      if (isLastRole) {
        toast.warning(t('users.errors.cannotRemoveLastRole', 'El usuario debe tener al menos un rol.'));
        return;
      }
      const result = await removeRole(user.id, roleId);
      if (!result.success) {
        toast.error(result.error || t('users.errors.assignRoleFailed', 'No se pudo asignar el rol.'));
      }
    } else {
      const result = await assignRole(user.id, roleId);
      if (!result.success) {
        // Mono-role (migration 20260909213019): the backend rejects a second
        // role with USER_ALREADY_HAS_ROLE; map it to i18n, fall back to the
        // verbatim backend message for anything else.
        const message =
          result.code === 'USER_ALREADY_HAS_ROLE'
            ? t(
                'users.errors.singleRoleOnly',
                'El usuario ya tiene un rol asignado; el sistema opera con un solo rol por usuario. Remueva el rol actual antes de asignar uno nuevo.',
              )
            : result.error || t('users.errors.assignRoleFailed', 'No se pudo asignar el rol.');
        toast.error(message);
      }
    }
  };

  const sectionTitle = 'text-label-caps uppercase text-on-surface-deep';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-surface p-0 flex flex-col">
        <SheetHeader className="p-lg pb-md border-b border-divider space-y-xs">
          <div className="flex items-start justify-between gap-md">
            <div className="space-y-xs">
              <SheetTitle className="text-title-md text-foreground">
                {t('users.actions.manageRoles', 'Gestionar Roles')}
              </SheetTitle>
              <SheetDescription className="text-body-md text-on-surface-deep">
                {t('users.roles.manageDescription', 'Asigna o remueve los roles de este usuario.')}
              </SheetDescription>
            </div>
            <Button variant="ghost" size="icon" aria-label={t('common.close', 'Cerrar')} onClick={() => onOpenChange(false)}>
              <X className="size-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-lg space-y-lg">
          {/* Profile summary */}
          <div className="flex items-center gap-md p-md bg-surface-muted rounded-md">
            <Avatar className="size-12">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="bg-primary/10 text-primary text-body-md-bold">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-body-md-bold text-foreground truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-body-sm text-on-surface-deep truncate">{user.email}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
            <label htmlFor="roles-search" className="sr-only">
              {t('users.roles.searchPlaceholder', 'Buscar roles…')}
            </label>
            <Input
              id="roles-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('users.roles.searchPlaceholder', 'Buscar roles…')}
              className="pl-10"
            />
          </div>

          {/* Active roles */}
          <section className="space-y-sm">
            <div className="flex items-center justify-between">
              <h4 className={sectionTitle}>{t('users.profile.activeRoles', 'Roles Activos')}</h4>
              <Badge size="sm" variant="secondary">
                {userRoleIds.length}
              </Badge>
            </div>
            <div className="space-y-sm">
              {activeRoles.map((role) => (
                <div
                  key={role.id}
                  className={`flex items-center gap-md p-md rounded-md border border-border-subtle bg-surface-muted transition-colors duration-150 ${
                    isLastRole ? 'opacity-70' : ''
                  }`}
                >
                  <div className="shrink-0 size-8 rounded-full bg-surface flex items-center justify-center text-success shadow-whisper">
                    {isLastRole ? <Lock className="size-3.5" /> : <Check className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md-bold text-foreground">{role.name}</p>
                    <p className="text-body-sm text-on-surface-deep">{roleDescription(role, t)}</p>
                  </div>
                  <Switch
                    checked
                    disabled={isLastRole}
                    aria-label={`${t('users.actions.remove', 'Remover')} ${role.name}`}
                    onCheckedChange={() => void handleToggle(role.id, true)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Available roles */}
          <section className="space-y-sm">
            <h4 className={sectionTitle}>{t('users.profile.availableRoles', 'Roles Disponibles')}</h4>
            {availableRoles.length === 0 ? (
              <p className="text-body-md text-on-surface-deep p-md text-center">
                {t('users.roles.allAssigned', 'Todos los roles ya están asignados.')}
              </p>
            ) : (
              <div className="space-y-sm">
                {availableRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center gap-md p-md rounded-md border border-border-subtle bg-surface transition-colors duration-150 hover:border-primary/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md-bold text-foreground">{role.name}</p>
                      <p className="text-body-sm text-on-surface-deep">{roleDescription(role, t)}</p>
                    </div>
                    <Switch
                      checked={false}
                      aria-label={`${t('users.actions.assign', 'Asignar')} ${role.name}`}
                      onCheckedChange={() => void handleToggle(role.id, false)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Permission preview (static summary) */}
          <div className="p-md rounded-md border border-border-subtle bg-surface-muted">
            <p className={`${sectionTitle} flex items-center gap-sm mb-sm`}>
              <Eye className="size-4 text-primary" />
              {t('users.profile.permissionPreview', 'Vista Previa de Permisos')}
            </p>
            <ul className="space-y-xs text-body-sm text-on-surface-deep list-disc pl-md">
              <li>{t('users.roles.permission.orgConfig', 'Gestiona configuraciones a nivel de organización')}</li>
              <li>{t('users.roles.permission.inviteMembers', 'Invita y desactiva miembros del equipo')}</li>
              <li>{t('users.roles.permission.securitySSO', 'Configura seguridad y proveedores SSO')}</li>
            </ul>
          </div>
        </div>

        <div className="p-md border-t border-divider flex justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.close', 'Cerrar')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
