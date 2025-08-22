/**
 * Banner offline persistente con opción de reintentar
 * Se muestra cuando se detecta que la aplicación está offline
 * Integrado con LiveRegion para anuncios accesibles
 */

import React, { useState } from 'react';
import { WifiOff, RefreshCw, Loader2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useReservationStore } from '../../store/useReservationStore';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useTranslation } from '../../lib/i18n';
import { LiveRegion } from '../a11y/LiveRegion';
import { cn } from '../../lib/utils';

const OfflineBanner = ({ className = "" }) => {
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  
  const { 
    isOffline, 
    offlineBannerShown, 
    dismissOfflineBanner,
    forceRevalidateOffline 
  } = useReservationStore(state => ({
    isOffline: state.isOffline,
    offlineBannerShown: state.offlineBannerShown,
    dismissOfflineBanner: state.dismissOfflineBanner,
    forceRevalidateOffline: state.forceRevalidateOffline
  }));
  
  const { hasOfflineData, getSnapshotInfo } = useOfflineSync();
  
  // No mostrar banner si no está offline o si fue explícitamente cerrado
  if (!isOffline || !offlineBannerShown) {
    return null;
  }
  
  const handleRetry = async () => {
    if (retrying) return;
    
    setRetrying(true);
    setLiveMessage(t('reservations.offline.retrying'));
    
    try {
      const success = await forceRevalidateOffline();
      
      if (success) {
        setLiveMessage(t('reservations.offline.retry_success'));
        // Banner se ocultará automáticamente cuando isOffline cambie a false
      } else {
        setLiveMessage(t('reservations.offline.retry_failed'));
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setLiveMessage(t('reservations.offline.retry_failed'));
    } finally {
      setRetrying(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setLiveMessage(''), 3000);
    }
  };
  
  const handleDismiss = () => {
    dismissOfflineBanner();
    setLiveMessage(t('reservations.offline.banner_dismissed'));
    setTimeout(() => setLiveMessage(''), 2000);
  };
  
  const snapshotInfo = getSnapshotInfo();
  
  return (
    <>
      <LiveRegion message={liveMessage} />
      
      <div 
        className={cn(
          "offline-banner",
          "bg-orange-50 border-orange-200 border-l-4 border-l-orange-500",
          "px-4 py-3 mb-4 shadow-sm",
          "dark:bg-orange-950 dark:border-orange-800",
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <WifiOff 
              className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" 
              aria-hidden="true"
            />
            
            <div className="min-w-0 flex-1">
              <div className="font-medium text-orange-800 dark:text-orange-200">
                {t('reservations.offline.title')}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                {hasOfflineData && snapshotInfo ? (
                  t('reservations.offline.with_snapshot', {
                    count: snapshotInfo.reservationsCount,
                    age: Math.round(snapshotInfo.age / (1000 * 60)) // minutos
                  })
                ) : (
                  t('reservations.offline.subtitle')
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={retrying}
              className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700 hover:text-orange-800 dark:bg-orange-900 dark:hover:bg-orange-800 dark:border-orange-700 dark:text-orange-200"
              aria-describedby="retry-description"
            >
              {retrying ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="ml-1">
                {retrying ? t('reservations.offline.retrying') : t('reservations.offline.retry')}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 dark:text-orange-400 dark:hover:text-orange-200 dark:hover:bg-orange-800"
              aria-label={t('reservations.offline.dismiss')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Descripción oculta para screen readers */}
        <div id="retry-description" className="sr-only">
          {t('reservations.offline.retry_description')}
        </div>
      </div>
    </>
  );
};

export default OfflineBanner;
