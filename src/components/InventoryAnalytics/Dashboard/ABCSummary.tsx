import React from 'react';

export interface ABCItem {
  label: string;
  description: string;
  percentage: number;
  count: number;
  value: string;
  class: 'A' | 'B' | 'C';
}

export interface ABCSummaryProps {
  items: ABCItem[];
}

export const ABCSummary: React.FC<ABCSummaryProps> = ({ items }) => {
  const getColors = (itemClass: string) => {
    switch (itemClass) {
      case 'A': return { iconBg: 'bg-primary/10', text: 'text-primary', bar: 'bg-primary' };
      case 'B': return { iconBg: 'bg-warning/10', text: 'text-warning', bar: 'bg-warning' };
      case 'C': return { iconBg: 'bg-surface-muted0/10', text: 'text-on-surface-deep', bar: 'bg-divider' };
      default: return { iconBg: 'bg-surface-muted', text: 'text-on-surface-deep', bar: 'bg-divider' };
    }
  };

  return (
    <div className="space-y-4 font-display">
      <h3 className="text-lg font-bold px-1 uppercase tracking-tight">Resumen ABC (Clasificación por Valor)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item, index) => {
          const colors = getColors(item.class);
          return (
            <div key={index} className="bg-surface p-4 rounded-lg border border-border-subtle flex items-center gap-4 shadow-sm">
              <div className={`size-12 rounded-lg ${colors.iconBg} flex items-center justify-center ${colors.text} font-black text-xl font-mono`}>
                {item.class}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-xs font-bold text-on-surface-deep uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-black font-mono">{Number(item.percentage).toFixed(2)}% Valor</p>
                </div>
                <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden">
                  <div className={`${colors.bar} h-full rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
                <p className="text-[11px] text-on-surface-deep mt-2 font-medium font-mono">{item.count} productos • {item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
