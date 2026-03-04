import React from 'react';
import { Info } from 'lucide-react';

/**
 * Aging Summary Chart for the Dashboard.
 * 100% fidelity to the Stitch design with overflow-hidden and rounded-xl.
 */
const AgingSummary = ({ aging = [], stats = {} }) => {
  return (
    <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] rounded-xl p-6 overflow-hidden h-full">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Resumen de Antigüedad (Aging)</h3>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Moneda: USD</span>
          <Info className="text-primary w-3.5 h-3.5" />
        </div>
      </div>
      
      <div className="space-y-7">
        {aging.map((item, index) => {
          let textClass = 'font-bold uppercase tracking-wide text-xs';
          let valClass = 'font-bold text-sm';
          if (item.critical) {
            textClass += ' text-fluent-danger';
            valClass += ' text-fluent-danger';
          } else if (item.label.includes('61')) {
            textClass += ' text-fluent-warning';
          } else {
            textClass += ' text-slate-500 dark:text-slate-400';
          }

          return (
            <div key={index} className="space-y-2.5">
              <div className="flex justify-between items-end">
                <span className={textClass}>{item.label}</span>
                <span className={valClass}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(item.amount)}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-7 rounded-xl overflow-hidden flex p-1 shadow-inner">
                <div 
                  className={`${item.color} h-full flex items-center justify-end px-3 rounded-lg transition-all duration-1000 shadow-sm`}
                  style={{ width: `${item.percentage}%` }}
                >
                  <span className="text-[10px] text-white font-bold">{item.percentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-4 gap-4 text-center">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.1em]">Total</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.1em]">Al Corriente</p>
          <p className="text-base font-bold text-fluent-success">{stats.onTime}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.1em]">Venc. Crítico</p>
          <p className="text-base font-bold text-fluent-danger">{stats.critical}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.1em]">Promedio</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">{stats.avgDays}</p>
        </div>
      </div>
    </div>
  );
};

export default AgingSummary;
