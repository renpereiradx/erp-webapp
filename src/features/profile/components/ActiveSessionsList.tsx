import { useState } from 'react';
import { History, Monitor, Smartphone, Tablet, MonitorSmartphone, X } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { UserSession } from '@/types';
import { getSessionDeviceKey, getSessionDisplayName } from '@/domain/sessions/sessionDisplay';

const DEVICE_ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: MonitorSmartphone,
} as const;

interface ActiveSessionsListProps {
  loading: boolean;
  sessions: UserSession[];
  onRevokeSession: (id: string | number) => void;
  onRevokeAll: () => void;
}

/** Active sessions of the logged user, with per-session revoke and confirmed revoke-all. */
export function ActiveSessionsList({ loading, sessions, onRevokeSession, onRevokeAll }: ActiveSessionsListProps) {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string) => string };
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
      <div className="flex items-center justify-between mb-md">
        <h3 className="text-label-caps uppercase text-on-surface-deep flex items-center gap-sm">
          <History className="size-4 text-primary" />
          {t('profile.active_sessions', 'Sesiones Activas')}
          {sessions.length > 0 && (
            <span className="bg-primary/10 text-primary text-body-sm-bold px-sm rounded-full">
              {sessions.length}
            </span>
          )}
        </h3>
        <Button variant="ghost" size="sm" className="text-error hover:bg-error/5" onClick={() => setIsConfirmOpen(true)}>
          {t('profile.sign_out_all', 'Cerrar todas las demás sesiones')}
        </Button>
      </div>

      <div className="p-0 divide-y divide-border-subtle">
        {loading ? (
          <p className="p-md text-body-md text-on-surface-deep text-center">
            {t('profile.sessions.loading', 'Cargando sesiones…')}
          </p>
        ) : sessions.length === 0 ? (
          <p className="p-md text-body-md text-on-surface-deep text-center">
            {t('profile.sessions.empty', 'No se encontraron sesiones activas')}
          </p>
        ) : (
          sessions.map((session, index) => {
            const deviceKey = getSessionDeviceKey(session);
            const DeviceIcon = DEVICE_ICONS[deviceKey];
            return (
              <div
                key={session.id ?? index}
                className="flex items-center justify-between p-md hover:bg-surface-muted transition-colors duration-150"
              >
                <div className="flex items-center gap-md min-w-0">
                  <div
                    className={`size-10 rounded-md flex items-center justify-center shrink-0 ${
                      session.is_current ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-on-surface-deep'
                    }`}
                  >
                    <DeviceIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-sm">
                      <span className="text-body-md-bold text-foreground truncate">
                        {getSessionDisplayName(session)}
                      </span>
                      {session.is_current && (
                        <span className="text-xs font-bold bg-success/10 text-success px-sm py-0.5 rounded-full uppercase">
                          {t('profile.badge.current', 'Actual')}
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-deep truncate">
                      {session.location_info || session.ip_address}
                      {' · '}
                      <span className="font-data-mono">
                        {session.last_activity ? new Date(session.last_activity).toLocaleString() : t('profile.sessions.activity_recent', 'Activo')}
                      </span>
                      {session.expires_at && (
                        <span className="opacity-70">
                          {' · '}
                          {t('profile.sessions.expires', 'Expira')}{' '}
                          <span className="font-data-mono">{new Date(session.expires_at).toLocaleDateString()}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {!session.is_current && session.is_active !== false && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('profile.sessions.revoke', 'Revocar sesión')}
                    title={t('profile.sessions.revoke', 'Revocar sesión')}
                    className="text-on-surface-deep hover:text-error hover:bg-error/10 shrink-0"
                    onClick={() => onRevokeSession(session.id)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title={t('profile.sessions.revoke_all_title', 'Cerrar las demás sesiones')}
        description={t(
          'profile.sessions.revoke_all_description',
          'Se cerrarán todas tus sesiones en otros dispositivos. Tendrás que iniciar sesión nuevamente en ellos.',
        )}
        confirmLabel={t('profile.sessions.revoke_all_confirm', 'Cerrar sesiones')}
        onConfirm={() => {
          setIsConfirmOpen(false);
          onRevokeAll();
        }}
        onOpenChange={setIsConfirmOpen}
      />
    </div>
  );
}
