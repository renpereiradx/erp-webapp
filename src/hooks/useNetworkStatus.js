/**
 * Hook para detectar estado de conectividad de red
 * Integrado con store de reservas para manejo offline automático
 */

import { useEffect } from 'react';
import useReservationStore from '../store/useReservationStore';

export const useNetworkStatus = () => {
  const { setOfflineStatus, isOffline, lastOfflineAt, lastOnlineAt } = useReservationStore(state => ({
    setOfflineStatus: state.setOfflineStatus,
    isOffline: state.isOffline,
    lastOfflineAt: state.lastOfflineAt,
    lastOnlineAt: state.lastOnlineAt
  }));
  
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Network: Back online - triggering reconnection sequence');
      setOfflineStatus(false);
    };
    
    const handleOffline = () => {
      console.log('🔴 Network: Gone offline - activating offline mode');
      setOfflineStatus(true);
    };
    
    // Registrar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Establecer estado inicial basado en navigator.onLine
    const initialOfflineState = !navigator.onLine;
    if (initialOfflineState !== isOffline) {
      setOfflineStatus(initialOfflineState);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus, isOffline]);
  
  return {
    isOffline,
    lastOfflineAt,
    lastOnlineAt,
    // Helper para determinar si estamos en transición reciente
    isRecentlyOffline: () => {
      if (!lastOfflineAt) return false;
      return (Date.now() - lastOfflineAt) < 30000; // Últimos 30 segundos
    },
    // Helper para duración offline actual
    getOfflineDuration: () => {
      if (!isOffline || !lastOfflineAt) return 0;
      return Date.now() - lastOfflineAt;
    }
  };
};
