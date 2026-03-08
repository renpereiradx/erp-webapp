import React from 'react';

export interface KPIWidgetProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  iconColorClass?: string;
  bgColorClass?: string;
  badge?: string;
}

export const KPIWidget: React.FC<KPIWidgetProps> = ({
  title,
  value,
  icon,
  trend,
  trendType = 'positive',
  iconColorClass = 'text-primary',
  bgColorClass = 'bg-primary/10',
  badge
}) => {
  const trendColorClass = trendType === 'positive' 
    ? 'text-emerald-600' 
    : trendType === 'negative' 
      ? 'text-rose-600' 
      : 'text-slate-500';

  const trendIcon = trendType === 'positive' ? 'trending_up' : trendType === 'negative' ? 'trending_down' : 'remove';

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm font-display">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <span className={`material-symbols-outlined ${iconColorClass} ${bgColorClass} p-2 rounded-lg`}>{icon}</span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-black font-mono">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-1 ${trendColorClass} font-semibold text-xs font-mono`}>
            <span className="material-symbols-outlined text-xs">{trendIcon}</span>
            <span>{trend}</span>
          </div>
        )}
        {badge && (
          <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
};
