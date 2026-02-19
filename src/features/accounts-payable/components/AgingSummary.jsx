import React from 'react';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Aging Summary Chart for the Dashboard.
 * Displays aging bars (0-30, 31-60, 61-90, 90+ days).
 */
const AgingSummary = ({ aging = [], stats = {} }) => {
  return (
    <Card className="p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg dark:text-white">Resumen de Antigüedad (Aging)</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Cifras en USD</span>
          <Info className="text-slate-300 w-4 h-4" />
        </div>
      </div>
      
      <div className="aging-chart__bar-container">
        {aging.map((item, index) => {
          let fillClass = 'aging-chart__fill--primary';
          if (item.critical) fillClass = 'aging-chart__fill--danger';
          else if (item.label.includes('61')) fillClass = 'aging-chart__fill--warning';
          else if (item.label.includes('31')) fillClass = 'aging-chart__fill--primary-light';

          return (
            <div key={index} className="aging-chart__bar-row">
              <div className="aging-chart__bar-label">
                <span className={`font-medium ${item.critical ? 'text-red-500' : 'dark:text-slate-300'}`}>
                  {item.label}
                </span>
                <span className={`font-bold ${item.critical ? 'text-red-500' : 'dark:text-white'}`}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                  }).format(item.amount)}
                </span>
              </div>
              <div className="aging-chart__track">
                <div 
                  className={`aging-chart__fill ${fillClass}`}
                  style={{ width: `${item.percentage}%` }}
                >
                  {item.percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="aging-chart__stats">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
          <p className="text-sm font-bold dark:text-white">{stats.total}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Al Corriente</p>
          <p className="text-sm font-bold text-green-600">{stats.onTime}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Vencimiento Crítico</p>
          <p className="text-sm font-bold text-red-500">{stats.critical}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Prom. Días Pago</p>
          <p className="text-sm font-bold dark:text-white">{stats.avgDays}</p>
        </div>
      </div>
    </Card>
  );
};

export default AgingSummary;
