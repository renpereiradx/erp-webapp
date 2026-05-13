import { useI18n } from '@/lib/i18n';
import { useProfile } from '../hooks/useProfile';
import { useSessions } from '../hooks/useSessions';
import { ProfileHeader } from './ProfileHeader';
import { PersonalInfoForm } from './PersonalInfoForm';
import { SecuritySettingsForm } from './SecuritySettingsForm';
import { ActiveSessionsList } from './ActiveSessionsList';

export function ProfilePage() {
  const { t } = useI18n();
  const {
    loading: profileLoading,
    userData,
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    updateProfile,
    changePassword
  } = useProfile();

  const {
    loading: sessionsLoading,
    activeSessions,
    revokeSession,
    revokeAllOtherSessions
  } = useSessions();

  if (profileLoading || !userData) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">person</span>
          <span>{t('profile.account_settings', 'Configuración de Cuenta')}</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark font-display">{t('profile.title', 'Mi Perfil')}</h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('profile.subtitle', 'Administra tu información personal y seguridad')}</p>
      </header>

      <ProfileHeader 
        userData={userData} 
        onUpdateClick={() => updateProfile()} 
        t={t} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalInfoForm 
          userData={userData} 
          profileForm={profileForm} 
          setProfileForm={setProfileForm} 
          onSubmit={updateProfile} 
          t={t} 
        />
        <SecuritySettingsForm 
          passwordForm={passwordForm} 
          setPasswordForm={setPasswordForm} 
          onSubmit={changePassword} 
          t={t} 
        />
      </div>

      <ActiveSessionsList 
        loading={sessionsLoading} 
        sessions={activeSessions} 
        onRevokeSession={revokeSession} 
        onRevokeAll={revokeAllOtherSessions} 
        t={t} 
      />
    </div>
  );
}
