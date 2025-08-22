/**
 * ReservationMetricsPanel - Panel de métricas específico para reservas
 * Reutiliza el patrón establecido de MetricsPanel con métricas específicas de reservas
 */
import React from 'react';
import useReservationStore from '@/store/useReservationStore';
import { useI18n } from '@/lib/i18n';
import { AlertTriangle, Activity, Database, Wifi, WifiOff, Timer, BarChart } from 'lucide-react';

const ReservationMetricsPanel = () => {
  const { t } = useI18n();

  // Selectores del store
  const cacheStats = useReservationStore((s) => s.selectors.selectCacheStats(s));
  const circuitStats = useReservationStore((s) => s.selectors.selectCircuitStats(s));
  const currentCacheMeta = useReservationStore((s) => s.selectors.selectCurrentCacheMeta(s));
  const circuitOpenPct = useReservationStore((s) => s.selectors.selectCircuitOpenPctLastHr(s));
  
  // Estado del sistema
  const isOffline = useReservationStore((s) => s.isOffline);
  const hasStaleData = useReservationStore((s) => s.hasStaleData);
  const staleDataCount = useReservationStore((s) => s.staleDataCount);
  const lastOfflineSnapshot = useReservationStore((s) => s.lastOfflineSnapshot);
  const autoRefetchOnReconnect = useReservationStore((s) => s.autoRefetchOnReconnect);
  
  // Estadísticas de reservas
  const stats = useReservationStore((s) => s.stats);
  const reservations = useReservationStore((s) => s.reservations);
  
  // Acciones
  const resetCircuitBreaker = useReservationStore((s) => s.resetCircuitBreaker);
  const setAutoRefetchOnReconnect = useReservationStore((s) => s.setAutoRefetchOnReconnect);
  const forceRevalidateOffline = useReservationStore((s) => s.forceRevalidateOffline);

  // Calcular métricas derivadas
  const confirmationRate = stats.total > 0 ? ((stats.confirmed / stats.total) * 100) : 0;
  const cancellationRate = stats.total > 0 ? ((stats.cancelled / stats.total) * 100) : 0;
  const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100) : 0;

  // Determinar estado de cache actual
  const cacheAge = currentCacheMeta.ts ? Date.now() - currentCacheMeta.ts : null;
  const isStale = cacheAge && cacheAge > currentCacheMeta.halfTTL;

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('reservations.metrics.title') || 'Métricas de Reservas'}
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* Cache Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('reservations.metrics.cache.title') || 'Cache'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>{t('reservations.metrics.cache.hits') || 'Hits'}:</span>
              <span className="font-mono" data-testid="cache-hits">{cacheStats.hits}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.cache.misses') || 'Misses'}:</span>
              <span className="font-mono" data-testid="cache-misses">{cacheStats.misses}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.cache.ratio') || 'Hit Ratio'}:</span>
              <span className={`font-mono ${cacheStats.ratio > 0.8 ? 'text-green-600' : cacheStats.ratio > 0.5 ? 'text-yellow-600' : 'text-red-600'}`} 
                    data-testid="cache-ratio">
                {(cacheStats.ratio * 100).toFixed(1)}%
              </span>
            </div>
            {isStale && (
              <div className="flex items-center gap-1 text-yellow-600 text-xs">
                <Timer className="w-3 h-3" />
                <span>{t('reservations.metrics.cache.stale') || 'Datos antiguos'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Circuit Breaker Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className={`w-3 h-3 ${circuitStats.open ? 'text-red-600' : 'text-green-600'}`} />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('reservations.metrics.circuit.title') || 'Circuit Breaker'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>{t('reservations.metrics.circuit.status') || 'Estado'}:</span>
              <span className={`font-mono ${circuitStats.open ? 'text-red-600' : 'text-green-600'}`} 
                    data-testid="circuit-status">
                {circuitStats.open ? (t('reservations.metrics.circuit.open') || 'Abierto') : (t('reservations.metrics.circuit.closed') || 'Cerrado')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.circuit.failures') || 'Fallos'}:</span>
              <span className="font-mono" data-testid="circuit-failures">{circuitStats.failures}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.circuit.open_count') || 'Aperturas'}:</span>
              <span className="font-mono" data-testid="circuit-open-count">{circuitStats.openCount}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.circuit.open_pct') || '% Abierto 1h'}:</span>
              <span className="font-mono" data-testid="circuit-open-pct">{circuitOpenPct.toFixed(1)}%</span>
            </div>
            {circuitStats.open && (
              <button
                onClick={resetCircuitBreaker}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded mt-1"
                data-testid="reset-circuit-button"
              >
                {t('reservations.metrics.circuit.reset') || 'Reset Manual'}
              </button>
            )}
          </div>
        </div>

        {/* Offline & Connectivity Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isOffline ? (
              <WifiOff className="w-3 h-3 text-red-600" />
            ) : (
              <Wifi className="w-3 h-3 text-green-600" />
            )}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('reservations.metrics.offline.title') || 'Conectividad'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>{t('reservations.metrics.offline.status') || 'Estado'}:</span>
              <span className={`font-mono ${isOffline ? 'text-red-600' : 'text-green-600'}`} 
                    data-testid="offline-status">
                {isOffline ? (t('reservations.metrics.offline.offline') || 'Offline') : (t('reservations.metrics.offline.online') || 'Online')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.offline.stale_data') || 'Datos antiguos'}:</span>
              <span className="font-mono" data-testid="stale-data-count">{staleDataCount}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.offline.snapshot') || 'Snapshot'}:</span>
              <span className="font-mono" data-testid="offline-snapshot">
                {lastOfflineSnapshot ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={autoRefetchOnReconnect}
                  onChange={(e) => setAutoRefetchOnReconnect(e.target.checked)}
                  className="w-3 h-3"
                  data-testid="auto-refetch-checkbox"
                />
                <span>{t('reservations.metrics.offline.auto_refetch') || 'Auto-refetch'}</span>
              </label>
            </div>
            {isOffline && (
              <button
                onClick={forceRevalidateOffline}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded mt-1"
                data-testid="force-revalidate-button"
              >
                {t('reservations.metrics.offline.retry') || 'Reintentar'}
              </button>
            )}
          </div>
        </div>

        {/* Reservation Business Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('reservations.metrics.business.title') || 'Estadísticas'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>{t('reservations.metrics.business.total') || 'Total'}:</span>
              <span className="font-mono" data-testid="stats-total">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.business.today') || 'Hoy'}:</span>
              <span className="font-mono" data-testid="stats-today">{stats.today}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.business.pending') || 'Pendientes'}:</span>
              <span className="font-mono text-yellow-600" data-testid="stats-pending">{stats.pending}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.business.confirmed') || 'Confirmadas'}:</span>
              <span className="font-mono text-green-600" data-testid="stats-confirmed">{stats.confirmed}</span>
            </div>
          </div>
        </div>

        {/* Business Rates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('reservations.metrics.rates.title') || 'Tasas'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>{t('reservations.metrics.rates.confirmation') || 'Confirmación'}:</span>
              <span className={`font-mono ${confirmationRate > 80 ? 'text-green-600' : confirmationRate > 50 ? 'text-yellow-600' : 'text-red-600'}`} 
                    data-testid="confirmation-rate">
                {confirmationRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.rates.cancellation') || 'Cancelación'}:</span>
              <span className={`font-mono ${cancellationRate > 20 ? 'text-red-600' : cancellationRate > 10 ? 'text-yellow-600' : 'text-green-600'}`} 
                    data-testid="cancellation-rate">
                {cancellationRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.rates.completion') || 'Completión'}:</span>
              <span className={`font-mono ${completionRate > 70 ? 'text-green-600' : completionRate > 40 ? 'text-yellow-600' : 'text-red-600'}`} 
                    data-testid="completion-rate">
                {completionRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Current Load */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('reservations.metrics.load.title') || 'Carga Actual'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>{t('reservations.metrics.load.loaded') || 'Cargadas'}:</span>
              <span className="font-mono" data-testid="loaded-reservations">{reservations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reservations.metrics.load.cache_entries') || 'Entradas cache'}:</span>
              <span className="font-mono" data-testid="cache-entries">
                {Object.keys(useReservationStore.getState().pageCache).length}
              </span>
            </div>
            {hasStaleData && (
              <div className="flex items-center gap-1 text-yellow-600 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>{t('reservations.metrics.load.stale_warning') || 'Hay datos antiguos'}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReservationMetricsPanel;
