import React from 'react';

export interface ImpactCardProps {
  title: string;
  value: string;
  trend: string;
  trendValue: string;
  trendType: 'positive' | 'negative';
  icon: string;
  iconColorClass: string;
  iconBgClass: string;
}

export const ImpactCard: React.FC<ImpactCardProps> = ({ 
  title, 
  value, 
  trend, 
  trendValue,
  trendType,
  icon, 
  iconColorClass,
  iconBgClass
}) => {
  const trendColor = trendType === 'positive' ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between font-display">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</span>
          <div className={`p-2 ${iconBgClass} ${iconColorClass} rounded-full`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
        </div>
        <h3 className="text-4xl font-black text-slate-900 dark:text-white font-mono">{value}</h3>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className={`${trendColor} font-bold font-mono`}>{trendValue}</span>
        <span className="text-slate-400">{trend}</span>
      </div>
    </div>
  );
};
