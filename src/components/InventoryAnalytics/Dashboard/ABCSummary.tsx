import React from 'react';
import { useI18n } from '@/lib/i18n';

// Los labels/descripciones por clase viven aquí (i18n), no en el dominio:
// buildAbcItems devuelve datos puros {class, percentage, count, value}.
export interface ABCItem {
  class: 'A' | 'B' | 'C';
  percentage: number;
  count: number;
  value: string;
}

export interface ABCSummaryProps {
  items: ABCItem[];
}

export const ABCSummary: React.FC<ABCSummaryProps> = ({ items }) => {
  const { t } = useI18n();

  const getClassMeta = (itemClass: 'A' | 'B' | 'C') => {
    switch (itemClass) {
      case 'A':
        return {
          iconBg: 'bg-primary/10',
          text: 'text-primary',
          bar: 'bg-primary',
          label: t('bi.inventory.abc.classA.label', 'Clase A (Alta Rotación/Valor)', {}),
          description: t('bi.inventory.abc.classA.desc', 'Productos que representan el 80% del valor total.', {}),
        };
      case 'B':
        return {
          iconBg: 'bg-warning/10',
          text: 'text-warning',
          bar: 'bg-warning',
          label: t('bi.inventory.abc.classB.label', 'Clase B (Importancia Media)', {}),
          description: t('bi.inventory.abc.classB.desc', 'Productos que representan el 15% del valor total.', {}),
        };
      case 'C':
      default:
        return {
          iconBg: 'bg-surface-muted',
          text: 'text-on-surface-deep',
          bar: 'bg-divider',
          label: t('bi.inventory.abc.classC.label', 'Clase C (Bajo Valor Unitario)', {}),
          description: t('bi.inventory.abc.classC.desc', 'Productos que representan el 5% del valor total.', {}),
        };
    }
  };

  return (
    <div className="space-y-4 font-display">
      <h3 className="text-lg font-bold px-1 uppercase tracking-tight">{t('bi.inventory.abc.summaryTitle', 'Resumen ABC (Clasificación por Valor)', {})}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item, index) => {
          const colors = getClassMeta(item.class);
          return (
            <div key={index} className="bg-surface p-4 rounded-lg border border-border-subtle flex items-center gap-4 shadow-sm" title={colors.description}>
              <div className={`size-12 rounded-lg ${colors.iconBg} flex items-center justify-center ${colors.text} font-black text-xl font-mono`}>
                {item.class}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-xs font-bold text-on-surface-deep uppercase tracking-wider">{colors.label}</p>
                  <p className="text-sm font-black font-mono">
                    {t('bi.inventory.abc.valueShare', '{pct}% Valor', { pct: Number(item.percentage).toFixed(2) })}
                  </p>
                </div>
                <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden">
                  <div className={`${colors.bar} h-full rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
                <p className="text-[11px] text-on-surface-deep mt-2 font-medium font-mono">
                  {t('bi.inventory.stockStatus.items', '{n} items', { n: item.count })} • {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
