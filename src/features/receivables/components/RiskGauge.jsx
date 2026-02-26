import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra el indicador de riesgo circular.
 */
const RiskGauge = ({ score, level, recommendation }) => {
  const { t } = useI18n();

  const getRiskColor = (s) => {
    if (s >= 80) return '#107c10'; // Success
    if (s >= 50) return '#ffb900'; // Warning
    return '#a4262c'; // Error
  };

  return (
    <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.risk.title')}</h3>
        <Button variant="ghost" size="sm" className="text-primary font-black uppercase tracking-widest text-[10px] hover:bg-blue-50">
          {t('receivables.risk.full_analysis')}
        </Button>
      </div>
      
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative size-32">
          <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
            <circle className="text-slate-100" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"></circle>
            <circle 
              className="transition-all duration-1000 ease-out" 
              cx="18" cy="18" r="16" fill="none" 
              stroke={getRiskColor(score)} 
              strokeWidth="3" 
              strokeDasharray={`${score}, 100`} 
              strokeLinecap="round"
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-text-main tracking-tight">{score}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.risk.score')}</span>
          </div>
        </div>
        
        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
          score >= 80 ? 'bg-green-50 text-success' : score >= 50 ? 'bg-amber-50 text-warning' : 'bg-red-50 text-error'
        }`}>
          <span className={`size-2 rounded-full animate-pulse ${
            score >= 80 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-error'
          }`}></span>
          {level}
        </div>

        <div className="w-full p-4 rounded-lg bg-slate-50 border border-border-subtle/50 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
            <p className="text-[10px] font-black uppercase tracking-widest">{t('receivables.risk.recommendation.title')}</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed text-left font-medium">{recommendation}</p>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;
