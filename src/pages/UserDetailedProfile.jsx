import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useUserStore from '@/store/useUserStore';
import { useI18n } from '@/lib/i18n';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  Ban, 
  Trash2, 
  ShieldCheck, 
  CheckCircle, 
  Mail,
  Phone,
  KeyRound,
  Edit2,
  MoreVertical,
  Calendar,
  User as UserIcon,
  Unlock
} from 'lucide-react';
import { EditUserModal } from '@/components/users/EditUserModal';
import { ManageRolesPanel } from '@/components/users/ManageRolesPanel';

const UserDetailedProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { 
    selectedUser: user, 
    loading, 
    fetchUserById, 
    activateUser, 
    deactivateUser, 
    deleteUser 
  } = useUserStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserById(id);
    }
  }, [id, fetchUserById]);

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">{t('users.notFound', 'Usuario no encontrado')}</h2>
        <Button onClick={() => navigate('/usuarios')} className="mt-4">
          {t('users.backToList', 'Volver a la lista')}
        </Button>
      </div>
    );
  }

  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '';
  const fullName = user ? `${user.first_name} ${user.last_name}` : '';

  const handleToggleStatus = async () => {
    if (user.status === 'active') {
      await deactivateUser(user.id);
    } else {
      await activateUser(user.id);
    }
    fetchUserById(user.id);
  };

  const handleDelete = async () => {
    if (window.confirm(t('users.confirmDelete', { name: fullName }))) {
      const result = await deleteUser(user.id);
      if (result.success) {
        navigate('/usuarios');
      }
    }
  };

  return (
    <div className="user-profile">
      <main className="user-profile__content">
        <div className="user-profile__container">
          {/* Breadcrumbs */}
          <div className="user-profile__breadcrumb-container">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigate('/usuarios')} className="cursor-pointer">{t('users.title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{fullName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header Section */}
          <div className="user-profile__header">
            <div className="user-profile__header-left">
              <div className="user-profile__avatar-wrapper">
                <Avatar size={96}>
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={fullName} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className={`user-profile__status-indicator user-profile__status-indicator--${user.status}`} />
              </div>
              <div className="user-profile__header-info">
                <div className="user-profile__name-row">
                  <h1>{fullName}</h1>
                  <Badge variant={user.status === 'active' ? 'subtle-success' : 'subtle-error'} shape="pill">
                    {t(`users.status.${user.status}`)}
                  </Badge>
                </div>
                <div className="user-profile__contact-row">
                  <span className="user-profile__contact-item">
                    <Mail size={16} /> {user.email}
                  </span>
                  {user.phone && (
                    <span className="user-profile__contact-item">
                      <Phone size={16} /> {user.phone}
                    </span>
                  )}
                  <span className="user-profile__contact-item text-muted-foreground">
                    <UserIcon size={16} /> @{user.username}
                  </span>
                </div>
              </div>
            </div>
            <div className="user-profile__header-actions">
              <Button variant="secondary" onClick={() => alert('Próximamente: Cambio de contraseña administrativo')}>
                <KeyRound className="btn__icon" />
                {t('users.actions.changePassword', 'Reiniciar Contraseña')}
              </Button>
              <Button variant="primary" onClick={() => setIsEditModalOpen(true)}>
                <Edit2 className="btn__icon" />
                {t('users.actions.edit')}
              </Button>
              <Button variant="secondary" size="icon">
                <MoreVertical />
              </Button>
            </div>
          </div>

          <div className="user-profile__grid">
            {/* Left Sidebar: Metadata & Quick Actions */}
            <div className="user-profile__sidebar">
              <Card>
                <CardHeader>
                  <CardTitle className="user-profile__card-title">
                    <Info size={18} /> {t('users.profile.summary', 'Resumen de Usuario')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="user-profile__info-list">
                  <div className="user-profile__info-item">
                    <span className="user-profile__info-label">{t('users.table.id', 'ID del Sistema')}</span>
                    <span className="user-profile__info-value font-mono text-xs">{user.id}</span>
                  </div>
                  <div className="user-profile__info-item">
                    <span className="user-profile__info-label">{t('users.table.lastActive', 'Último Acceso')}</span>
                    <span className="user-profile__info-value">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : t('common.never', 'Nunca')}
                    </span>
                  </div>
                  <div className="user-profile__info-item">
                    <span className="user-profile__info-label">{t('users.table.createdAt', 'Fecha Registro')}</span>
                    <span className="user-profile__info-value">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('users.profile.quickActions', 'Gestión Rápida')}</CardTitle>
                </CardHeader>
                <CardContent className="user-profile__action-list">
                  <Button variant="ghost" className="user-profile__quick-action-btn" onClick={handleToggleStatus}>
                    {user.status === 'active' ? <Ban size={18} /> : <Unlock size={18} />}
                    {user.status === 'active' ? t('users.deactivate') : t('users.activate')}
                  </Button>
                  <Button variant="ghost" className="user-profile__quick-action-btn user-profile__quick-action-btn--destructive" onClick={handleDelete}>
                    <Trash2 size={18} /> {t('users.actions.delete')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Roles & Security Summary */}
            <div className="user-profile__main">
              {/* Roles & Permissions */}
              <Card>
                <CardHeader className="card__header--with-action">
                  <CardTitle>{t('users.table.role', 'Roles y Permisos Asignados')}</CardTitle>
                  <Button variant="ghost" className="btn--link" onClick={() => setIsRolesModalOpen(true)}>
                    {t('users.actions.manageRoles', 'Gestionar Roles')}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="user-profile__roles-grid">
                    {user.roles?.map(role => (
                      <div key={role.id} className="user-profile__role-card">
                        <div className="user-profile__role-header">
                          <Badge variant={role.id === 'admin' ? 'primary' : 'secondary'}>{role.name.toUpperCase()}</Badge>
                          <ShieldCheck size={18} className="text-primary" />
                        </div>
                        <p className="user-profile__role-name">
                          {role.id === 'admin' ? t('users.roles.adminDesc', 'Acceso Total a la Instancia') : t('users.roles.defaultDesc', 'Permisos de Usuario Estándar')}
                        </p>
                        <p className="user-profile__role-description">
                          {role.id === 'admin' 
                            ? t('users.roles.adminFull', 'Capacidad para gestionar todos los usuarios, configuraciones de seguridad y ajustes globales.')
                            : t('users.roles.standardFull', 'Acceso a las funcionalidades operativas básicas del sistema.')}
                        </p>
                      </div>
                    ))}
                    {(!user.roles || user.roles.length === 0) && (
                      <p className="text-muted-foreground italic p-4 text-center w-full">
                        {t('users.noRoles', 'No hay roles asignados a este usuario.')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('users.profile.securitySummary', 'Resumen de Seguridad')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-subtle">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('users.profile.activeSessions', 'Sesiones Activas')}</p>
                        <p className="text-xl font-bold">{user.sessions_count || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-subtle">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('users.profile.failedAttempts', 'Intentos Fallidos')}</p>
                        <p className="text-xl font-bold text-orange-600">{user.failed_login_attempts || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      <EditUserModal 
        user={user}
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) fetchUserById(user.id);
        }}
      />
      {/* Manage Roles Panel */}
      <ManageRolesPanel 
        user={user}
        open={isRolesModalOpen}
        onOpenChange={setIsRolesModalOpen}
      />
    </div>
  );
};

export default UserDetailedProfile;