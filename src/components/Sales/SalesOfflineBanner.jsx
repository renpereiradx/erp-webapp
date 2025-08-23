/**
 * Sales Offline Banner Component
 * Wave 5: Offline capabilities for Sales system
 * 
 * Displays persistent offline banner with retry functionality
 * Integrated with useSalesStore offline state management
 */

import React, { useState } from 'react';
import { WifiOff, RefreshCw, Loader2, X } from 'lucide-react';
import useSalesStore from '@/store/useSalesStore';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const SalesOfflineBanner = ({ className = "" }) => {
  const { t } = useI18n();
  const [retrying, setRetrying] = useState(false);
  
  const { 
    isOffline, 
    offlineBannerShown, 
    setIsOffline,
    forceRefetch,
    lastOfflineSnapshot 
  } = useSalesStore(state => ({
    isOffline: state.isOffline,
    offlineBannerShown: state.offlineBannerShown,
    setIsOffline: state.setIsOffline,
    forceRefetch: state.forceRefetch,
    lastOfflineSnapshot: state.lastOfflineSnapshot
  }));
  
  // No mostrar banner si no está offline o si fue explícitamente cerrado
  if (!isOffline || !offlineBannerShown) {
    return null;
  }
  
  const handleRetry = async () => {
    if (retrying) return;
    
    setRetrying(true);
    
    try {
      // Try to fetch fresh data
      await forceRefetch();
      
      // If successful, we're back online
      setIsOffline(false);
    } catch (error) {
      console.error('Retry failed:', error);
      // Stay offline
    } finally {
      setRetrying(false);
    }
  };
  
  const handleDismiss = () => {
    useSalesStore.setState({ offlineBannerShown: false });
  };
  
  const hasOfflineData = lastOfflineSnapshot !== null;
  const snapshotCount = lastOfflineSnapshot?.salesHistory?.length || 0;
  
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-orange-50 border-b border-orange-200 shadow-sm",
        className
      )}
      role="alert"
      aria-live="polite"
      aria-label={t('sales.offline.banner.title', 'Sales system is offline')}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <WifiOff 
              className="h-5 w-5 text-orange-600 flex-shrink-0" 
              aria-hidden="true" 
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                {t('sales.offline.banner.title', 'Sales system is offline')}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {hasOfflineData 
                  ? t('sales.offline.banner.hasData', 
                      `Showing ${snapshotCount} cached sales records. Some data may be outdated.`)
                  : t('sales.offline.banner.noData', 
                      'Limited functionality available. Connect to internet for full features.')
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className={cn(
                "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md",
                "bg-orange-100 text-orange-800 hover:bg-orange-200",
                "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors duration-200"
              )}
              aria-label={t('sales.offline.banner.retry', 'Retry connection')}
            >
              {retrying ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" aria-hidden="true" />
                  {t('sales.offline.banner.retrying', 'Retrying...')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5" aria-hidden="true" />
                  {t('sales.offline.banner.retry', 'Retry')}
                </>
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className={cn(
                "inline-flex items-center p-1 text-orange-600 hover:text-orange-800",
                "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                "rounded-md transition-colors duration-200"
              )}
              aria-label={t('sales.offline.banner.dismiss', 'Dismiss banner')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOfflineBanner;
