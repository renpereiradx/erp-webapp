import { AtSign, Camera, Mail, ShieldCheck } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { getUserInitials } from '@/domain/users/userDisplay';

interface ProfileHeaderProps {
  userData: User;
  onUpdateClick: () => void;
}

/** Identity card of the profile page (surface + whisper shadow, no gradients per DESIGN §1.9). */
export function ProfileHeader({ userData, onUpdateClick }: ProfileHeaderProps) {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string) => string };
  const isActive = userData.status === 'active';

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-lg">
        {/* Left: avatar + identity */}
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-md">
          <div className="relative shrink-0">
            {/* avatar--* CSS is dead in this repo: sizing/flex must come via className */}
            <Avatar size={96} className="inline-flex size-24 overflow-hidden rounded-full border-4 border-surface shadow-whisper">
              {userData.avatar_url && <AvatarImage src={userData.avatar_url} className="object-cover" />}
              <AvatarFallback className="bg-primary/10 text-primary text-headline-lg-mobile">
                {getUserInitials(userData)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute bottom-0 right-0 size-8 rounded-full bg-surface text-primary shadow-whisper border border-border-subtle flex items-center justify-center transition-colors duration-150 hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-primary/30"
              title={t('profile.change_photo', 'Cambiar foto de perfil')}
              aria-label={t('profile.change_photo', 'Cambiar foto de perfil')}
            >
              <Camera className="size-4" />
            </button>
          </div>

          <div className="space-y-sm min-w-0">
            <h2 className="text-headline-lg-mobile text-foreground truncate">
              {userData.first_name} {userData.last_name}
            </h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-md">
              <span className="flex items-center gap-xs text-body-md text-on-surface-deep">
                <AtSign className="size-4 text-outline" />
                {userData.username}
              </span>
              <span className="flex items-center gap-xs text-body-md text-on-surface-deep">
                <Mail className="size-4 text-outline" />
                {userData.email}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-sm pt-xs">
              {/* variant wins the cascade: cn() has no tailwind-merge, custom bg/text classes would conflict */}
              <Badge size="sm" variant="default">
                <ShieldCheck className="size-3 mr-xs" />
                {userData.roles?.[0]?.name || userData.role_name || '—'}
              </Badge>
              <Badge size="sm" variant={isActive ? 'success' : 'secondary'}>
                <span className={`size-1.5 rounded-full mr-xs ${isActive ? 'bg-white' : 'bg-outline'}`} />
                {isActive
                  ? t('profile.status.active', 'Activo')
                  : t('profile.status.inactive', 'Inactivo')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: primary action */}
        <div className="shrink-0 w-full md:w-auto flex justify-center">
          <Button variant="primary" onClick={onUpdateClick} className="w-full md:w-auto">
            {t('profile.update_profile_btn', 'Actualizar Perfil')}
          </Button>
        </div>
      </div>
    </div>
  );
}
