import React from 'react';

/**
 * KPI Grid: Cards for DPO, % Overdue and Critical Risk.
 * 100% LITERAL STITCH REPRODUCTION
 */
const AgingKpiGrid = ({ kpis }) => {
  if (!kpis) return null;

  return (
    <section className="grid grid-cols-3 gap-8">
      {/* DPO Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">DPO (Días Promedio de Pago)</p>
            <h3 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">42 Días</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center text-[#28a745] text-sm font-bold">
                <span className="material-icons-round text-sm">trending_up</span> 2.4%
              </span>
              <span className="text-xs text-slate-400 font-medium">vs. mes anterior (41 d)</span>
            </div>
          </div>
          <div className="bg-[#137fec1a] p-3 rounded-lg">
            <span className="material-icons-round text-[#137fec]">schedule</span>
          </div>
        </div>
        <div className="mt-6 h-12 w-full flex items-end gap-1">
          <div className="flex-1 bg-[#137fec33] rounded-t h-[40%]"></div>
          <div className="flex-1 bg-[#137fec33] rounded-t h-[55%]"></div>
          <div className="flex-1 bg-[#137fec33] rounded-t h-[45%]"></div>
          <div className="flex-1 bg-[#137fec33] rounded-t h-[70%]"></div>
          <div className="flex-1 bg-[#137fec33] rounded-t h-[60%]"></div>
          <div className="flex-1 bg-[#137fec33] rounded-t h-[85%]"></div>
          <div className="flex-1 bg-[#137fec] rounded-t h-[100%]"></div>
        </div>
      </div>

      {/* % Overdue Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">% de Deuda Vencida</p>
            <h3 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">15.4%</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center text-[#dc3545] text-sm font-bold">
                <span className="material-icons-round text-sm">trending_up</span> 1.2%
              </span>
              <span className="text-xs text-slate-400 font-medium">Objetivo: &lt; 10%</span>
            </div>
          </div>
          <div className="bg-[#fd7e141a] p-3 rounded-lg">
            <span className="material-icons-round text-[#fd7e14]">error_outline</span>
          </div>
        </div>
        <div className="absolute right-6 bottom-6 w-16 h-16 border-[6px] border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center">
          <div className="absolute top-0 left-0 w-full h-full border-[6px] border-[#fd7e14] rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}></div>
          <span className="text-[10px] font-bold text-[#fd7e14]">ALTO</span>
        </div>
      </div>

      {/* Critical Risk Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Monto en Riesgo Crítico</p>
            <h3 className="text-4xl font-bold mt-2 text-[#dc3545]">$450,000</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center text-[#28a745] text-sm font-bold">
                <span className="material-icons-round text-sm">trending_down</span> $12k
              </span>
              <span className="text-xs text-slate-400 font-medium">en recuperación activa</span>
            </div>
          </div>
          <div className="bg-[#dc35451a] p-3 rounded-lg">
            <span className="material-icons-round text-[#dc3545]">report_problem</span>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">8 PROVEEDORES</span>
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-700">JD</div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-700">AC</div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-700">ML</div>
            <div className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-white">+5</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgingKpiGrid;
