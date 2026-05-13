import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import sessionService from '@/services/sessionService';
import { UserSession } from '@/types';
import { getCurrentSessionId } from '@/utils/jwtUtils';

export function useSessions() {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);

  const fetchActiveSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sessionService.getActiveSessions();
      
      const data = response.data || response;
      if (Array.isArray(data)) {
        // Detectar sesión actual comparando con el session_id del JWT activo
        const currentSessionId = getCurrentSessionId();
        const enrichedSessions = data.map(session => ({
          ...session,
          is_current: currentSessionId !== null
            ? Number(session.id) === currentSessionId
            : session.is_current ?? false
        }));
        setActiveSessions(enrichedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions', error);
      toast.error('Error al cargar las sesiones activas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  const revokeSession = async (sessionId: string | number) => {
    try {
      await sessionService.revokeSession(sessionId);
      toast.success('Sesión revocada exitosamente');
      fetchActiveSessions();
    } catch (error) {
      toast.error('Error al revocar la sesión');
    }
  };

  const revokeAllOtherSessions = async () => {
    if (window.confirm('¿Está seguro de que desea cerrar todas sus otras sesiones activas?')) {
      try {
        const response = await sessionService.revokeAllOtherSessions();
        const count = response.revoked_count ?? 0;
        toast.success(`${count} sesión(es) revocada(s) exitosamente`);
        fetchActiveSessions();
      } catch (error) {
        toast.error('Error al revocar las sesiones');
      }
    }
  };

  return {
    loading,
    activeSessions,
    revokeSession,
    revokeAllOtherSessions,
    fetchActiveSessions
  };
}
