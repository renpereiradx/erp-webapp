import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function RoleAssignmentSidebar({ open, onClose, user, onSave }) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  // Mock initial roles state
  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Organization Admin', description: 'Full system access, billing management, and user provisioning.', locked: true, selected: true },
    { id: 'security', name: 'Security Manager', description: 'Access to audit logs, security policies, and incident reports.', selected: false },
    { id: 'billing', name: 'Billing Contributor', description: 'View invoices, manage payment methods, and export usage reports.', selected: false },
    { id: 'content', name: 'Content Editor', description: 'Draft and publish content across shared workspaces.', selected: false },
  ]);

  if (!open) return null;

  const toggleRole = (roleId) => {
    setRoles(roles.map(role => 
      role.id === roleId && !role.locked 
        ? { ...role, selected: !role.selected } 
        : role
    ));
  };

  const activeRolesCount = roles.filter(r => r.selected).length;

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="role-sidebar__backdrop" onClick={onClose}></div>
      <aside className="role-sidebar">
        {/* Header */}
        <div className="role-sidebar__header">
          <div className="role-sidebar__title-group">
            <h2 className="role-sidebar__title">{t('users.roles.manageTitle', 'Manage Roles')}</h2>
            <p className="role-sidebar__subtitle">{t('users.roles.manageSubtitle', 'Edit system-wide permissions for user access.')}</p>
          </div>
          <button className="role-sidebar__close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="role-sidebar__content">
          {/* Profile Summary */}
          {user && (
            <div className="role-sidebar__profile-summary">
              <div className="role-sidebar__avatar-container">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.initials}</span>
                )}
              </div>
              <div className="role-sidebar__user-details">
                <h3 className="role-sidebar__user-name">{user.name}</h3>
                <p className="role-sidebar__user-email">{user.email}</p>
                <div className="role-sidebar__last-active">
                  {t('users.status.lastActive', { time: user.lastActive || '2h ago' })}
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="role-sidebar__form-section">
            {/* Search */}
            <div className="role-sidebar__search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input 
                className="role-sidebar__search-input"
                placeholder={t('users.roles.searchPlaceholder', 'Search available roles...')}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Selected Roles */}
            <section>
              <div className="role-sidebar__section-header">
                <h4 className="role-sidebar__section-title">{t('users.roles.activeRoles', 'Active Roles')}</h4>
                <span className="role-sidebar__badge">{activeRolesCount} Required</span>
              </div>
              
              <div className="role-sidebar__roles-list">
                {/* Available Roles List */}
                {filteredRoles.map((role) => (
                  <label 
                    key={role.id}
                    className={`role-sidebar__role-card ${role.selected ? 'role-sidebar__role-card--checked' : ''} ${role.locked ? 'role-sidebar__role-card--locked' : ''}`}
                  >
                    <div className="role-sidebar__checkbox-wrapper">
                      {role.locked ? (
                        <div className="role-sidebar__locked-icon">
                          <span className="material-symbols-outlined">lock</span>
                        </div>
                      ) : (
                        <input 
                          type="checkbox" 
                          className="role-sidebar__checkbox"
                          checked={role.selected}
                          onChange={() => toggleRole(role.id)}
                        />
                      )}
                    </div>
                    <div className="role-sidebar__role-content">
                      <div className="role-sidebar__role-header">
                        <span className="role-sidebar__role-name">{role.name}</span>
                        {role.locked && (
                          <span className="material-symbols-outlined role-sidebar__info-icon" title="Cannot remove last role">info</span>
                        )}
                      </div>
                      <p className="role-sidebar__role-desc">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Permission Preview */}
            <div className="role-sidebar__permission-preview">
              <div className="role-sidebar__preview-header">
                <span className="material-symbols-outlined">visibility</span>
                <span className="role-sidebar__preview-title">{t('users.roles.permissionPreview', 'Permission Preview')}</span>
              </div>
              <ul className="role-sidebar__preview-list">
                <li>Manage organization-level configurations</li>
                <li>Invite and deactivate team members</li>
                <li>Configure security and SSO providers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="role-sidebar__footer">
          <button className="role-sidebar__save-btn" onClick={() => onSave(roles)}>
            <span className="material-symbols-outlined">check_circle</span>
            <span>{t('users.form.saveButton', 'Save Changes')}</span>
          </button>
          <button className="role-sidebar__cancel-btn" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </button>
        </div>
      </aside>
    </>
  );
}
