import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la barra de análisis de antigüedad.
 */
const AgingBar = ({ aging, totalAR }) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 space-y-6">
      <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.aging.title')}</h3>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success shadow-[0_0_0_2px_rgba(16,124,16,0.1)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging.current')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-warning shadow-[0_0_0_2px_rgba(255,185,0,0.1)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging.1_30')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.1)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging.31_60')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-error shadow-[0_0_0_2px_rgba(164,38,44,0.1)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging.90')}</span>
          </div>
        </div>
        
        <div className="h-10 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
          {aging.map((seg, i) => {
            const colors = {
              'aging-bar__segment--current': 'bg-success',
              'aging-bar__segment--1-30': 'bg-warning',
              'aging-bar__segment--31-60': 'bg-orange-500',
              'aging-bar__segment--90': 'bg-error'
            };
            return (
              <div 
                key={i} 
                className={`${colors[seg.colorClass] || 'bg-slate-300'} h-full flex items-center justify-center text-[10px] font-black text-white px-1 truncate transition-all hover:brightness-110 cursor-help`}
                style={{ width: seg.width }}
                title={seg.title}
              >
                {parseFloat(seg.width) > 5 ? seg.amount : ''}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60">
            {t('receivables.aging.total_ar')}: <span className="text-text-main opacity-100">{totalAR}</span>
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-error">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>{t('receivables.aging.max_alert')}: {t('receivables.aging.90')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgingBar;
