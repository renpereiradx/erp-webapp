import React from 'react';

export interface AlertItem {
  id: string;
  type: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actionLabel?: string;
  onAction?: () => void;
}

export interface AlertsPanelProps {
  alerts: AlertItem[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          container: 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-200',
          icon: 'text-rose-500',
          iconName: 'error',
          btn: 'text-rose-600'
        };
      case 'HIGH':
        return {
          container: 'bg-amber-50 dark:bg-amber-950/20 border-amber-400 text-amber-900 dark:text-amber-200',
          icon: 'text-amber-500',
          iconName: 'report',
          btn: 'text-amber-600'
        };
      case 'MEDIUM':
      case 'LOW':
      default:
        return {
          container: 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-slate-100',
          icon: 'text-slate-400',
          iconName: 'info',
          btn: 'text-primary'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 h-full font-display">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2 uppercase tracking-tight">
        <span className="material-symbols-outlined text-rose-500">warning</span>
        Alertas Críticas
      </h3>
      <div className="space-y-4">
        {alerts.map((alert) => {
          const styles = getSeverityStyles(alert.severity);
          return (
            <div key={alert.id} className={`flex items-start gap-4 p-3 border-l-4 rounded shadow-sm ${styles.container}`}>
              <span className={`material-symbols-outlined mt-0.5 ${styles.icon}`}>{styles.iconName}</span>
              <div className="flex-1">
                <p className="text-sm font-bold font-mono">{alert.message}</p>
                <p className="text-xs opacity-80 uppercase tracking-wide font-bold">{alert.type}</p>
                {alert.actionLabel && (
                  <button 
                    onClick={alert.onAction}
                    className={`mt-2 text-xs font-black underline uppercase tracking-tighter ${styles.btn}`}
                  >
                    {alert.actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8 italic">No hay alertas críticas en este momento.</p>
        )}
      </div>
    </div>
  );
};
