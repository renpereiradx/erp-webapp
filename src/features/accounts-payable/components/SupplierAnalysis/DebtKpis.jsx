import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  PieChart 
} from "lucide-react";

const DebtKpis = ({ stats }) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Pendiente */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden h-full group hover:border-blue-500/30 transition-all duration-300">
        <CardContent className="p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Pendiente</p>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ${stats.totalPending.toLocaleString()}
            </h3>
            <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
              +12% vs. mes ant.
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
              style={{ width: '75%' }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Total Vencido */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full group hover:border-red-500/30 transition-all duration-300">
        <CardContent className="p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Vencido</p>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-3xl font-black text-red-600 tracking-tight">
              ${stats.totalOverdue.toLocaleString()}
            </h3>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 animate-pulse">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            14 facturas superan la fecha límite
          </p>
        </CardContent>
      </Card>

      {/* DPO (Días Promedio Pago) */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full group hover:border-green-500/30 transition-all duration-300">
        <CardContent className="p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">DPO (Días Promedio Pago)</p>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.dpo} Días
            </h3>
            <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> -3 días
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Referencia de sector: 45 días
          </p>
        </CardContent>
      </Card>

      {/* Share of Payables % */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full group hover:border-slate-400/30 transition-all duration-300">
        <CardContent className="p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Share of Payables %</p>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.shareOfPayables}%
            </h3>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Segundo acreedor más importante
          </p>
        </CardContent>
      </Card>
    </section>
  );
};

export default DebtKpis;
