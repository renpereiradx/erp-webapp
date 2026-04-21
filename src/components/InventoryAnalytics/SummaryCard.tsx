import React from 'react';
import { formatNumber } from '../../utils/currencyUtils';

export interface SummaryCardProps {
  title: string;
  icon: string;
  value: string;
  changeValue: number;
  changeDescription: string;
  isPositiveGood: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  icon,
  value,
  changeValue,
  changeDescription,
  isPositiveGood
}) => {
  const isPositive = changeValue > 0;
  // Si un cambio positivo es bueno (ej. tasa de rotación) o si un cambio negativo es bueno (ej. días de inventario)
  const isGood = isPositiveGood ? isPositive : !isPositive;
  
  const colorClass = isGood 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : 'text-rose-600 dark:text-rose-400';
    
  const iconName = isPositive ? 'trending_up' : 'trending_down';
  const displayChange = isPositive ? `+${formatNumber(changeValue)}%` : `${formatNumber(changeValue)}%`;

  return (
    <div className="flex flex-col gap-3 rounded-xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm font-display">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <div className="flex items-baseline gap-4">
        <p className="text-slate-900 dark:text-white text-4xl font-black font-mono">{value}</p>
        {changeValue !== 0 && (
          <div className={`flex items-center font-bold text-sm font-mono ${colorClass}`}>
            <span className="material-symbols-outlined text-sm">{iconName}</span>
            <span>{displayChange}</span>
          </div>
        )}
      </div>
      <p className="text-slate-400 text-xs italic">{changeDescription}</p>
    </div>
  );
};
