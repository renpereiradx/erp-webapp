/**
 * Hook para sincronización offline y manejo de snapshots
 * Proporciona funciones para forzar sync y verificar datos offline
 */

import { useCallback, useMemo } from 'react';
import useReservationStore from '../store/useReservationStore';

export const useOfflineSync = () => {
  const store = useReservationStore();
  
  const forceSync = useCallback(async () => {
    console.log('🔄 Forcing offline sync...');
    
    if (store.isOffline) {
      console.log('⚠️ Still offline - cannot force sync');
      return false;
    }
    
    try {
      await store.hydrateAndRefresh();
      console.log('✅ Offline sync completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Offline sync failed:', error);
      return false;
    }
  }, [store]);
  
  const hasOfflineData = useMemo(() => {
    return store.lastOfflineSnapshot !== null;
  }, [store.lastOfflineSnapshot]);
  
  const getSnapshotAge = useCallback(() => {
    if (!store.lastOfflineSnapshot?.timestamp) return null;
    return Date.now() - store.lastOfflineSnapshot.timestamp;
  }, [store.lastOfflineSnapshot]);
  
  const isSnapshotStale = useCallback(() => {
    const age = getSnapshotAge();
    if (!age) return false;
    return age > (24 * 60 * 60 * 1000); // 24 horas considerado stale
  }, [getSnapshotAge]);
  
  return {
    // Acciones principales
    forceSync,
    createSnapshot: store.createCriticalSnapshot,
    hydrateFromSnapshot: store.hydrateFromOfflineSnapshot,
    
    // Estado del snapshot
    hasOfflineData,
    lastSnapshot: store.lastOfflineSnapshot,
    isSnapshotStale: isSnapshotStale(),
    snapshotAge: getSnapshotAge(),
    
    // Estado de conectividad
    isOffline: store.isOffline,
    offlineBannerShown: store.offlineBannerShown,
    
    // Helpers para UI
    getSnapshotInfo: () => {
      if (!store.lastOfflineSnapshot) return null;
      
      return {
        reservationsCount: store.lastOfflineSnapshot.reservations?.length || 0,
        timestamp: store.lastOfflineSnapshot.timestamp,
        age: getSnapshotAge(),
        isStale: isSnapshotStale(),
        searchTerm: store.lastOfflineSnapshot.searchTerm,
        hasFilters: Object.keys(store.lastOfflineSnapshot.filters || {}).length > 0
      };
    }
  };
};
