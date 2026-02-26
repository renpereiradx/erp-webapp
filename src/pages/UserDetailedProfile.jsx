import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useUserStore from '@/store/useUserStore';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Info, Ban, Trash2, ShieldCheck, CheckCircle, Mail, Phone, KeyRound, Edit2, MoreVertical, Calendar, User as UserIcon, Unlock, ChevronRight
} from 'lucide-react';
import { EditUserModal } from '@/components/users/EditUserModal';
import { ManageRolesPanel } from '@/components/users/ManageRolesPanel';

const UserDetailedProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { selectedUser: user, loading, fetchUserById, activateUser, deactivateUser, deleteUser } = useUserStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  useEffect(() => { if (id) fetchUserById(id); }, [id, fetchUserById]);

  if (loading && !user) return <div className="min-h-screen flex items-center justify-center bg-background-light"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>;
  if (!user && !loading) return <div className="p-20 text-center"><h2 className="text-xl font-bold">{t('users.notFound')}</h2><Button onClick={() => navigate('/usuarios')} className="mt-4">{t('users.backToList')}</Button></div>;

  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '';
  const fullName = user ? `${user.first_name} ${user.last_name}` : '';

  const handleToggleStatus = async () => { if (user.status === 'active') { await deactivateUser(user.id); } else { await activateUser(user.id); } fetchUserById(user.id); };
  const handleDelete = async () => { if (window.confirm(t('users.confirmDelete', { name: fullName }))) { const result = await deleteUser(user.id); if (result.success) navigate('/usuarios'); } };

  return (
    <div className="min-h-screen bg-background-light p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest gap-2">
        <span onClick={() => navigate('/usuarios')} className="hover:text-primary cursor-pointer transition-colors">{t('users.title')}</span>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-text-main font-bold">{fullName}</span>
      </nav>

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative group">
            <Avatar className="size-24 border-4 border-white shadow-fluent-8 ring-1 ring-slate-100">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">{initials}</AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-1 right-1 size-5 rounded-full border-2 border-white shadow-sm ${user.status === 'active' ? 'bg-success' : 'bg-error'}`} />
          </div>
          <div className="space-y-2 pb-1 text-center md:text-left">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">{fullName}</h1>
              <Badge className={`border-none text-[9px] font-black uppercase tracking-wider h-5 ${user.status === 'active' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{t(`users.status.${user.status}`)}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-text-secondary"><Mail size={14} className="text-slate-300" />{user.email}</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-text-secondary"><UserIcon size={14} className="text-slate-300" />@{user.username}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 border-border-subtle font-bold uppercase text-[11px] tracking-widest bg-white" onClick={() => alert('Próximamente')}><KeyRound size={18} className="mr-2 text-slate-400" />Reset</Button>
          <Button onClick={() => setIsEditModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest px-6 h-11 shadow-lg shadow-primary/20"><Edit2 size={18} className="mr-2" />{t('users.actions.edit')}</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary & Actions */}
        <div className="space-y-8">
          <Card className="border-border-subtle shadow-fluent-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><Info size={16} className="text-primary" />{t('users.profile.summary')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">ID del Sistema</p>
                <p className="text-xs font-mono font-bold text-text-main bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">{user.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Último Acceso</p>
                  <p className="text-xs font-bold text-text-main mt-2">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Nunca'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Miembro desde</p>
                  <p className="text-xs font-bold text-text-main mt-2">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle shadow-fluent-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('users.profile.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start h-11 text-xs font-bold text-text-main hover:bg-slate-50" onClick={handleToggleStatus}>
                {user.status === 'active' ? <Ban size={18} className="mr-3 text-error" /> : <Unlock size={18} className="mr-3 text-success" />}
                {user.status === 'active' ? t('users.deactivate') : t('users.activate')}
              </Button>
              <Button variant="ghost" className="w-full justify-start h-11 text-xs font-bold text-error hover:bg-error/5" onClick={handleDelete}>
                <Trash2 size={18} className="mr-3" /> {t('users.actions.delete')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Roles & Security */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border-subtle shadow-fluent-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between py-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 m-0 flex items-center gap-3"><ShieldCheck size={18} className="text-primary" />Roles y Permisos</CardTitle>
              <Button variant="ghost" className="text-[10px] font-black uppercase text-primary hover:bg-primary/5 h-8 tracking-widest" onClick={() => setIsRolesModalOpen(true)}>{t('users.actions.manageRoles')}</Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.roles?.map(role => (
                  <div key={role.id} className="p-4 rounded-xl border border-border-subtle bg-slate-50/50 hover:border-primary/20 transition-colors space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`border-none text-[9px] font-black uppercase tracking-wider h-5 ${role.id === "admin" ? "bg-indigo-50 text-indigo-600" : "bg-primary/10 text-primary"}`}>{role.name}</Badge>
                      <CheckCircle size={16} className="text-success" />
                    </div>
                    <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
                      {role.id === 'admin' ? t('users.roles.adminFull') : t('users.roles.standardFull')}
                    </p>
                  </div>
                ))}
                {(!user.roles || user.roles.length === 0) && <p className="text-sm text-slate-400 italic p-4 text-center col-span-2">{t('users.noRoles')}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle shadow-fluent-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between py-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 m-0 flex items-center gap-3"><History size={18} className="text-primary" />Actividad de Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary"><Monitor size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('users.profile.activeSessions')}</p>
                    <p className="text-2xl font-black text-primary leading-none">{user.sessions_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500"><Calendar size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('users.profile.failedAttempts')}</p>
                    <p className="text-2xl font-black text-amber-600 leading-none">{user.failed_login_attempts || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditUserModal user={user} open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) fetchUserById(user.id); }} />
      <ManageRolesPanel user={user} open={isRolesModalOpen} onOpenChange={setIsRolesModalOpen} />
    </div>
  );
};

export default UserDetailedProfile;