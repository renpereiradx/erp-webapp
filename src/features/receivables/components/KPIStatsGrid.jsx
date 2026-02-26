import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra el grid de KPIs clave.
 */
const KPIStatsGrid = ({ metrics }) => {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70 mb-4">{t('receivables.metrics.outstanding')}</p>
        <h3 className="text-2xl font-black text-text-main tracking-tight">{metrics.outstanding}</h3>
        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-error">
          <span className="material-symbols-outlined text-[14px]">trending_up</span>
          <span>+12% {t('receivables.metrics.trend.vs_last_month')}</span>
        </div>
      </div>
      
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70 mb-4">{t('receivables.metrics.limit')}</p>
        <h3 className="text-2xl font-black text-text-main tracking-tight">{metrics.limit}</h3>
        <div className="space-y-2 mt-3">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${metrics.utilization}%` }}></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 text-right">
            {metrics.utilization}% {t('receivables.metrics.utilization')}
          </p>
        </div>
      </div>
      
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70 mb-4">{t('receivables.metrics.avg_days')}</p>
        <h3 className="text-2xl font-black text-text-main tracking-tight">{metrics.avgDays}</h3>
        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-warning">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          <span>{t('receivables.metrics.industry_avg')}</span>
        </div>
      </div>
      
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70 mb-4">{t('receivables.metrics.last_payment')}</p>
        <h3 className="text-2xl font-black text-success tracking-tight">{metrics.lastPayment}</h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 mt-2">
          {t('receivables.metrics.received', { days: 2 })}
        </p>
      </div>
    </div>
  );
};

export default KPIStatsGrid;
