import React, { useEffect } from 'react';
import useUserStore from '@/store/useUserStore';
import { useI18n } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

export function ManageRolesModal({ user, open, onOpenChange }) {
  const { t } = useI18n();
  const { roles, fetchRoles, assignRole, removeRole } = useUserStore();

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  if (!user) return null;

  const userRoleIds = user.roles?.map(r => r.id) || [];

  const handleToggleRole = async (roleId, isAssigned) => {
    if (isAssigned) {
      if (userRoleIds.length <= 1) {
        alert(t('users.errors.cannotRemoveLastRole', 'El usuario debe tener al menos un rol.'));
        return;
      }
      await removeRole(user.id, roleId);
    } else {
      await assignRole(user.id, roleId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-64">
        <DialogHeader className="bg-subtle p-6 border-b border-default">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="text-primary" />
            {t('users.actions.manageRoles', 'Gestionar Roles')}
          </DialogTitle>
          <p className="text-sm text-secondary mt-1">
            {t('users.manageRolesSubtitle', 'Asigne o remueva privilegios para')} <span className="font-bold text-primary">{user.first_name} {user.last_name}</span>
          </p>
        </DialogHeader>

        <div className="p-6">
          <div className="space-y-4">
            {roles.map((role) => {
              const isAssigned = userRoleIds.includes(role.id);
              return (
                <div 
                  key={role.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isAssigned 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-default bg-primary/0 hover:bg-subtle'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isAssigned ? 'bg-primary text-white' : 'bg-subtle text-secondary'
                    }`}>
                      {role.id === 'admin' ? <ShieldAlert size={20} /> : <Shield size={20} />}
                    </div>
                    <div>
                      <p className={`font-bold ${isAssigned ? 'text-primary' : 'text-primary'}`}>
                        {role.name}
                      </p>
                      <p className="text-xs text-secondary">
                        {role.id === 'admin' 
                          ? t('users.roles.adminFull', 'Acceso total al sistema') 
                          : t('users.roles.standardFull', 'Acceso operativo estándar')}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant={isAssigned ? "subtle-error" : "subtle-primary"}
                    size="sm"
                    className="gap-1 font-bold"
                    onClick={() => handleToggleRole(role.id, isAssigned)}
                  >
                    {isAssigned ? (
                      <>
                        <X size={16} /> {t('users.actions.remove', 'Remover')}
                      </>
                    ) : (
                      <>
                        <Check size={16} /> {t('users.actions.assign', 'Asignar')}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="bg-subtle p-4 border-t border-default">
          <Button variant="primary" className="w-full" onClick={() => onOpenChange(false)}>
            {t('common.done', 'Listo')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
