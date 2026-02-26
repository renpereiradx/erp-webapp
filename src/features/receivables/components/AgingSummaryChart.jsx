import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Gráfico de resumen de envejecimiento (Aging Summary).
 */
const AgingSummaryChart = ({ agingData }) => {
  const { t } = useI18n();

  // Mapeamos los datos para la visualización de la lista
  const buckets = [
    { label: t('receivables.aging.current'), key: 'current', color: '#107c10' },
    { label: t('receivables.aging.1_30'), key: 'days_30_60', color: '#ffb900' },
    { label: t('receivables.aging.31_60'), key: 'days_60_90', color: '#d83b01' },
    { label: t('receivables.aging.90'), key: 'over_90_days', color: '#a80000' }
  ];

  return (
    <div className="bg-surface rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
        <h3 className="text-sm font-black text-text-main uppercase tracking-tight">
          {t('receivables.aging_report.buckets_title')}
        </h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-6">
          {buckets.map((bucket, i) => {
            const data = agingData[bucket.key] || { amount: 0, percentage: 0 };
            return (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{bucket.label}</span>
                  <span className={`text-sm font-black ${bucket.key === 'over_90_days' ? 'text-error' : 'text-text-main'}`}>
                    {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', notation: 'compact' }).format(data.amount)}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${data.percentage}%`, backgroundColor: bucket.color }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgingSummaryChart;
