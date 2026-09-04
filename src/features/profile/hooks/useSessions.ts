import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import sessionService from '@/services/sessionService';
import type { UserSession } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentSessionId } from '@/utils/jwtUtils';
import { withCurrentUserFallback } from '@/domain/sessions/sessionDisplay';

import type { TFn } from '../types';

/** Flags the caller's current session by comparing ids from auth context / JWT / localStorage. */
const markCurrentSession = (sessions: UserSession[], contextSessionId?: string | null): UserSession[] => {
  const jwtSessionId = getCurrentSessionId();
  const fallbackSessionId = localStorage.getItem('sessionId');
  const currentSessionIdStr = contextSessionId || jwtSessionId?.toString() || fallbackSessionId;

  return sessions.map((session) => ({
    ...session,
    is_current:
      currentSessionIdStr != null
        ? String(session.id) === String(currentSessionIdStr)
        : session.is_current ?? false,
  }));
};

export function useSessions(t: TFn) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const { sessionId: contextSessionId, user: currentUser } = useAuth();

  const fetchActiveSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sessionService.getActiveSessions();

      const data = response.data || response;
      if (Array.isArray(data)) {
        setActiveSessions(
          markCurrentSession(withCurrentUserFallback(data, currentUser), contextSessionId),
        );
      }
    } catch (error) {
      console.error('Error fetching sessions', error);
      toast.error(t('profile.errors.sessions_failed', 'Error al cargar las sesiones activas'));
    } finally {
      setLoading(false);
    }
  }, [contextSessionId, currentUser, t]);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  const revokeSession = useCallback(
    async (sessionId: string | number) => {
      try {
        await sessionService.revokeSession(sessionId);
        toast.success(t('profile.sessions.revoke_success', 'Sesión revocada correctamente'));
        fetchActiveSessions();
      } catch (error) {
        toast.error(t('profile.sessions.revoke_error', 'Error al revocar la sesión'));
      }
    },
    [t, fetchActiveSessions],
  );

  /** Executes the revoke-all; the caller is responsible for confirming first. */
  const revokeAllOtherSessions = useCallback(async () => {
    try {
      const response = await sessionService.revokeAllOtherSessions();
      toast.success(
        t('profile.sessions.revoke_all_success', 'Sesiones cerradas correctamente', {
          count: response.revoked_count ?? 0,
        }),
      );
      fetchActiveSessions();
    } catch (error) {
      toast.error(t('profile.sessions.revoke_error', 'Error al revocar las sesiones'));
    }
  }, [t, fetchActiveSessions]);

  return {
    loading,
    activeSessions,
    revokeSession,
    revokeAllOtherSessions,
    fetchActiveSessions,
  };
}
