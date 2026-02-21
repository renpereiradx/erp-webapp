import React from 'react';
import { Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Aging Summary Chart for the Dashboard.
 * RESPONSIVE OPTIMIZED.
 */
const AgingSummary = ({ aging = [], stats = {} }) => {
  return (
    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base md:text-lg font-bold">Resumen de Antigüedad (Aging)</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[10px] md:text-xs text-slate-400 font-medium">USD</span>
          <Info className="text-slate-300 w-4 h-4" />
        </div>
      </CardHeader>
      
      <CardContent className="px-6 py-6 space-y-8">
        <div className="space-y-6">
          {aging.map((item, index) => {
            let colorClass = 'bg-[#137fec]';
            if (item.critical) colorClass = 'bg-[#dc3545]';
            else if (item.label.includes('61')) colorClass = 'bg-[#ffc107]';
            else if (item.label.includes('31')) colorClass = 'bg-[#137fec]/60';

            return (
              <div key={index} className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <span className={`text-xs md:text-sm font-bold uppercase tracking-tight ${item.critical ? 'text-[#dc3545]' : 'text-slate-600 dark:text-slate-300'}`}>
                    {item.label}
                  </span>
                  <span className={`text-xs md:text-sm font-black ${item.critical ? 'text-[#dc3545]' : 'text-slate-900 dark:text-white'}`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(item.amount)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-6 md:h-8 rounded-lg overflow-hidden p-1 shadow-inner">
                  <div 
                    className={`${colorClass} h-full rounded-md flex items-center justify-center text-[10px] font-black text-white transition-all duration-1000 group-hover:opacity-90`}
                    style={{ width: `${item.percentage}%` }}
                  >
                    {item.percentage >= 10 ? `${item.percentage}%` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Stats Grid - Responsive wrap */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
            <p className="text-sm md:text-base font-black text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Al Corriente</p>
            <p className="text-sm md:text-base font-black text-[#28a745]">{stats.onTime}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Crítico</p>
            <p className="text-sm md:text-base font-black text-[#dc3545]">{stats.critical}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Días Prom.</p>
            <p className="text-sm md:text-base font-black text-slate-900 dark:text-white">{stats.avgDays}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgingSummary;
