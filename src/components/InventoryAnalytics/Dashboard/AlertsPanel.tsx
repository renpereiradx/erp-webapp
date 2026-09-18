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
          container: 'bg-error/10 dark:bg-rose-950/20 border-error text-rose-900 dark:text-rose-200',
          icon: 'text-error',
          iconName: 'error',
          btn: 'text-error'
        };
      case 'HIGH':
        return {
          container: 'bg-warning/10 dark:bg-amber-950/20 border-amber-400 text-amber-900 dark:text-amber-200',
          icon: 'text-warning',
          iconName: 'report',
          btn: 'text-warning'
        };
      case 'MEDIUM':
      case 'LOW':
      default:
        return {
          container: 'bg-surface-muted dark:bg-surface-deep border-border-subtle text-foreground dark:text-slate-100',
          icon: 'text-on-surface-deep',
          iconName: 'info',
          btn: 'text-primary'
        };
    }
  };

  return (
    <div className="bg-surface p-6 rounded-lg border border-border-subtle h-full font-display">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2 uppercase tracking-tight">
        <span className="material-symbols-outlined text-error">warning</span>
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
          <p className="text-sm text-on-surface-deep text-center py-8 italic">No hay alertas críticas en este momento.</p>
        )}
      </div>
    </div>
  );
};
