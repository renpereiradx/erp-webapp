import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import userService from '@/services/userService';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Camera, 
  ShieldCheck, 
  User, 
  Lock, 
  Smartphone, 
  Monitor, 
  Laptop, 
  X, 
  Contact,
  Shield,
  KeyRound,
  History
} from 'lucide-react';

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
    return <div className="min-h-screen flex items-center justify-center bg-background-light"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background-light p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Heading */}
        <header className="flex flex-col gap-1 border-l-4 border-primary pl-4">
          <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">{t('profile.title')}</h1>
          <p className="text-text-secondary text-sm font-medium mt-1">{t('profile.subtitle')}</p>
        </header>

        {/* Profile Summary Card */}
        <Card className="border-none shadow-fluent-8 bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary to-indigo-600 h-32 w-full opacity-10"></div>
            <div className="px-8 pb-8 -mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                <div className="relative group">
                  <Avatar className="size-32 border-4 border-white shadow-fluent-16 ring-1 ring-slate-100">
                    {userData.avatar_url && <AvatarImage src={userData.avatar_url} />}
                    <AvatarFallback className="bg-primary text-white text-4xl font-black">{userData.first_name?.[0]}{userData.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-1 right-1 size-9 rounded-full bg-primary text-white shadow-lg border-2 border-white flex items-center justify-center hover:scale-110 transition-transform"><Camera size={18} /></button>
                </div>
                <div className="space-y-2 pb-2">
                  <h3 className="text-2xl font-black text-text-main uppercase tracking-tighter leading-none">{userData.first_name} {userData.last_name}</h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="text-xs font-bold text-text-secondary">@{userData.username} • {userData.email}</span>
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-wider h-5">{userData.roles?.[0]?.name}</Badge>
                    <Badge className="bg-success/10 text-success border-none text-[9px] font-black uppercase tracking-wider h-5">Activo</Badge>
                  </div>
                </div>
              </div>
              <div className="flex justify-center pb-2">
                <Button onClick={handleProfileUpdate} className="bg-primary hover:bg-primary-hover font-black uppercase tracking-widest px-8 h-11 shadow-lg shadow-primary/20">{t('profile.update_profile_btn')}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Info */}
          <Card className="border-border-subtle shadow-fluent-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                <Contact size={18} className="text-primary" />{t('profile.personal_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('profile.first_name')}</label>
                    <Input value={profileForm.first_name} onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})} className="h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('profile.last_name')}</label>
                    <Input value={profileForm.last_name} onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})} className="h-11 font-bold" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('profile.email')}</label>
                  <Input value={userData.email} disabled className="h-11 bg-slate-50 font-bold opacity-70" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('profile.phone')}</label>
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} className="h-11 font-bold" />
                </div>
                <Button type="submit" className="w-full bg-slate-100 text-slate-600 hover:bg-primary hover:text-white font-black uppercase tracking-widest h-11 transition-all">{t('profile.update_profile')}</Button>
              </form>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-border-subtle shadow-fluent-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                <Shield size={18} className="text-primary" />{t('profile.security_settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('profile.current_password')}</label>
                  <Input type="password" placeholder="••••••••••••" value={passwordForm.current_password} onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})} className="h-11 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('profile.new_password')}</label>
                  <Input type="password" placeholder={t('profile.min_chars')} value={passwordForm.new_password} onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})} className="h-11 font-mono" />
                  <div className="flex gap-1 pt-1"><div className="h-1.5 flex-1 bg-success rounded-full"></div><div className="h-1.5 flex-1 bg-success rounded-full"></div><div className="h-1.5 flex-1 bg-success rounded-full"></div><div className="h-1.5 flex-1 bg-slate-100 rounded-full"></div></div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('profile.confirm_password')}</label>
                  <Input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})} className="h-11 font-mono" />
                </div>
                <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-primary font-black uppercase tracking-widest h-11 transition-all">{t('profile.update_password')}</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sessions */}
        <Card className="border-border-subtle shadow-fluent-2 rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between py-6">
            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400 m-0">
              <History size={18} className="text-primary" />{t('profile.active_sessions')}
            </CardTitle>
            <Button variant="ghost" className="text-[10px] font-black uppercase text-error hover:bg-error/5 h-8 tracking-widest">{t('profile.sign_out_all')}</Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-50">
            {[
              { icon: Monitor, device: "Chrome on macOS Monterey", loc: "San Francisco, USA • 192.168.1.1", current: true },
              { icon: Smartphone, device: "Safari on iPhone 15 Pro", loc: "San Francisco, USA • Hace 2 horas", current: false },
              { icon: Laptop, device: "Firefox on Windows 11", loc: "Seattle, USA • Hace 3 días", current: false }
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${s.current ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}><s.icon size={20} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-main">{s.device}</span>
                      {s.current && <span className="text-[9px] font-black bg-success text-white px-1.5 py-0.5 rounded-full uppercase">Actual</span>}
                    </div>
                    <p className="text-[11px] text-text-secondary font-medium mt-0.5">{s.loc}</p>
                  </div>
                </div>
                {!s.current && <button className="p-2 text-slate-300 hover:text-error hover:bg-error/5 rounded-lg transition-all"><X size={18} /></button>}
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
