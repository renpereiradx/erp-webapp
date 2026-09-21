import React from 'react';
import { useI18n } from '@/lib/i18n';

export interface AlertItem {
  id: string;
  type: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AlertsPanelProps {
  alerts: AlertItem[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const { t } = useI18n();

  // H7: los botones de acción solo logueaban en dev — fuera; la alerta es
  // informativa hasta que exista un endpoint de acción real.
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          container: 'bg-error/10 border-error text-error',
          icon: 'text-error',
          iconName: 'error',
        };
      case 'HIGH':
        return {
          container: 'bg-warning/10 border-warning text-warning',
          icon: 'text-warning',
          iconName: 'report',
        };
      case 'MEDIUM':
      case 'LOW':
      default:
        return {
          container: 'bg-surface-muted border-border-subtle text-foreground',
          icon: 'text-on-surface-deep',
          iconName: 'info',
        };
    }
  };

  return (
    <div className="bg-surface p-6 rounded-lg border border-border-subtle h-full font-display">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2 uppercase tracking-tight">
        <span className="material-symbols-outlined text-error">warning</span>
        {t('bi.inventory.alerts.title', 'Alertas Críticas', {})}
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
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && (
          <p className="text-sm text-on-surface-deep text-center py-8 italic">{t('bi.inventory.alerts.empty', 'No hay alertas críticas en este momento.', {})}</p>
        )}
      </div>
    </div>
  );
};
