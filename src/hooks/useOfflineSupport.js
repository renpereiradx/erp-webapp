/**
 * useOfflineSupport - Hook para gestión de estado offline
 * Características:
 * - Snapshot local de reservas críticas (hoy + próximos 7 días)
 * - Detección automática de estado online/offline
 * - Hidratación desde storage al reconectar
 * - Merge inteligente de datos al volver online
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { telemetry } from '@/utils/telemetry';

const STORAGE_KEY = 'reservations.offline.snapshot';
const CRITICAL_DAYS_AHEAD = 7;

export function useOfflineSupport({ 
  onlineData = [], 
  onRehydrate, 
  enabled = true 
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineSnapshot, setOfflineSnapshot] = useState(null);
  const [lastSnapshotTime, setLastSnapshotTime] = useState(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const wasOfflineRef = useRef(false);

  // Detectar cambios de conectividad
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      const wasOffline = !isOnline;
      setIsOnline(true);
      
      if (wasOffline && wasOfflineRef.current) {
        telemetry.record('offline.reconnected', { 
          wasOfflineDuration: Date.now() - (lastSnapshotTime || Date.now()),
          hasSnapshot: !!offlineSnapshot 
        });
        
        // Auto-hidratación al reconectar
        if (offlineSnapshot && onRehydrate) {
          handleHydration();
        }
      }
      wasOfflineRef.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      telemetry.record('offline.detected', { 
        hasSnapshot: !!offlineSnapshot,
        dataItemsCount: onlineData?.length || 0 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, isOnline, offlineSnapshot, lastSnapshotTime, onlineData?.length, onRehydrate]);

  // Crear snapshot de datos críticos
  const createSnapshot = useCallback((data = onlineData) => {
    if (!enabled || !data?.length) return null;

    const now = new Date();
    const criticalEndDate = new Date(now);
    criticalEndDate.setDate(now.getDate() + CRITICAL_DAYS_AHEAD);

    // Filtrar reservas críticas (hoy + próximos 7 días)
    const criticalReservations = data.filter(reservation => {
      if (!reservation.scheduled_date) return false;
      const reservationDate = new Date(reservation.scheduled_date);
      return reservationDate >= now && reservationDate <= criticalEndDate;
    });

    const snapshot = {
      timestamp: Date.now(),
      data: criticalReservations,
      criticalDaysAhead: CRITICAL_DAYS_AHEAD,
      totalOriginalItems: data.length,
      criticalItemsCount: criticalReservations.length
    };

    // Persistir en localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      setOfflineSnapshot(snapshot);
      setLastSnapshotTime(snapshot.timestamp);
      
      telemetry.record('offline.snapshot.created', {
        totalItems: data.length,
        criticalItems: criticalReservations.length,
        daysAhead: CRITICAL_DAYS_AHEAD
      });

      return snapshot;
    } catch (error) {
      telemetry.record('offline.snapshot.error', { 
        message: error.message,
        itemsCount: criticalReservations.length 
      });
      return null;
    }
  }, [enabled, onlineData]);

  // Cargar snapshot desde storage
  const loadSnapshot = useCallback(() => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const snapshot = JSON.parse(stored);
      const age = Date.now() - snapshot.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      if (age > maxAge) {
        localStorage.removeItem(STORAGE_KEY);
        telemetry.record('offline.snapshot.expired', { ageHours: age / (60 * 60 * 1000) });
        return null;
      }

      setOfflineSnapshot(snapshot);
      setLastSnapshotTime(snapshot.timestamp);
      
      telemetry.record('offline.snapshot.loaded', {
        ageMinutes: age / (60 * 1000),
        itemsCount: snapshot.criticalItemsCount
      });

      return snapshot;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      telemetry.record('offline.snapshot.load_error', { message: error.message });
      return null;
    }
  }, [enabled]);

  // Hidratación inteligente al reconectar
  const handleHydration = useCallback(async () => {
    if (!offlineSnapshot || !onRehydrate || isHydrating) return;

    setIsHydrating(true);
    const t = telemetry.startTimer('offline.hydration');

    try {
      const result = await onRehydrate(offlineSnapshot.data);
      const ms = telemetry.endTimer(t, { 
        snapshotItems: offlineSnapshot.criticalItemsCount,
        mergedItems: result?.mergedCount || 0 
      });
      
      telemetry.record('offline.hydration.success', { 
        ms,
        snapshotAge: Date.now() - offlineSnapshot.timestamp,
        itemsRestored: result?.mergedCount || offlineSnapshot.criticalItemsCount
      });

      // Limpiar snapshot después de hidratación exitosa
      localStorage.removeItem(STORAGE_KEY);
      setOfflineSnapshot(null);
      setLastSnapshotTime(null);

    } catch (error) {
      telemetry.endTimer(t);
      telemetry.record('offline.hydration.error', { 
        message: error.message,
        snapshotItems: offlineSnapshot.criticalItemsCount 
      });
    } finally {
      setIsHydrating(false);
    }
  }, [offlineSnapshot, onRehydrate, isHydrating]);

  // Forzar retry de conexión
  const forceRetry = useCallback(async () => {
    telemetry.record('offline.retry.manual');
    
    // Simular revalidación forzada
    if (onRehydrate && offlineSnapshot) {
      await handleHydration();
    }
    
    // Disparar evento de reconexión si estamos online
    if (navigator.onLine && !isOnline) {
      setIsOnline(true);
    }
  }, [onRehydrate, offlineSnapshot, handleHydration, isOnline]);

  // Auto-crear snapshot cuando hay datos nuevos online
  useEffect(() => {
    if (enabled && isOnline && onlineData?.length && !isHydrating) {
      createSnapshot(onlineData);
    }
  }, [enabled, isOnline, onlineData, createSnapshot, isHydrating]);

  // Cargar snapshot al montar
  useEffect(() => {
    if (enabled) {
      loadSnapshot();
    }
  }, [enabled, loadSnapshot]);

  // Datos para mostrar (online o fallback offline)
  const displayData = isOnline ? onlineData : (offlineSnapshot?.data || []);
  
  const snapshotAge = offlineSnapshot ? Date.now() - offlineSnapshot.timestamp : null;
  const isStale = snapshotAge ? snapshotAge > (2 * 60 * 60 * 1000) : false; // 2 horas

  return {
    // Estado
    isOnline,
    isOffline: !isOnline,
    hasOfflineData: !!offlineSnapshot,
    isHydrating,
    displayData,
    
    // Metadata
    snapshotAge,
    isStale,
    criticalItemsCount: offlineSnapshot?.criticalItemsCount || 0,
    lastSnapshotTime,
    
    // Acciones
    createSnapshot,
    loadSnapshot,
    forceRetry,
    handleHydration,
    
    // Helpers
    getSnapshotInfo: () => ({
      hasSnapshot: !!offlineSnapshot,
      age: snapshotAge,
      isStale,
      itemsCount: offlineSnapshot?.criticalItemsCount || 0,
      daysAhead: CRITICAL_DAYS_AHEAD
    })
  };
}

export default useOfflineSupport;
