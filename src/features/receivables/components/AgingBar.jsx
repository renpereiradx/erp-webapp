import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la barra de análisis de antigüedad.
 */
const AgingBar = ({ aging, totalAR }) => {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-bold text-[#111418] dark:text-white">{t('receivables.aging.title', 'Análisis de Antigüedad')}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500"></span>{t('receivables.aging.current', 'Al Día')}</div>
          <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-yellow-400"></span>{t('receivables.aging.1_30', '1-30 Días')}</div>
          <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-orange-500"></span>{t('receivables.aging.31_60', '31-60 Días')}</div>
          <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-500"></span>{t('receivables.aging.90', '>90 Días')}</div>
        </div>
      </div>
      <div className="w-full">
        {/* Visual Bar */}
        <div className="flex h-12 w-full rounded-lg overflow-hidden mb-2">
          {aging.map((seg, i) => {
            const colors = {
              'aging-bar__segment--current': 'bg-emerald-500',
              'aging-bar__segment--1-30': 'bg-yellow-400 text-yellow-900',
              'aging-bar__segment--31-60': 'bg-orange-500',
              'aging-bar__segment--90': 'bg-red-500'
            };
            const applyColor = colors[seg.colorClass] || 'bg-slate-300 text-white';
            const defaultTextClass = applyColor.includes('text-') ? '' : 'text-white';
            
            return (
              <div 
                key={i} 
                className={`${applyColor} ${defaultTextClass} h-full flex items-center justify-center text-xs font-bold transition-all hover:brightness-110 cursor-pointer`}
                style={{ width: seg.width }}
                title={seg.title}
              >
                {parseFloat(seg.width) > 5 ? seg.amount : ''}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{t('receivables.aging.total_ar', 'Total AR')}: {totalAR}</span>
          <span>{t('receivables.aging.max_alert', 'Alerta Máxima')}: {t('receivables.aging.90', '>90 Días')}</span>
        </div>
      </div>
    </div>
  );
};

export default AgingBar;
