import React from 'react';
import { useI18n } from '@/lib/i18n';

export interface ReorderAlertCardProps {
  count: number;
  cost: string;
  type: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  onClick?: () => void;
}

export const ReorderAlertCard: React.FC<ReorderAlertCardProps> = ({ count, cost, type, onClick }) => {
  const { t } = useI18n();

  const getStyles = () => {
    switch (type) {
      case 'URGENT':
        return {
          bg: 'bg-error/10',
          border: 'border-error',
          text: 'text-error',
          accent: 'text-error',
          icon: 'error'
        };
      case 'HIGH':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning',
          text: 'text-warning',
          accent: 'text-warning',
          icon: 'warning'
        };
      default:
        return {
          bg: 'bg-surface-muted',
          border: 'border-border-subtle',
          text: 'text-foreground',
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
          {type === 'URGENT'
            ? t('bi.inventory.reorder.urgent', 'Necesidad Urgente de Reorden', {})
            : t('bi.inventory.reorder.suggested', 'Reorden Sugerida', {})}
        </p>
        <span className={`material-symbols-outlined ${styles.accent}`}>{styles.icon}</span>
      </div>
      <div className="flex flex-col">
        <p className="text-3xl font-black font-mono">{t('bi.inventory.reorder.products', '{n} Productos', { n: count })}</p>
        <p className={`text-sm font-semibold font-mono ${styles.accent}`}>
          {t('bi.inventory.reorder.estimatedCost', 'Costo estimado: {cost}', { cost })}
        </p>
      </div>
      <button
        onClick={onClick}
        className={`mt-2 text-sm font-bold underline text-left ${styles.accent}`}
      >
        {t('bi.inventory.reorder.viewList', 'Ver lista detallada', {})}
      </button>
    </div>
  );
};
