import { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  Clock,
  Laptop,
  MapPin,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  Smartphone,
  Tablet,
} from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/ui/PageHeader';
import type { SessionDeviceKey, SessionStatusKey } from '@/domain/sessions/sessionDisplay';
import {
  getSessionAvatarInitial,
  getSessionDeviceKey,
  getSessionDisplayName,
  getSessionDisplayEmail,
  getSessionStatusKey,
  truncateUserAgent,
} from '@/domain/sessions/sessionDisplay';
import type { UserSession } from '@/types';

import { useAdminSessions } from '../hooks/useAdminSessions';

const PageHeaderX = PageHeader as unknown as React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}>;
const SkeletonList = GenericSkeletonList as unknown as React.FC<{ count?: number }>;
const LoadErrorState = ErrorState as unknown as React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  actions?: Array<{ label: string; onClick: () => void; variant?: string }>;
}>;
const NoDataState = EmptyState as unknown as React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
}>;

const DEVICE_ICONS: Record<SessionDeviceKey, typeof Laptop> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Laptop,
  unknown: MonitorSmartphone,
};

const STATUS_BADGE: Record<SessionStatusKey, { className: string; key: string }> = {
  active: { className: 'bg-success/10 text-success', key: 'sessions.status.badge.active' },
  idle: { className: 'bg-warning/10 text-warning', key: 'sessions.status.badge.idle' },
  revoked: { className: 'bg-error/10 text-error', key: 'sessions.status.badge.revoked' },
};

