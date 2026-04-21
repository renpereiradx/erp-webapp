import React from 'react';
import { Info } from 'lucide-react';
import { formatPYG, formatNumber } from '@/utils/currencyUtils';

/**
 * Aging Summary Chart for the Dashboard.
 * 100% fidelity to the Stitch design with premium gradients and glass effect.
 */
const AgingSummary = ({ aging = [], stats = {} }) => {
  return (
    <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] rounded-xl p-6 overflow-hidden h-full font-display">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Resumen de Antigüedad (Aging)</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Distribución de deuda por vencimiento</p>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PYG</span>
          <Info className="text-primary w-3.5 h-3.5" />
        </div>
      </div>
      
      <div className="space-y-8">
        {aging.map((item, index) => {
          let textClass = 'font-bold uppercase tracking-wide text-[11px]';
          let valClass = 'font-mono font-black text-sm';
          let gradientClass = 'from-primary to-primary/80';
          let shadowClass = 'shadow-primary/20';

          if (item.critical) {
            textClass += ' text-fluent-danger';
            valClass += ' text-fluent-danger';
            gradientClass = 'from-rose-500 to-rose-600';
            shadowClass = 'shadow-rose-500/20';
          } else if (item.label.includes('61')) {
            textClass += ' text-fluent-warning';
            gradientClass = 'from-orange-400 to-orange-500';
            shadowClass = 'shadow-orange-500/20';
          } else if (item.label.includes('31')) {
            textClass += ' text-amber-500';
            gradientClass = 'from-amber-300 to-amber-500';
            shadowClass = 'shadow-amber-500/20';
          } else {
            textClass += ' text-slate-500 dark:text-slate-400';
          }

          const pctValue = Number(item.percentage) || 0;

          return (
            <div key={index} className="space-y-3 group">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className={textClass}>{item.label}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {formatNumber(pctValue)}% del total
                  </span>
                </div>
                <span className={valClass}>
                  {formatPYG(item.amount)}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900/50 h-8 rounded-2xl overflow-hidden flex p-1.5 shadow-inner border border-slate-200/40 dark:border-slate-800">
                <div 
                  className={`bg-gradient-to-r ${gradientClass} ${shadowClass} h-full flex items-center justify-end px-3 rounded-xl transition-all duration-1000 shadow-sm relative overflow-hidden hover:brightness-110 cursor-default`}
                  style={{ width: `${pctValue}%` }}
                >
                  {/* Glass reflection */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {pctValue >= 15 && (
                    <span className="text-[10px] text-white font-mono font-black drop-shadow-sm animate-in fade-in duration-700">
                      {formatNumber(pctValue)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-4 text-center">
        <div className="space-y-1">
          <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.15em]">Deuda Total</p>
          <p className="text-sm font-mono font-black text-slate-900 dark:text-white truncate">{stats.total}</p>
        </div>
        <div className="space-y-1 border-x border-slate-50 dark:border-slate-800 px-2">
          <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.15em]">Al Día</p>
          <p className="text-sm font-mono font-black text-fluent-success">{stats.onTime}</p>
        </div>
        <div className="space-y-1 pr-2">
          <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.15em]">Venc. Crítico</p>
          <p className="text-sm font-mono font-black text-fluent-danger">{stats.critical}</p>
        </div>
        <div className="space-y-1 border-l border-slate-50 dark:border-slate-800">
          <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.15em]">Prom. Pago</p>
          <p className="text-sm font-mono font-black text-slate-900 dark:text-white truncate">{stats.avgDays}</p>
        </div>
      </div>
    </div>
  );
};

export default AgingSummary;
