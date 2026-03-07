import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import userService from '@/services/userService';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function MyProfileAndSecurity() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ id: '', first_name: '', last_name: '', email: '', username: '', phone: '', avatar_url: '', created_at: '', roles: [], sessions_count: 0 });
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => { fetchProfileData(); }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await userService.getMe();
      if (response.success && response.data) {
        setUserData(response.data);
        setProfileForm({ first_name: response.data.first_name || '', last_name: response.data.last_name || '', phone: response.data.phone || '' });
      }
    } catch (error) { toast.error(t('profile.errors.fetch_failed')); } finally { setLoading(false); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await userService.updateMe(profileForm);
      if (response.success) { toast.success(t('profile.success.update')); fetchProfileData(); }
    } catch (error) { toast.error(t('profile.errors.update_failed')); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error(t('profile.errors.password_mismatch')); return; }
    try {
      const response = await userService.changeMyPassword({ current_password: passwordForm.current_password, new_password: passwordForm.new_password, logout_other_sessions: false });
      if (response.success) { toast.success(t('profile.success.password_changed')); setPasswordForm({ current_password: '', new_password: '', confirm_password: '' }); }
    } catch (error) { toast.error(error.response?.data?.error?.message || t('profile.errors.password_change_failed')); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <span className="material-symbols-outlined text-4xl text-[#106ebe] animate-spin">refresh</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#106ebe] uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">person</span>
          <span>{t('profile.account_settings', 'Configuración de Cuenta')}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('profile.title')}</h1>
        <p className="text-sm text-slate-500">{t('profile.subtitle')}</p>
      </header>

      {/* Profile Summary Card */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <div className="bg-[#106ebe]/5 h-24 w-full"></div>
          <div className="px-6 pb-6 -mt-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
              <div className="relative group">
                <Avatar className="size-24 border-4 border-white dark:border-slate-900 shadow-md">
                  {userData.avatar_url && <AvatarImage src={userData.avatar_url} />}
                  <AvatarFallback className="bg-[#106ebe] text-white text-3xl font-bold">
                    {userData.first_name?.[0]}{userData.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 size-8 rounded-full bg-[#106ebe] text-white shadow-lg border-2 border-white dark:border-slate-900 flex items-center justify-center hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                </button>
              </div>
              <div className="space-y-1 pb-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {userData.first_name} {userData.last_name}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-xs font-medium text-slate-500">@{userData.username} • {userData.email}</span>
                  <Badge variant="outline" className="bg-[#106ebe]/5 text-[#106ebe] border-[#106ebe]/20 text-[10px] font-bold px-2 py-0">
                    {userData.roles?.[0]?.name}
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-bold px-2 py-0">
                    Activo
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex justify-center pb-1">
              <Button onClick={handleProfileUpdate} className="bg-[#106ebe] text-white hover:bg-[#005a9e] font-bold text-xs h-9 px-6 rounded-lg shadow-sm transition-all">
                {t('profile.update_profile_btn')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4 px-6">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="material-symbols-outlined text-lg text-[#106ebe]">contact_page</span>
              {t('profile.personal_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">{t('profile.first_name')}</label>
                  <Input value={profileForm.first_name} onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})} className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">{t('profile.last_name')}</label>
                  <Input value={profileForm.last_name} onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})} className="h-10 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">{t('profile.email')}</label>
                <Input value={userData.email} disabled className="h-10 bg-slate-50 dark:bg-slate-800/50 opacity-70 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">{t('profile.phone')}</label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} className="h-10 text-sm" />
              </div>
              <Button type="submit" className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#106ebe] hover:text-white font-bold text-xs h-10 rounded-lg transition-all">
                {t('profile.update_profile')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4 px-6">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="material-symbols-outlined text-lg text-[#106ebe]">security</span>
              {t('profile.security_settings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">{t('profile.current_password')}</label>
                <Input type="password" placeholder="••••••••••••" value={passwordForm.current_password} onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})} className="h-10 font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">{t('profile.new_password')}</label>
                <Input type="password" placeholder={t('profile.min_chars')} value={passwordForm.new_password} onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})} className="h-10 font-mono text-sm" />
                <div className="flex gap-1 pt-1">
                  <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                  <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                  <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                  <div className="h-1 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">{t('profile.confirm_password')}</label>
                <Input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})} className="h-10 font-mono text-sm" />
              </div>
              <Button type="submit" className="w-full bg-slate-900 dark:bg-slate-700 text-white hover:bg-[#106ebe] font-bold text-xs h-10 rounded-lg transition-all shadow-sm">
                {t('profile.update_password')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden mb-8">
        <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 m-0">
            <span className="material-symbols-outlined text-lg text-[#106ebe]">history</span>
            {t('profile.active_sessions')}
          </CardTitle>
          <Button variant="ghost" className="text-[10px] font-bold uppercase text-rose-600 hover:bg-rose-50 h-8 px-3 rounded-lg tracking-wider">
            {t('profile.sign_out_all')}
          </Button>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-50 dark:divide-slate-800">
          {[
            { icon: 'desktop_windows', device: "Chrome on macOS Monterey", loc: "San Francisco, USA • 192.168.1.1", current: true },
            { icon: 'smartphone', device: "Safari on iPhone 15 Pro", loc: "San Francisco, USA • Hace 2 horas", current: false },
            { icon: 'laptop', device: "Firefox on Windows 11", loc: "Seattle, USA • Hace 3 días", current: false }
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`size-10 rounded-lg flex items-center justify-center ${s.current ? 'bg-[#106ebe]/10 text-[#106ebe]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <span className="material-symbols-outlined text-xl">{s.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{s.device}</span>
                    {s.current && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Actual</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">{s.loc}</p>
                </div>
              </div>
              {!s.current && (
                <button className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
