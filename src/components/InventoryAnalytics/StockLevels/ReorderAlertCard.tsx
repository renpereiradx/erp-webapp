import React from 'react';

export interface ReorderAlertCardProps {
  count: number;
  cost: string;
  type: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export const ReorderAlertCard: React.FC<ReorderAlertCardProps> = ({ count, cost, type }) => {
  const getStyles = () => {
    switch (type) {
      case 'URGENT':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/20',
          border: 'border-rose-500',
          text: 'text-rose-900 dark:text-rose-200',
          accent: 'text-rose-600',
          icon: 'error'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-500',
          text: 'text-amber-900 dark:text-amber-200',
          accent: 'text-amber-600',
          icon: 'warning'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          border: 'border-slate-200',
          text: 'text-slate-900 dark:text-slate-100',
          accent: 'text-primary',
          icon: 'info'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`flex flex-col gap-3 rounded-xl p-6 border-l-4 shadow-sm font-display ${styles.bg} ${styles.border}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-bold uppercase tracking-wider ${styles.text}`}>
          {type === 'URGENT' ? 'Necesidad Urgente de Reorden' : 'Reorden Sugerida'}
        </p>
        <span className={`material-symbols-outlined ${styles.accent}`}>{styles.icon}</span>
      </div>
      <div className="flex flex-col">
        <p className="text-3xl font-black font-mono">{count} Productos</p>
        <p className={`text-sm font-semibold font-mono ${styles.accent}`}>Costo estimado: {cost}</p>
      </div>
      <button className={`mt-2 text-sm font-bold underline text-left ${styles.accent}`}>
        Ver lista detallada
      </button>
    </div>
  );
};
