import React from 'react';
import { AlertTriangle } from 'lucide-react';
// F1 (PLAN_ALINEACION_BI_FRONTEND): estilos de riesgo extraídos a domain
import { getRiskStyles } from '@/domain/receivables/risk';

const RiskGauge = ({ score = 0, level = 'Medium', recommendation = '' }) => {
  const styles = getRiskStyles(level);

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-[#f0f2f4] dark:border-gray-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#111418] dark:text-white uppercase tracking-tight">Perfil de Riesgo</h2>
      </div>
      <div className="flex flex-col items-center">
        {/* Radial Gauge (Reducido) */}
        <div className="relative size-32">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
            <path className="text-[#f0f2f4] dark:text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
            {score != null && (
              <path className={`${styles.color} drop-shadow-md`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${score}, 100`} strokeLinecap="round" strokeWidth="3"></path>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {score != null ? (
              <span className="text-2xl font-black text-foreground">{score}</span>
            ) : (
              <span className={`text-sm font-black uppercase tracking-tight ${styles.color}`}>{styles.label}</span>
            )}
            <span className="text-[9px] font-bold text-on-surface-deep uppercase tracking-widest leading-none">{score != null ? 'Score' : 'Sin score numérico'}</span>
          </div>
        </div>
        <div className="mt-3 text-center">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${styles.bg} dark:bg-opacity-20 text-[11px] font-bold mb-3`}>
            <span className={`size-1.5 rounded-full ${styles.dot}`}></span>
            {styles.label}
          </div>
        </div>
        
        <div className="w-full space-y-2 mt-1">
          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
            <div className="flex gap-2">
              <AlertTriangle className="text-red-600 dark:text-red-400 size-4 shrink-0" />
              <p className="text-[11px] text-red-800 dark:text-red-300 font-bold uppercase tracking-tight">Recomendación</p>
            </div>
            <p className="text-[11px] text-red-700 dark:text-red-400 mt-1 leading-relaxed font-medium">
              {recommendation || 'Monitorear de cerca. Solicitar pago parcial antes de liberar el próximo envío.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;