import React from 'react';
import useSupplierStore from '@/store/useSupplierStore';
import { useI18n } from '@/lib/i18n';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { telemetry } from '@/utils/telemetry';

/**
 * Mini panel de métricas para Suppliers (Lote 2) extendido
 */
export default function SuppliersMetricsPanel() {
  const { t } = useI18n();
  const [enabled] = useFeatureFlag('suppliersMetricsPanel', true);

  // Avoid object-returning selectors to prevent infinite update loops (React 19 useSyncExternalStore strictness)
  const cacheHits = useSupplierStore(s => s.cacheHits);
  const cacheMisses = useSupplierStore(s => s.cacheMisses);
  const retryCount = useSupplierStore(s => s.retryCount);
  const failures = useSupplierStore(s => s.circuit.failures);
  const circuitOpen = useSupplierStore(s => s.circuitOpen);
  const openUntil = useSupplierStore(s => s.circuit.openUntil);
  const openCount = useSupplierStore(s => s.circuitOpenCount);
  const totalOpenDuration = useSupplierStore(s => s.circuitTotalOpenDurationMs);
  const lastOpenedAt = useSupplierStore(s => s.circuitLastOpenedAt);
  const autoRefetchOnReconnect = useSupplierStore(s => s.autoRefetchOnReconnect);
  const setAutoRef = useSupplierStore(s => s.setAutoRefetchOnReconnect);
  const lastQuery = useSupplierStore(s => s.lastQuery);
  const forceRefetch = useSupplierStore(s => s.forceRefetch);
  const pageCacheTTL = useSupplierStore(s => s.pageCacheTTL);
  const entryTs = useSupplierStore(s => {
    const { page, search } = s.lastQuery || { page: 1, search: '' };
    const key = `${search || '__'}|${page}`;
    return s.pageCache[key]?.ts || null;
  });
  const circuitPctLastHr = useSupplierStore(s => s.selectors.selectCircuitOpenPctLastHr(s));

  const cacheRatio = React.useMemo(() => {
    const total = cacheHits + cacheMisses;
    return total === 0 ? 0 : cacheHits / total;
  }, [cacheHits, cacheMisses]);

  // Derived circuit stats
  const avgOpenDurationMs = openCount === 0 ? 0 : Math.round(totalOpenDuration / openCount);

  // Local ticking for countdown + cache age
  const [, forceTick] = React.useState(0);
  React.useEffect(() => {
    if (!circuitOpen && !entryTs) return undefined;
    const id = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [circuitOpen, entryTs]);

  const timeRemainingMs = circuitOpen ? Math.max(0, openUntil - Date.now()) : 0;
  const cacheAgeMs = entryTs ? Date.now() - entryTs : null;
  const cacheStale = cacheAgeMs != null ? cacheAgeMs > pageCacheTTL / 2 : false;

  const retryRate = React.useMemo(() => {
    const ops = cacheHits + cacheMisses || 0;
    if (!ops) return 0;
    return Math.min(1, retryCount / ops);
  }, [retryCount, cacheHits, cacheMisses]);

  const [announce, setAnnounce] = React.useState('');
  const prevOpenRef = React.useRef(false);
  const hasOpenedOnceRef = React.useRef(false);
  React.useEffect(() => {
    const prev = prevOpenRef.current;
    if (!prev && circuitOpen) {
      const first = !hasOpenedOnceRef.current;
      hasOpenedOnceRef.current = true;
      const key = first ? 'metrics.circuit.opened' : 'metrics.circuit.reopened';
      const defaultMsg = first ? 'Circuit opened' : 'Circuit reopened';
      const msg = t(key) || defaultMsg;
      setAnnounce(msg);
      try { telemetry.record?.(first ? 'feature.suppliers.circuit.panel.opened' : 'feature.suppliers.circuit.panel.reopened'); } catch (_) {}
    }
    if (prev && !circuitOpen) {
      const msgClose = t('metrics.circuit.closed_announce') || 'Circuit closed';
      setAnnounce(msgClose);
      try { telemetry.record?.('feature.suppliers.circuit.panel.closed'); } catch (_) {}
    }
    prevOpenRef.current = circuitOpen;
  }, [circuitOpen, t]);

  const resetCache = () => {
    try {
      useSupplierStore.setState(s => ({ pageCache: {}, cacheHits: 0, cacheMisses: 0 }));
      telemetry.record?.('feature.suppliers.cache.reset');
    } catch {}
  };
  const resetCircuit = () => {
    try { useSupplierStore.getState()._closeCircuit('manual-reset'); telemetry.record?.('feature.suppliers.circuit.reset'); } catch {}
  };
  const resetRetries = () => {
    try { useSupplierStore.setState({ retryCount: 0 }); telemetry.record?.('feature.suppliers.retries.reset'); } catch {}
  };

  if (!enabled) return null;

  return (
    <div data-testid="suppliers-metrics-panel" role="group" aria-label={t('metrics.panel.title') || 'Metrics'} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm text-xs space-y-2" aria-describedby="suppliers-metrics-desc">
      {/* Offline & stale indicators */}
      {cacheAgeMs != null && (
        <div className="text-[11px] flex justify-between items-center px-2 py-1 rounded bg-slate-200/60 dark:bg-slate-700/50" role="status" aria-live="polite">
          <span>{t('metrics.cache_age') || 'Cache age'}: {Math.round(cacheAgeMs / 1000)}s</span>
          {cacheStale && <span className="text-amber-600 dark:text-amber-300 font-medium">{t('metrics.cache_stale') || 'STALE'}</span>}
        </div>
      )}
      {circuitOpen && (
        <div className="text-[11px] px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium flex justify-between" role="status" aria-live="polite">
          <span>{t('metrics.circuit.open_banner') || 'Circuit open (failures threshold reached)'}</span>
          <span>{Math.ceil(timeRemainingMs / 1000)}s</span>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div className="font-medium text-[11px] tracking-wide uppercase text-muted-foreground">{t('metrics.panel.title') || 'Metrics'}</div>
        <div className="text-right space-y-0.5">
          <div>{t('metrics.cache_hits') || 'Hits'}: {cacheHits}</div>
          <div>{t('metrics.cache_misses') || 'Misses'}: {cacheMisses}</div>
          <div>{t('metrics.cache_ratio') || 'Hit ratio'}: {(cacheRatio * 100).toFixed(0)}%</div>
          <div>{t('metrics.retry_rate') || 'Retry rate'}: {(retryRate * 100).toFixed(0)}%</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <div className="font-medium text-[11px]">{t('metrics.circuit.label') || 'Circuit'}</div>
          <div>{t('metrics.circuit.failures') || 'Failures'}: {failures}</div>
          <div>{t('metrics.circuit.open_count') || 'Opens'}: {openCount}</div>
          <div>{t('metrics.circuit.avg_open') || 'Avg open'}: {avgOpenDurationMs}ms</div>
          <div>{t('metrics.circuit.open_pct_hr') || '% Open 1h'}: {(circuitPctLastHr * 100).toFixed(1)}%</div>
        </div>
        <div className="space-y-0.5 text-right">
          <div className="font-medium text-[11px]">{t('metrics.status') || 'Status'}</div>
          <div>{circuitOpen ? (t('metrics.circuit.open') || 'Open') : (t('metrics.circuit.closed') || 'Closed')}</div>
          {circuitOpen && <div>{t('metrics.circuit.remaining') || 'Remaining'}: {Math.ceil(timeRemainingMs / 1000)}s</div>}
          <div>{t('metrics.retries') || 'Retries'}: {retryCount}</div>
        </div>
      </div>
      <div className="flex gap-2 pt-1 flex-wrap">
        <button type="button" onClick={resetCache} className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition" data-testid="suppliers-metrics-reset-cache">{t('metrics.reset_cache') || 'Reset Cache'}</button>
        <button type="button" onClick={resetCircuit} className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition" data-testid="suppliers-metrics-reset-circuit">{t('metrics.reset_circuit') || 'Reset Circuit'}</button>
        <button type="button" onClick={resetRetries} className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition" data-testid="suppliers-metrics-reset-retries">{t('metrics.reset_retries') || 'Reset Retries'}</button>
        <button type="button" onClick={() => { if (!lastQuery) return; forceRefetch?.(lastQuery.page, lastQuery.pageSize, lastQuery.search); }} className="px-2 py-1 rounded bg-indigo-200 dark:bg-indigo-700 hover:bg-indigo-300 dark:hover:bg-indigo-600 transition" data-testid="suppliers-metrics-force-refetch">{t('metrics.force_refetch') || 'Force Refetch'}</button>
        <label className="inline-flex items-center gap-1 cursor-pointer select-none">
          <input type="checkbox" checked={autoRefetchOnReconnect} onChange={e => setAutoRef(e.target.checked)} data-testid="suppliers-metrics-auto-refetch-toggle" />
          <span>{t('metrics.auto_refetch') || 'Auto Reconnect Refetch'}</span>
        </label>
      </div>
      <div aria-live="polite" className="sr-only" data-testid="suppliers-circuit-live-region">{announce}</div>
      <div id="suppliers-metrics-desc" className="sr-only">
        {t('metrics.panel.desc') || 'Runtime metrics: cache efficiency, retries and circuit breaker state for suppliers.'}
      </div>
    </div>
  );
}
