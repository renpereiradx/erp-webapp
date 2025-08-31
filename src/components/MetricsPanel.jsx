import React from 'react';
import useProductStore from '@/store/useProductStore';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';

export default function MetricsPanel() {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const cacheStats = useProductStore((s) => s.selectors.selectCacheStats(s));
  const circuit = useProductStore((s) => s.circuit);
  const circuitOpen = useProductStore((s) => s.circuitOpen);

  return (
    <div className={styles.card('p-4 mb-4')}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`${styles.label()} text-xs`}>{t('metrics.panel.title') || 'Metrics'}</div>
          <div className={`${styles.header('h4')} text-sm font-medium`}>{t('metrics.cache.label') || 'Cache'}</div>
        </div>
        <div className="text-right text-xs">
          <div>{t('metrics.cache_hits') || 'Hits'}: <span className={styles.body('font-bold')}>{cacheStats.hits}</span></div>
          <div>{t('metrics.cache_misses') || 'Misses'}: <span className={styles.body('font-bold')}>{cacheStats.misses}</span></div>
          <div>{t('metrics.cache_ratio') || 'Hit ratio'}: <span className={styles.body('font-bold')}>{(cacheStats.ratio * 100).toFixed(0)}%</span></div>
        </div>
      </div>
      <div className="h-px my-2 bg-muted" />
      <div className="flex items-center justify-between text-xs">
        <div className={styles.label()}>{t('metrics.circuit.label') || 'Circuit'}</div>
        <div>
          <div>{t('metrics.circuit.failures') || 'Failures'}: <span className={styles.body('font-bold')}>{circuit?.failures ?? 0}</span></div>
          <div>{t('metrics.circuit.open') || 'Open'}: <span className={styles.body()}>{circuitOpen ? t('metrics.circuit.open_until', { when: new Date(circuit?.openUntil).toLocaleTimeString() }) : (t('metrics.circuit.closed') || 'Closed')}</span></div>
        </div>
      </div>
    </div>
  );
}
