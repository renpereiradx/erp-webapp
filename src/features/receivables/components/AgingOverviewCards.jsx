import React from 'react';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Tarjetas de resumen para el reporte de antigüedad.
 */
const AgingOverviewCards = ({ stats }) => {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
        <div className="flex justify-between items-start mb-4">
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging_report.total_os')}</p>
          <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <h3 className="text-2xl font-black text-text-main tracking-tight">{formatPYG(stats.total_billed)}</h3>
          <span className="px-2 py-0.5 rounded bg-red-50 text-error text-[10px] font-black uppercase tracking-widest">+2.5%</span>
        </div>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 mt-3">
          {t('receivables.aging_report.vs_previous')}
        </p>
      </div>

      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
        <div className="flex justify-between items-start mb-4">
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging_report.dso')}</p>
          <div className="size-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <h3 className="text-2xl font-black text-text-main tracking-tight">{stats.average_dso} Días</h3>
          <span className="px-2 py-0.5 rounded bg-green-50 text-success text-[10px] font-black uppercase tracking-widest">-1.2 d</span>
        </div>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 mt-3">
          {t('receivables.aging_report.industry_avg_msg')}
        </p>
      </div>

      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
        <div className="flex justify-between items-start mb-4">
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging_report.efficiency')}</p>
          <div className="size-10 rounded-lg bg-green-50 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[20px]">pie_chart</span>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <h3 className="text-2xl font-black text-text-main tracking-tight">{stats.collection_rate}%</h3>
          <span className="px-2 py-0.5 rounded bg-green-50 text-success text-[10px] font-black uppercase tracking-widest">+0.5%</span>
        </div>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 mt-3">
          {t('receivables.statistics.collection_rate') || 'Tasa de Cobranza'}
        </p>
      </div>
    </div>
  );
};

export default AgingOverviewCards;
