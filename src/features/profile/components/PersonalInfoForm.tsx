import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserRound } from 'lucide-react';

import type { ProfileFormState } from '../types';
import type { User } from '@/types';

interface PersonalInfoFormProps {
  userData: User;
  profileForm: ProfileFormState;
  setProfileForm: (state: ProfileFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** Editable personal data of the logged user (email is read-only). */
export function PersonalInfoForm({ userData, profileForm, setProfileForm, onSubmit }: PersonalInfoFormProps) {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string) => string };
  const labelClass = 'text-body-md-bold text-foreground';

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
      <h3 className="text-label-caps uppercase text-on-surface-deep flex items-center gap-sm mb-md">
        <UserRound className="size-4 text-primary" />
        {t('profile.personal_info', 'Información Personal')}
      </h3>
      <div className="p-0">
        <form onSubmit={onSubmit} className="space-y-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label htmlFor="profile-first-name" className={labelClass}>
                {t('profile.first_name', 'Nombre')}
              </label>
              <Input
                id="profile-first-name"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-xs">
              <label htmlFor="profile-last-name" className={labelClass}>
                {t('profile.last_name', 'Apellido')}
              </label>
              <Input
                id="profile-last-name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-xs">
            <label htmlFor="profile-email" className={labelClass}>
              {t('profile.email', 'Correo Electrónico')}
            </label>
            <Input id="profile-email" value={userData.email} disabled className="opacity-70" />
            <p className="text-body-sm text-on-surface-deep">
              {t('profile.email.readonly_hint', 'El correo no puede modificarse desde el perfil.')}
            </p>
          </div>

          <div className="space-y-xs">
            <label htmlFor="profile-phone" className={labelClass}>
              {t('profile.phone', 'Teléfono')}
            </label>
            <Input
              id="profile-phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-sm">
            <Button type="submit" variant="secondary">
              {t('profile.update_profile', 'Actualizar Perfil')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
