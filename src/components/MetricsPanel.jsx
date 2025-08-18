import React from 'react';
import useProductStore from '@/store/useProductStore';
import { useI18n } from '@/lib/i18n';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function MetricsPanel() {
  const { t } = useI18n();
  const [{ hits, misses, ratio }, setNothing] = React.useState({ hits: 0, misses: 0, ratio: 0 });
  const cacheStats = useProductStore((s) => s.selectors.selectCacheStats(s));
  const circuit = useProductStore((s) => s.circuit);
  const circuitOpen = useProductStore((s) => s.circuitOpen);

  React.useEffect(() => {
    setNothing({ hits: cacheStats.hits, misses: cacheStats.misses, ratio: cacheStats.ratio });
  }, [cacheStats.hits, cacheStats.misses, cacheStats.ratio]);

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{t('metrics.panel.title') || 'Metrics'}</div>
          <div className="text-sm font-medium">{t('metrics.cache.label') || 'Cache'}</div>
        </div>
        <div className="text-right text-xs">
          <div>{t('metrics.cache_hits') || 'Hits'}: {cacheStats.hits}</div>
          <div>{t('metrics.cache_misses') || 'Misses'}: {cacheStats.misses}</div>
          <div>{t('metrics.cache_ratio') || 'Hit ratio'}: {(cacheStats.ratio * 100).toFixed(0)}%</div>
        </div>
      </div>
      <div className="h-px my-2 bg-slate-200 dark:bg-slate-700" />
      <div className="flex items-center justify-between text-xs">
        <div>{t('metrics.circuit.label') || 'Circuit'}</div>
        <div>
          <div>{t('metrics.circuit.failures') || 'Failures'}: {circuit?.failures ?? 0}</div>
          <div>{t('metrics.circuit.open') || 'Open'}: {circuitOpen ? t('metrics.circuit.open_until', { when: new Date(circuit?.openUntil).toLocaleTimeString() }) : (t('metrics.circuit.closed') || 'Closed')}</div>
        </div>
      </div>
    </div>
  );
}
