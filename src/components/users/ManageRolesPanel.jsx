import React, { useEffect, useState } from 'react';
import useUserStore from '@/store/useUserStore';
import { useI18n } from '@/lib/i18n';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ShieldCheck, 
  Search, 
  Lock, 
  Eye,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';

export function ManageRolesPanel({ user, open, onOpenChange }) {
  const { t } = useI18n();
  const { roles, fetchRoles, assignRole, removeRole } = useUserStore();
  const [searchQuery, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  if (!user) return null;

  const userRoleIds = user.roles?.map(r => r.id) || [];
  const activeRoles = roles.filter(role => userRoleIds.includes(role.id));
  const availableRoles = roles.filter(role => !userRoleIds.includes(role.id) && 
    (role.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     role.id.toLowerCase().includes(searchQuery.toLowerCase())));

  const handleToggleRole = async (roleId, isAssigned) => {
    if (isAssigned) {
      if (userRoleIds.length <= 1) return;
      await removeRole(user.id, roleId);
    } else {
      await assignRole(user.id, roleId);
    }
  };

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="sm:max-w-[540px] p-0 flex flex-col gap-0 border-l border-default shadow-2xl z-[1000]"
        aria-describedby={undefined}
      >
        <SheetHeader className="p-8 pb-6 border-b border-default bg-background">
          <div className="space-y-1">
            <SheetTitle className="text-2xl font-black tracking-tight text-primary">
              {t('users.actions.manageRoles', 'Manage Roles')}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm font-medium">
              {t('users.form.editDescription', 'Edit system-wide permissions for user access.')}
            </SheetDescription>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-10">
            {/* User Profile Summary */}
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-subtle/40 border border-default/40 backdrop-blur-sm">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.first_name} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-background bg-success" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-black truncate text-primary">{user.first_name} {user.last_name}</h4>
                <p className="text-sm text-secondary font-medium truncate mb-2">{user.email}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-success bg-success/10 px-2 py-0.5 rounded-full">
                    ● {user.last_login_at ? `${t('users.table.lastActive').toUpperCase()} ${new Date(user.last_login_at).getHours()}H AGO` : 'ACTIVE NOW'}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder={t('users.searchPlaceholder', 'Search available roles...')}
                className="pl-12 h-14 bg-background border-default/60 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl font-medium transition-all"
                value={searchQuery}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Active Roles Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                  {t('users.profile.activeRoles', 'Active Roles')}
                </h5>
                <Badge variant="subtle-primary" className="text-[10px] h-6 px-3 font-black rounded-full border-none">
                  {userRoleIds.length} REQUIRED
                </Badge>
              </div>
              <div className="grid gap-4">
                {activeRoles.map((role) => (
                  <div 
                    key={role.id}
                    className="relative flex items-start gap-5 p-5 rounded-2xl border-2 border-primary bg-primary/[0.03] shadow-sm shadow-primary/5 transition-all"
                  >
                    <div className="mt-0.5 h-11 w-11 shrink-0 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      {role.id === 'admin' ? <ShieldAlert size={22} /> : <Lock size={22} />}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-black text-primary">{role.name}</p>
                        <button 
                          onClick={() => handleToggleRole(role.id, true)}
                          className="h-6 w-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-secondary font-medium leading-relaxed">
                        {role.id === 'admin' 
                          ? t('users.roles.adminFull') 
                          : t('users.roles.standardFull')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Roles Section */}
            <div className="space-y-5">
              <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                {t('users.profile.availableRoles', 'Available Roles')}
              </h5>
              <div className="grid gap-4">
                {availableRoles.map((role) => (
                  <label 
                    key={role.id}
                    className="group flex items-start gap-5 p-5 rounded-2xl border-2 border-default bg-background hover:bg-subtle/30 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <Checkbox 
                      checked={false} 
                      onCheckedChange={() => handleToggleRole(role.id, false)}
                      className="mt-1 h-5 w-5 rounded-md"
                    />
                    <div className="flex-1 space-y-1.5">
                      <p className="text-base font-bold text-primary/90 group-hover:text-primary transition-colors">{role.name}</p>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {role.id === 'securityManager' ? 'Access to audit logs, security policies, and incident reports.' :
                         role.id === 'billingContributor' ? 'View invoices, manage payment methods, and export usage reports.' :
                         role.id === 'contentEditor' ? 'Draft and publish content across shared workspaces.' :
                         t('users.roles.standardFull')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Permission Preview */}
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-6 space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye size={18} />
                </div>
                <h6 className="text-[11px] font-black uppercase tracking-[0.15em]">
                  {t('users.profile.permissionPreview', 'Permission Preview')}
                </h6>
              </div>
              <ul className="grid gap-3">
                {[
                  'Manage organization-level configurations',
                  'Invite and deactivate team members',
                  'Configure security and SSO providers'
                ].map((perm, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[13px] text-secondary font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-8 pt-6 border-t border-default bg-subtle/20 sm:flex-row sm:gap-4">
          <Button variant="primary" className="flex-1 h-14 text-base font-black gap-3 shadow-xl shadow-primary/20 rounded-xl" onClick={() => onOpenChange(false)}>
            <ShieldCheck size={20} />
            {t('users.form.saveButton', 'Save Changes')}
          </Button>
          <Button variant="outline" className="flex-1 h-14 text-base font-black bg-background rounded-xl border-2" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}