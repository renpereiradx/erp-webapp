import { Loader2 } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import { useProfile } from '../hooks/useProfile';
import { useSessions } from '../hooks/useSessions';
import { ProfileHeader } from './ProfileHeader';
import { PersonalInfoForm } from './PersonalInfoForm';
import { SecuritySettingsForm } from './SecuritySettingsForm';
import { ActiveSessionsList } from './ActiveSessionsList';
import type { TFn } from '../types';

const PageHeaderX = PageHeader as unknown as React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: string;
}>;

/** /configuracion/perfil — account, security and active sessions of the logged user. */
export function ProfilePage() {
  const { t } = useI18n() as unknown as { t: TFn };
  const {
    loading: profileLoading,
    userData,
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    updateProfile,
    changePassword,
  } = useProfile();

  const { loading: sessionsLoading, activeSessions, revokeSession, revokeAllOtherSessions } = useSessions(t);

  if (profileLoading || !userData) {
    return (
      <div className="flex flex-col items-center justify-center p-xl gap-sm" role="status">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-body-md text-on-surface-deep">{t('profile.loading', 'Cargando perfil…')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-lg animate-in fade-in duration-300">
      <PageHeaderX
        breadcrumb={t('nav.settings', 'Configuración')}
        title={t('profile.title', 'Mi Perfil y Seguridad')}
        subtitle={t(
          'profile.subtitle',
          'Gestione su información personal, credenciales de seguridad y sesiones activas.',
        )}
      />

      <ProfileHeader userData={userData} onUpdateClick={() => void updateProfile()} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <PersonalInfoForm
          userData={userData}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          onSubmit={updateProfile}
        />
        <SecuritySettingsForm
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          onSubmit={changePassword}
        />
      </div>

      <ActiveSessionsList
        loading={sessionsLoading}
        sessions={activeSessions}
        onRevokeSession={(id) => void revokeSession(id)}
        onRevokeAll={() => void revokeAllOtherSessions()}
      />
    </div>
  );
}
