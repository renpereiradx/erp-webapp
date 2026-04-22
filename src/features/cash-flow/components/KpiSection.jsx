import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Landmark, 
  ArrowUp, 
  ArrowDown, 
  Activity
} from "lucide-react";
import { formatNumber } from "@/utils/currencyUtils";

/**
 * @param {Object} props
 * @param {number} props.coverageRatio
 * @param {number} props.netFlow
 * @param {number} props.totalInflows
 * @param {number} props.totalOutflows
 */
const KpiSection = ({ coverageRatio, netFlow, totalInflows, totalOutflows }) => {
  // Calculamos porcentajes relativos para las barras de progreso si no vienen de la API
  const totalVolume = totalInflows + totalOutflows;
  const inflowPct = totalVolume > 0 ? (totalInflows / totalVolume) * 100 : 0;
  const outflowPct = totalVolume > 0 ? (totalOutflows / totalVolume) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 font-display">
      {/* Coverage Ratio */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <div className="absolute top-6 left-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ratio de Cobertura</div>
          <div className="relative w-36 h-36 mt-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle className="text-slate-100 dark:text-slate-800" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8" />
              <circle 
                className={`${coverageRatio >= 1 ? 'text-blue-600' : 'text-rose-500'} transition-all duration-1000 ease-out`} 
                cx="50" cy="50" fill="none" r="45" 
                stroke="currentColor" 
                strokeDasharray="282.7" 
                strokeDashoffset={282.7 * (1 - Math.min(coverageRatio / 2, 1))} 
                strokeWidth="8" 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-black text-slate-900 dark:text-white">{formatNumber(coverageRatio)}</span>
              <span className={`text-[10px] font-black ${coverageRatio >= 1 ? 'text-green-600' : 'text-rose-600'} flex items-center gap-1 mt-1 uppercase tracking-tighter`}>
                <TrendingUp className="h-3 w-3" /> {coverageRatio >= 1 ? 'Saludable' : 'Riesgo'}
              </span>
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400 text-center px-4 uppercase leading-relaxed font-mono">Cobertura proyectada de obligaciones</p>
        </CardContent>
      </Card>

      {/* Net Flow */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flujo Neto Proyectado</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                <Landmark className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-2xl lg:text-3xl font-mono font-black tracking-tight ${netFlow >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'} tabular-nums`}>
                Gs. {netFlow.toLocaleString('es-PY')}
              </span>
              <div className="mt-1 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                <Activity className="h-3 w-3" /> Balance neto del periodo
              </div>
            </div>
          </div>
          <div className="mt-6 h-10 w-full flex items-end gap-1 opacity-80">
            {[40, 60, 55, 80, 70, 90].map((h, i) => (
              <div key={i} className="bg-blue-100 dark:bg-blue-900/40 w-full rounded-t-sm relative">
                <div 
                  className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inflows */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-green-500">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Entradas</span>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                <ArrowDown className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl lg:text-3xl font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                Gs. {totalInflows.toLocaleString('es-PY')}
              </span>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest">
              <span className="text-slate-500">Peso en Flujo</span>
              <span className="text-green-600 font-black">{formatNumber(inflowPct)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full rounded-full shadow-sm transition-all duration-1000" 
                style={{ width: `${inflowPct}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outflows */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-orange-500">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Salidas</span>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-500">
                <ArrowUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl lg:text-3xl font-mono font-black tracking-tight text-orange-500 tabular-nums">
                Gs. {totalOutflows.toLocaleString('es-PY')}
              </span>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest">
              <span className="text-slate-500">Peso en Flujo</span>
              <span className="text-orange-500 font-black">{formatNumber(outflowPct)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-orange-500 h-full rounded-full shadow-sm transition-all duration-1000" 
                style={{ width: `${outflowPct}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KpiSection;
