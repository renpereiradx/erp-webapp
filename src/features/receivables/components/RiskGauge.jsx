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
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-[#f0f2f4] dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#111418] dark:text-white">{t('receivables.risk.title', 'Perfil de Riesgo')}</h2>
        <button className="text-primary text-sm font-medium hover:underline">{t('receivables.risk.full_analysis', 'Análisis Completo')}</button>
      </div>
      
      <div className="flex flex-col items-center">
        {/* Radial Gauge */}
        <div className="relative size-40">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
            {/* Background Circle */}
            <path className="text-[#f0f2f4] dark:text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
            {/* Value Circle */}
            <path className={`${score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'} drop-shadow-md`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${score}, 100`} strokeLinecap="round" strokeWidth="3"></path>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#111418] dark:text-white">{score}</span>
            <span className="text-xs font-medium text-gray-500">SCORE</span>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold mb-4 ${
            score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
            score >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <span className={`size-2 rounded-full ${
              score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            {level}
          </div>
        </div>

        <div className="w-full space-y-3 mt-2">
          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[20px]">warning</span>
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">{t('receivables.risk.recommendation.title', 'Recomendación del Analista')}</p>
            </div>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1 pl-7">{recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;
