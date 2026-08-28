import React from 'react';
import useProductStore from '@/store/useProductStore';
import { useI18n } from '@/lib/i18n';

export default function MetricsPanel() {
  const { t } = useI18n();
  const cacheStats = useProductStore((s) => s.selectors.selectCacheStats(s));
  const circuit = useProductStore((s) => s.circuit);
  const circuitOpen = useProductStore((s) => s.circuitOpen);

  return (
    <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground text-xs">{t('metrics.panel.title') || 'Metrics'}</div>
          <div className="text-lg font-semibold text-foreground text-sm font-medium">{t('metrics.cache.label') || 'Cache'}</div>
        </div>
        <div className="text-right text-xs">
          <div>{t('metrics.cache_hits') || 'Hits'}: <span className="text-base text-foreground font-bold">{cacheStats.hits}</span></div>
          <div>{t('metrics.cache_misses') || 'Misses'}: <span className="text-base text-foreground font-bold">{cacheStats.misses}</span></div>
          <div>{t('metrics.cache_ratio') || 'Hit ratio'}: <span className="text-base text-foreground font-bold">{(cacheStats.ratio * 100).toFixed(0)}%</span></div>
        </div>
      </div>
      <div className="h-px my-2 bg-muted" />
      <div className="flex items-center justify-between text-xs">
        <div className="text-sm font-medium text-foreground">{t('metrics.circuit.label') || 'Circuit'}</div>
        <div>
          <div>{t('metrics.circuit.failures') || 'Failures'}: <span className="text-base text-foreground font-bold">{circuit?.failures ?? 0}</span></div>
          <div>{t('metrics.circuit.open') || 'Open'}: <span className="text-base text-foreground">{circuitOpen ? t('metrics.circuit.open_until', { when: new Date(circuit?.openUntil).toLocaleTimeString() }) : (t('metrics.circuit.closed') || 'Closed')}</span></div>
        </div>
      </div>
    </div>
  );
}
