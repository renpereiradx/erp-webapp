import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserSession } from '@/types';

interface ActiveSessionsListProps {
  loading: boolean;
  sessions: UserSession[];
  onRevokeSession: (id: string | number) => void;
  onRevokeAll: () => void;
  t: any;
}

/** Devuelve el ícono de Material Symbols según el tipo de dispositivo */
function getDeviceIcon(deviceType: string): string {
  switch (deviceType) {
    case 'mobile':    return 'smartphone';
    case 'tablet':    return 'tablet_mac';
    case 'desktop':   return 'laptop_mac';
    default:          return 'devices';
  }
}

/** Construye un nombre legible desde los campos enriquecidos del backend */
function getSessionDisplayName(session: UserSession): string {
  if (session.user_first_name || session.user_last_name) {
    return `${session.user_first_name ?? ''} ${session.user_last_name ?? ''}`.trim();
  }
  if (session.user?.first_name || session.user?.last_name) {
    return `${session.user.first_name ?? ''} ${session.user.last_name ?? ''}`.trim();
  }
  if (session.user_username) return session.user_username;
  if (session.user?.username) return session.user.username;
  // Fallback al user-agent truncado
  return session.user_agent
    ? session.user_agent.length > 40
      ? session.user_agent.substring(0, 40) + '…'
      : session.user_agent
    : 'Dispositivo Desconocido';
}

export function ActiveSessionsList({ loading, sessions, onRevokeSession, onRevokeAll, t }: ActiveSessionsListProps) {
  return (
    <Card className="border-border-subtle shadow-card rounded-xl overflow-hidden mb-8 glass-mica">
      <CardHeader className="bg-surface-light dark:bg-surface-dark border-b border-border-subtle flex flex-row items-center justify-between py-4 px-6">
        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark m-0">
          <span className="material-symbols-outlined text-lg text-primary">history</span>
          {t('profile.active_sessions', 'Sesiones Activas')}
          {sessions.length > 0 && (
            <span className="ml-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
              {sessions.length}
            </span>
          )}
        </CardTitle>
        <Button 
          variant="ghost" 
          onClick={onRevokeAll} 
          className="text-[10px] font-bold uppercase text-fluent-danger hover:bg-fluent-danger/10 h-8 px-3 rounded-lg tracking-wider transition-colors"
        >
          {t('profile.sign_out_all', 'Cerrar todas las sesiones')}
        </Button>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border-subtle">
        {loading ? (
          <div className="p-6 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Cargando sesiones...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            No se encontraron sesiones activas
          </div>
        ) : (
          sessions.map((s, i) => (
            <div key={s.id || i} className="flex items-center justify-between p-4 px-6 hover:bg-background-light/50 dark:hover:bg-background-dark/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`size-10 rounded-lg flex items-center justify-center ${s.is_current ? 'bg-primary/10 text-primary' : 'bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark'}`}>
                  <span className="material-symbols-outlined text-xl">{getDeviceIcon(s.device_type)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                      {getSessionDisplayName(s)}
                    </span>
                    {s.is_current && (
                      <span className="text-[9px] font-bold bg-fluent-success/10 text-fluent-success px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        Actual
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark font-medium">
                    {s.location_info || s.ip_address}
                    {' • '}
                    {s.last_activity ? new Date(s.last_activity).toLocaleString() : 'Activo'}
                    {s.expires_at && (
                      <span className="ml-1 opacity-70">
                        · Expira {new Date(s.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {!s.is_current && (
                <button 
                  onClick={() => onRevokeSession(s.id)} 
                  className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-fluent-danger hover:bg-fluent-danger/10 rounded-lg transition-all"
                  title="Revocar sesión"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

