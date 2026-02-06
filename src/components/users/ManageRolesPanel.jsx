import React, { useEffect, useState } from 'react';
import useUserStore from '@/store/useUserStore';
import { useI18n } from '@/lib/i18n';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { 
  X,
  Lock,
  Eye,
  CheckCircle2
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
  
  const activeRoles = roles.filter(role => role && userRoleIds.includes(role.id));
  const availableRoles = roles.filter(role => {
    if (!role) return false;
    const matchesSearch = !searchQuery || 
      (role.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (role.id?.toLowerCase().includes(searchQuery.toLowerCase()));
    return !userRoleIds.includes(role.id) && matchesSearch;
  });

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
        className="role-sidebar"
      >
        {/* Panel Header */}
        <SheetHeader className="role-sidebar__header">
          <div className="role-sidebar__title-group">
            <SheetTitle className="role-sidebar__title">
              {t('users.actions.manageRoles', 'Manage Roles')}
            </SheetTitle>
            <SheetDescription className="role-sidebar__subtitle">
              {t('users.form.editDescription', 'Edit system-wide permissions for user access.')}
            </SheetDescription>
          </div>
          <button 
            className="role-sidebar__close-btn"
            onClick={() => onOpenChange(false)}
          >
            <X size={20} />
          </button>
        </SheetHeader>

        <div className="role-sidebar__content">
          {/* Profile Summary Section */}
          <div className="role-sidebar__profile-summary">
            <div className="role-sidebar__avatar-container">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.first_name} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="role-sidebar__user-details">
              <h3 className="role-sidebar__user-name">{user.first_name} {user.last_name}</h3>
              <p className="role-sidebar__user-email">{user.email}</p>
              <div className="role-sidebar__last-active">
                {user.last_login_at 
                  ? `${t('users.table.lastActive', 'Last active')} ${new Date(user.last_login_at).getHours()}h ago` 
                  : t('common.activeNow', 'Active Now')}
              </div>
            </div>
          </div>

          <div className="role-sidebar__form-section">
            {/* Search Roles */}
            <div className="role-sidebar__search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input 
                type="text" 
                className="role-sidebar__search-input"
                placeholder={t('users.searchPlaceholder', 'Search available roles...')}
                value={searchQuery}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Active Roles Section */}
            <section>
              <div className="role-sidebar__section-header">
                <h4 className="role-sidebar__section-title">{t('users.profile.activeRoles', 'Active Roles')}</h4>
                <span className="role-sidebar__badge">
                  {userRoleIds.length} {t('common.required', 'Required')}
                </span>
              </div>
              
              <div className="role-sidebar__roles-list">
                {activeRoles.map((role) => {
                  const isLocked = userRoleIds.length <= 1;
                  return (
                    <div 
                      key={role.id}
                      className={`role-sidebar__role-card role-sidebar__role-card--checked ${isLocked ? 'role-sidebar__role-card--locked' : ''}`}
                      onClick={() => !isLocked && handleToggleRole(role.id, true)}
                    >
                      <div className="role-sidebar__checkbox-wrapper">
                        <div className="role-sidebar__locked-icon">
                          <Lock size={14} strokeWidth={3} />
                        </div>
                      </div>
                      <div className="role-sidebar__role-content">
                        <div className="role-sidebar__role-header">
                          <span className="role-sidebar__role-name">{role.name}</span>
                        </div>
                        <p className="role-sidebar__role-desc">
                          {role.id === 'admin' 
                            ? t('users.roles.adminFull', 'Full system access, billing management, and user provisioning.') 
                            : t('users.roles.standardFull', 'Access to operative features.')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Available Roles Section */}
            <section>
              <h4 className="role-sidebar__section-title">{t('users.profile.availableRoles', 'Available Roles')}</h4>
              <div className="role-sidebar__roles-list">
                {availableRoles.map((role) => (
                  <label 
                    key={role.id}
                    className="role-sidebar__role-card"
                  >
                    <div className="role-sidebar__checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        className="role-sidebar__checkbox"
                        checked={false}
                        onChange={() => handleToggleRole(role.id, false)}
                      />
                    </div>
                    <div className="role-sidebar__role-content">
                      <span className="role-sidebar__role-name">{role.name}</span>
                      <p className="role-sidebar__role-desc">
                        {role.id === 'securityManager' ? 'Access to audit logs, security policies, and incident reports.' :
                         role.id === 'billingContributor' ? 'View invoices, manage payment methods, and export usage reports.' :
                         role.id === 'contentEditor' ? 'Draft and publish content across shared workspaces.' :
                         t('users.roles.standardFull', 'Access to operative features.')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Permission Preview */}
            <div className="role-sidebar__permission-preview">
              <div className="role-sidebar__preview-header">
                <Eye size={18} />
                <span className="role-sidebar__preview-title">{t('users.profile.permissionPreview', 'Permission Preview')}</span>
              </div>
              <ul className="role-sidebar__preview-list">
                <li>{t('users.permissions.orgConfig', 'Manage organization-level configurations')}</li>
                <li>{t('users.permissions.inviteMembers', 'Invite and deactivate team members')}</li>
                <li>{t('users.permissions.securitySSO', 'Configure security and SSO providers')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="role-sidebar__footer">
          <button 
            className="role-sidebar__save-btn"
            onClick={() => onOpenChange(false)}
          >
            <CheckCircle2 size={18} />
            <span>{t('common.saveChanges', 'Save Changes')}</span>
          </button>
          <button 
            className="role-sidebar__cancel-btn"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel', 'Cancel')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}