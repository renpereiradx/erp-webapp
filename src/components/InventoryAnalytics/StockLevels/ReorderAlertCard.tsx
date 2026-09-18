import React from 'react';

export interface ReorderAlertCardProps {
  count: number;
  cost: string;
  type: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  onClick?: () => void;
}

export const ReorderAlertCard: React.FC<ReorderAlertCardProps> = ({ count, cost, type, onClick }) => {
  const getStyles = () => {
    switch (type) {
      case 'URGENT':
        return {
          bg: 'bg-error/10 dark:bg-rose-950/20',
          border: 'border-error',
          text: 'text-rose-900 dark:text-rose-200',
          accent: 'text-error',
          icon: 'error'
        };
      case 'HIGH':
        return {
          bg: 'bg-warning/10 dark:bg-amber-950/20',
          border: 'border-warning',
          text: 'text-warning dark:text-warning',
          accent: 'text-warning',
          icon: 'warning'
        };
      default:
        return {
          bg: 'bg-surface-muted dark:bg-surface-deep',
          border: 'border-border-subtle',
          text: 'text-foreground dark:text-on-primary',
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
      <button 
        onClick={onClick}
        className={`mt-2 text-sm font-bold underline text-left ${styles.accent}`}
      >
        Ver lista detallada
      </button>
    </div>
  );
};
