import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la tendencia de facturación vs cobranza.
 */
const AgingTrendChart = ({ trendData }) => {
  const { t } = useI18n();

  // Mapeamos los datos para la visualización
  const displayData = trendData || [];

  return (
    <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col h-fit w-full xl:w-[400px] space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.aging_report.trend_title')}</h3>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">
          {t('receivables.aging_report.trend_subtitle')}
        </p>
      </div>
      
      <div className="flex flex-col gap-8">
        <div className="h-48 flex items-end justify-between gap-4 px-2">
          {displayData.map((item, i) => {
            const billedHeight = Math.min(100, (item.billed / 8000000) * 100);
            const collectedHeight = Math.min(100, (item.collected / 8000000) * 100);
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full group">
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  <div 
                    className="w-2.5 bg-primary/20 rounded-t-sm transition-all duration-500 group-hover:bg-primary/40 group-hover:scale-x-110" 
                    style={{ height: `${billedHeight}%` }}
                    title={`${t('receivables.aging_report.billed')}: ${item.billed}`}
                  ></div>
                  <div 
                    className="w-2.5 bg-primary rounded-t-sm transition-all duration-500 group-hover:scale-x-110 shadow-[0_-2px_8px_rgba(16,110,190,0.2)]" 
                    style={{ height: `${collectedHeight}%` }}
                    title={`${t('receivables.aging_report.collected')}: ${item.collected}`}
                  ></div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-40 group-hover:opacity-100 transition-opacity">
                  {new Date(item.date).toLocaleDateString('es-ES', { month: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-border-subtle/50">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary/20"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging_report.billed')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary shadow-[0_0_0_2px_rgba(16,110,190,0.1)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.aging_report.collected')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgingTrendChart;
