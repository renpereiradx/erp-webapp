import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra el grid de KPIs clave.
 */
const KPIStatsGrid = ({ metrics }) => {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1 */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('receivables.metrics.outstanding', 'Total Pendiente')}</p>
        <p className="text-2xl font-black text-[#111418] dark:text-white mt-2">{metrics.outstanding}</p>
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          <span className="material-symbols-outlined text-[14px]">trending_up</span>
          <span>+12% {t('receivables.metrics.trend.vs_last_month', 'vs mes anterior')}</span>
        </div>
      </div>
      
      {/* Card 2 */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('receivables.metrics.limit', 'Límite de Crédito')}</p>
        <p className="text-2xl font-black text-[#111418] dark:text-white mt-2">{metrics.limit}</p>
        <div className="mt-2 w-full bg-[#f0f2f4] dark:bg-gray-700 rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${metrics.utilization}%` }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">{metrics.utilization}% {t('receivables.metrics.utilization', 'Utilizado')}</p>
      </div>
      
      {/* Card 3 */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('receivables.metrics.avg_days', 'Promedio Días de Pago')}</p>
        <p className="text-2xl font-black text-[#111418] dark:text-white mt-2">{metrics.avgDays}</p>
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-orange-600 dark:text-orange-400">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          <span>{t('receivables.metrics.industry_avg', 'Promedio Industria: 30')}</span>
        </div>
      </div>
      
      {/* Card 4 */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('receivables.metrics.last_payment', 'Último Pago')}</p>
        <p className="text-2xl font-black text-[#111418] dark:text-white mt-2">{metrics.lastPayment}</p>
        <p className="text-xs font-medium text-gray-500 mt-2">{t('receivables.metrics.received', 'Recibido: hace 2 días')}</p>
      </div>
    </div>
  );
};

export default KPIStatsGrid;