/** /configuracion/sesiones — global sessions control (admin). */
export function AdminSessionsPage() {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string };
  const admin = useAdminSessions();

  const maxBucket = useMemo(
    () => Math.max(1, ...admin.activity.map((bucket) => bucket.count)),
    [admin.activity],
  );

  if (admin.forbidden) {
    return (
      <div className="py-xl">
        <LoadErrorState
          title={t('sessions.error.forbidden.title', 'Acceso denegado')}
          message={t(
            'sessions.error.forbidden.description',
            'Tu usuario no cuenta con los permisos necesarios para gestionar sesiones globales.',
          )}
          actions={[{ label: t('sessions.back', 'Volver'), onClick: () => window.history.back(), variant: 'secondary' }]}
        />
      </div>
    );
  }

  const metricsCards = [
    { key: 'sessions.metrics.active', value: admin.metrics.active, icon: ShieldCheck, tone: 'text-success' },
    { key: 'sessions.metrics.idle', value: admin.metrics.idle, icon: Clock, tone: 'text-warning' },
    { key: 'sessions.metrics.revoked', value: admin.metrics.revoked, icon: Ban, tone: 'text-on-surface-deep' },
    { key: 'sessions.metrics.anomalies', value: admin.metrics.anomalies, icon: AlertTriangle, tone: 'text-error' },
  ];

  const headClass = 'text-label-caps uppercase text-on-surface-deep';

  return (
    <div className="space-y-lg animate-in fade-in duration-300">
      <PageHeaderX
        title={t('sessions.title', 'Control Global de Sesiones')}
        subtitle={t('sessions.subtitle', 'Monitoreo y gestión en tiempo real de sesiones activas en todo el ecosistema ERP.')}
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {metricsCards.map(({ key, value, icon: Icon, tone }) => (
          <div key={key} className="bg-surface rounded-md shadow-whisper border-0 p-md flex items-center gap-md">
            <div className={`size-10 rounded-md bg-surface-muted flex items-center justify-center shrink-0 ${tone}`}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-label-caps uppercase text-on-surface-deep">{t(key)}</p>
              <p className="text-data-mono font-data-mono text-title-md text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-surface rounded-md shadow-whisper border-0 p-md flex flex-wrap items-center gap-md">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
          <label htmlFor="sessions-search" className="sr-only">
            {t('sessions.searchPlaceholder', 'Buscar por usuario, IP o dispositivo…')}
          </label>
          <Input
            id="sessions-search"
            value={admin.search}
            onChange={(event) => admin.setSearch(event.target.value)}
            placeholder={t('sessions.searchPlaceholder', 'Buscar por usuario, IP o dispositivo…')}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-sm">
          <label htmlFor="sessions-status" className="text-body-sm-bold text-on-surface-deep">
            {t('sessions.status.label', 'Estado')}
          </label>
          <select
            id="sessions-status"
            className="h-10 rounded-input border border-border-subtle bg-surface text-body-md text-foreground px-md outline-none focus:ring-2 focus:ring-primary/20"
            value={admin.status}
            onChange={(event) => admin.setStatus(event.target.value as typeof admin.status)}
          >
            <option value="all">{t('sessions.status.all', 'Todas')}</option>
            <option value="active">{t('sessions.status.active', 'Activas')}</option>
            <option value="idle">{t('sessions.status.idle', 'Inactivas')}</option>
            <option value="revoked">{t('sessions.status.revoked', 'Revocadas')}</option>
          </select>
        </div>

        <Button variant="destructive" onClick={() => admin.setConfirmRevokeAll(true)}>
          <Ban className="size-4 mr-sm" />
          {t('sessions.revokeAll', 'Revocar todas')}
        </Button>
      </div>

      {/* Data grid */}
      <div className="rounded-md bg-surface shadow-whisper overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-divider">
                <th className={`px-md py-3 ${headClass}`}>{t('sessions.table.user', 'Usuario')}</th>
                <th className={`px-md py-3 ${headClass}`}>{t('sessions.table.ip', 'Dirección IP')}</th>
                <th className={`px-md py-3 ${headClass}`}>{t('sessions.table.device', 'Dispositivo / Navegador')}</th>
                <th className={`px-md py-3 ${headClass}`}>{t('sessions.table.location', 'Ubicación')}</th>
                <th className={`px-md py-3 ${headClass}`}>{t('sessions.table.lastActivity', 'Última Actividad')}</th>
                <th className={`px-md py-3 ${headClass}`}>{t('sessions.table.status', 'Estado')}</th>
                <th className={`px-md py-3 ${headClass} text-right`}>{t('sessions.table.actions', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {admin.loading ? (
                <tr>
                  <td colSpan={7} className="p-md">
                    <SkeletonList count={6} />
                  </td>
                </tr>
              ) : admin.error ? (
                <tr>
                  <td colSpan={7} className="p-lg">
                    <LoadErrorState
                      title={t('sessions.error.title', 'Error al cargar sesiones')}
                      message={admin.error}
                      onRetry={() => void admin.refetch()}
                    />
                  </td>
                </tr>
              ) : admin.filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-lg">
                    <NoDataState
                      icon={Activity}
                      title={t('sessions.empty.title', 'Sin sesiones')}
                      description={t('sessions.empty.description', 'No hay sesiones que coincidan con la búsqueda o el filtro.')}
                    />
                  </td>
                </tr>
              ) : (
                admin.filteredSessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    isRevoking={admin.revokingId === session.id}
                    onRevoke={() => void admin.handleRevoke(session.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights — derived from real session data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="md:col-span-2 bg-surface rounded-md shadow-whisper border-0 p-lg">
          <h3 className="text-body-md-bold text-foreground mb-md flex items-center gap-sm">
            <Activity className="size-4 text-primary" />
            {t('sessions.insights.activity', 'Actividad de sesiones por horario')}
          </h3>
          {admin.hasActivity ? (
            <>
              <div className="h-44 flex items-end justify-between gap-xs px-xs">
                {admin.activity.map((bucket) => (
                  <div
                    key={bucket.hour}
                    className="flex-1 bg-primary/80 rounded-t-xs transition-all duration-150"
                    style={{ height: `${Math.max(4, (bucket.count / maxBucket) * 100)}%` }}
                    title={`${bucket.label}: ${bucket.count}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-sm text-label-caps text-on-surface-deep">
                {admin.activity
                  .filter((bucket) => bucket.hour % 6 === 0)
                  .map((bucket) => (
                    <span key={bucket.hour}>{bucket.label}</span>
                  ))}
              </div>
            </>
          ) : (
            <p className="text-body-md text-on-surface-deep py-lg text-center">
              {t('sessions.insights.activityEmpty', 'Sin actividad registrada todavía.')}
            </p>
          )}
        </div>

        <div className="bg-surface rounded-md shadow-whisper border-0 p-lg flex flex-col">
          <h3 className="text-body-md-bold text-foreground mb-md flex items-center gap-sm">
            <MapPin className="size-4 text-warning" />
            {t('sessions.insights.locations', 'Distribución por ubicación')}
          </h3>
          {admin.locations.length > 0 ? (
            <ul className="space-y-sm flex-1">
              {admin.locations.map((slice) => (
                <li key={slice.location || 'unknown'} className="flex items-center justify-between text-body-md">
                  <span className="text-on-surface-deep truncate">
                    {slice.location || t('sessions.insights.locationUnknown', 'Desconocida')}
                  </span>
                  <span className="text-data-mono font-data-mono text-body-md-bold text-foreground ml-sm">
                    {slice.percent}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-md text-on-surface-deep py-lg text-center flex-1">
              {t('sessions.insights.locationsEmpty', 'Sin datos de ubicación.')}
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={admin.confirmRevokeAll}
        title={t('sessions.revokeAllTitle', 'Revocar todas las sesiones')}
        description={t(
          'sessions.revokeAllDescription',
          'Se cerrarán todas las sesiones activas del sistema. Los usuarios tendrán que iniciar sesión nuevamente.',
        )}
        confirmLabel={t('sessions.revokeAllConfirm', 'Revocar todas')}
        loading={admin.isRevokingAll}
        onConfirm={() => void admin.handleRevokeAll()}
        onOpenChange={admin.setConfirmRevokeAll}
      />
    </div>
  );
}

interface SessionRowProps {
  session: UserSession;
  isRevoking: boolean;
  onRevoke: () => void;
}

/** One row of the sessions grid — extracted so the page body stays readable. */
function SessionRow({ session, isRevoking, onRevoke }: SessionRowProps) {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string };

  const deviceKey = getSessionDeviceKey(session);
  const DeviceIcon = DEVICE_ICONS[deviceKey];
  const statusKey = getSessionStatusKey(session);
  const badge = STATUS_BADGE[statusKey];
  const truncatedAgent = truncateUserAgent(session.user_agent);

  return (
    <tr className="hover:bg-surface-muted transition-colors duration-150">
      <td className="px-md py-3 whitespace-nowrap">
        <div className="flex items-center gap-sm">
          <Avatar className="inline-flex size-8 overflow-hidden rounded-full">
            {session.user?.avatar_url && <AvatarImage className="object-cover" src={session.user.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-body-sm-bold">
              {getSessionAvatarInitial(session)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-body-md-bold text-foreground">
              {getSessionDisplayName(session)}
            </span>
            {getSessionDisplayEmail(session) && (
              <span className="text-data-mono font-data-mono text-xs text-on-surface-deep">
                {getSessionDisplayEmail(session)}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-md py-3 whitespace-nowrap">
        <span className="text-data-mono font-data-mono text-body-md text-on-surface-deep">
          {session.ip_address || t('sessions.ip.unknown', 'Desconocida')}
        </span>
      </td>
      <td className="px-md py-3 whitespace-nowrap">
        <div className="flex items-center gap-sm">
          <DeviceIcon className="size-4 text-outline shrink-0" />
          <div className="flex flex-col">
            <span className="text-body-md text-on-surface-deep">
              {t(`sessions.device.${deviceKey}`, session.device_type || 'unknown')}
            </span>
            {truncatedAgent && (
              <span className="text-xs text-on-surface-deep opacity-60" title={session.user_agent}>
                {truncatedAgent}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-md py-3 whitespace-nowrap">
        <span className="text-body-md text-on-surface-deep">
          {session.location_info || t('sessions.location.unknown', 'Ubicación desconocida')}
        </span>
      </td>
      <td className="px-md py-3 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-data-mono font-data-mono text-body-sm text-foreground">
            {session.last_activity ? new Date(session.last_activity).toLocaleString() : t('sessions.activity.recently', 'Recientemente')}
          </span>
          {session.expires_at && (
            <span className="text-xs text-on-surface-deep opacity-60">
              {t('sessions.table.expires', 'Expira')}:{' '}
              <span className="font-data-mono">{new Date(session.expires_at).toLocaleDateString()}</span>
            </span>
          )}
        </div>
      </td>
      <td className="px-md py-3 whitespace-nowrap">
        <div className="flex flex-col gap-xs items-start">
          <span className={`inline-flex items-center gap-xs px-sm py-1 rounded-full text-body-sm-bold uppercase ${badge.className}`}>
            {t(badge.key)}
          </span>
          {session.is_anomaly && (
            <span className="inline-flex items-center gap-xs px-xs py-0.5 rounded-full text-xs font-bold bg-error/10 text-error uppercase">
              <AlertTriangle className="size-3" />
              {t('sessions.status.badge.anomaly', 'Anomalía')}
            </span>
          )}
        </div>
      </td>
      <td className="px-md py-3 whitespace-nowrap text-right">
        <Button
          variant="secondary"
          size="sm"
          disabled={session.is_active === false || isRevoking}
          loading={isRevoking}
          onClick={onRevoke}
          className="text-error hover:bg-error/5"
        >
          {t('sessions.revoke', 'Revocar')}
        </Button>
      </td>
    </tr>
  );
}
