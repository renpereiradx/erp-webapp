import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const DebtTrendChart = ({ data }) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden mb-8 group transition-all duration-500 hover:shadow-2xl">
      <CardContent className="p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div className="group/title">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1 transition-all group-hover/title:translate-x-1">Tendencia de Deuda (6 meses)</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-80 group-hover/title:opacity-100 transition-opacity">Relación de saldo pendiente histórico mensual</p>
          </div>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3 group/legend">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-lg shadow-blue-500/50 group-hover/legend:scale-125 transition-transform duration-300"></div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover/legend:text-blue-500 transition-colors">Deuda Total</span>
            </div>
            <div className="flex items-center gap-3 group/legend">
              <div className="w-3.5 h-3.5 rounded-full bg-red-400 shadow-lg shadow-red-500/30 group-hover/legend:scale-125 transition-transform duration-300"></div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover/legend:text-red-500 transition-colors">Vencido</span>
            </div>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="relative h-72 w-full flex items-end justify-between gap-4 md:gap-8 mt-4 group/chart">
          {/* Chart Vertical Axis Labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-black text-slate-300 dark:text-slate-600 -ml-12 h-64 select-none uppercase tracking-widest">
            <span>$1.5M</span>
            <span>$1.0M</span>
            <span>$500K</span>
            <span className="text-slate-200 dark:text-slate-800">$0</span>
          </div>

          {/* Chart Horizontal Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-64 -mx-4 md:-mx-8">
            <div className="w-full border-t border-slate-100 dark:border-slate-800/50 opacity-50"></div>
            <div className="w-full border-t border-slate-100 dark:border-slate-800/50 opacity-50"></div>
            <div className="w-full border-t border-slate-100 dark:border-slate-800/50 opacity-50"></div>
            <div className="w-full border-b-2 border-slate-200 dark:border-slate-800 shadow-sm shadow-blue-500/5"></div>
          </div>

          {data.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-5 group/bar relative">
              <div className="w-full max-w-[140px] relative h-64 flex items-end">
                {/* Tooltip on Hover */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none shadow-2xl z-20 whitespace-nowrap translate-y-2 group-hover/bar:translate-y-0 uppercase tracking-widest">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-blue-400">Total:</span>
                      <span>${item.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-red-400">Vencido:</span>
                      <span>${item.overdue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>

                {/* Main Bar (Blue) */}
                <div 
                  className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-t-2xl transition-all duration-1000 ease-out group-hover/bar:bg-blue-200 dark:group-hover/bar:bg-blue-800/60 shadow-inner group-hover/bar:scale-x-105" 
                  style={{ height: `${(item.total / 1500000) * 100}%` }}
                >
                  <div 
                    className="absolute bottom-0 w-full bg-blue-600 rounded-t-2xl shadow-xl shadow-blue-500/10 group-hover/bar:bg-blue-500 transition-colors"
                    style={{ height: '100%' }}
                  />
                  {/* Overdue Section (Red) */}
                  <div 
                    className="absolute bottom-0 w-full bg-red-400/60 rounded-t-2xl shadow-lg shadow-red-500/20 group-hover/bar:bg-red-400 transition-all duration-700" 
                    style={{ height: `${(item.overdue / item.total) * 100}%` }}
                  />
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${item.isCurrent ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover/bar:text-slate-600 dark:group-hover/bar:text-slate-200'}`}>
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebtTrendChart;
