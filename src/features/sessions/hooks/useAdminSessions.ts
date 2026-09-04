/**
 * State and orchestration for the admin sessions dashboard.
 * Fetches all sessions, derives metrics/insights with useMemo and
 * exposes revoke actions with the confirmation flow.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useI18n } from '@/lib/i18n';
import { sessionService } from '@/services/sessionService';
import type { UserSession } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { activityByHour, hasActivityData, locationDistribution } from '@/domain/sessions/sessionInsights';
import { filterSessions } from '@/domain/sessions/sessionFilters';
import { computeSessionMetrics } from '@/domain/sessions/sessionMetrics';
import { withCurrentUserFallback } from '@/domain/sessions/sessionDisplay';

import type { SessionStatusFilter, TFn } from '../types';

function isForbiddenError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 403) return true;
  const message = err instanceof Error ? err.message : String(err ?? '');
  return message.includes('403') || message.includes('Forbidden');
}

export function useAdminSessions() {
  const { t } = useI18n() as unknown as { t: TFn };
  const { user: currentUser } = useAuth();

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SessionStatusFilter>('all');

  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [revokingId, setRevokingId] = useState<string | number | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const response = await sessionService.getAllActiveSessions();
      setSessions(withCurrentUserFallback(response.data ?? [], currentUser));
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
        toast.error(t('sessions.error.forbidden.toast', 'No tienes permisos para ver esta información administrativa'));
      } else {
        const message = err instanceof Error ? err.message : t('sessions.error.title', 'Error al cargar sesiones');
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [t, currentUser]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const metrics = useMemo(() => computeSessionMetrics(sessions), [sessions]);

  const filteredSessions = useMemo(
    () => filterSessions(sessions, { search, status }),
    [sessions, search, status],
  );

  const activity = useMemo(() => activityByHour(sessions), [sessions]);
  const hasActivity = useMemo(() => hasActivityData(activity), [activity]);
  const locations = useMemo(() => locationDistribution(sessions), [sessions]);

  const handleRevoke = useCallback(
    async (id: string | number) => {
      setRevokingId(id);
      try {
        await sessionService.adminRevokeSession(id);
        toast.success(t('sessions.revokeSuccess', 'Sesión revocada correctamente'));
        await fetchSessions();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('sessions.revokeError', 'Error al revocar la sesión'));
      } finally {
        setRevokingId(null);
      }
    },
    [t, fetchSessions],
  );

  const handleRevokeAll = useCallback(async () => {
    setIsRevokingAll(true);
    try {
      const response = await sessionService.logoutAllSessions();
      toast.success(
        t('sessions.revokeAllSuccess', '{{count}} sesión(es) cerrada(s) correctamente', {
          count: response.sessions_revoked ?? 0,
        }),
      );
      setConfirmRevokeAll(false);
      await fetchSessions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('sessions.revokeError', 'Error al revocar la sesión'),
      );
    } finally {
      setIsRevokingAll(false);
    }
  }, [t, fetchSessions]);

  return {
    // data
    sessions,
    loading,
    error,
    forbidden,
    // derived
    metrics,
    filteredSessions,
    activity,
    hasActivity,
    locations,
    // toolbar
    search,
    setSearch,
    status,
    setStatus,
    // actions
    handleRevoke,
    revokingId,
    confirmRevokeAll,
    setConfirmRevokeAll,
    isRevokingAll,
    handleRevokeAll,
    refetch: fetchSessions,
  };
}
