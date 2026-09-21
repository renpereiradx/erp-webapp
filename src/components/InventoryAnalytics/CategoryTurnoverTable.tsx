import React from 'react';
import { useI18n } from '@/lib/i18n';
import { TurnoverCategory } from '../../data/mockInventoryABCData';

export interface CategoryTurnoverTableProps {
  categories: TurnoverCategory[];
}

export const CategoryTurnoverTable: React.FC<CategoryTurnoverTableProps> = ({ categories }) => {
  const { t } = useI18n();

  const getPerformanceBadge = (performance?: string) => {
    switch (performance) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success">
            {t('bi.inventory.performance.excellent', 'Excelente', {})}
          </span>
        );
      case 'GOOD':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {t('bi.inventory.performance.good', 'Bueno', {})}
          </span>
        );
      case 'AVERAGE':
      case 'POOR':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/10 text-warning">
            {t('bi.inventory.performance.poor', 'Pobre', {})}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-surface rounded-xl p-6 border border-border-subtle shadow-sm overflow-hidden font-display">
      <h2 className="text-foreground text-xl font-bold uppercase tracking-tight">{t('bi.inventory.turnover.byCategory', 'Rotación por Categoría', {})}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle text-on-surface-deep text-[10px] font-bold uppercase tracking-wider">
              <th className="pb-3 px-2">{t('bi.inventory.col.category', 'Categoría', {})}</th>
              <th className="pb-3 px-2">{t('bi.inventory.turnover.col.rate', 'Tasa de Rotación', {})}</th>
              <th className="pb-3 px-2 text-right">{t('bi.inventory.turnover.col.units', 'Unidades', {})}</th>
              <th className="pb-3 px-2 text-center">{t('bi.inventory.col.status', 'Status', {})}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {categories.map((cat) => {
              // Soporte para ambos formatos (API snake_case y Mock camelCase)
              const turnoverRate = cat.turnoverRate ?? cat.turnover_rate;
              const unitsSold = cat.unitsSold ?? cat.units_sold;
              const categoryName = cat.name ?? cat.category_name;
              const categoryId = cat.id ?? cat.category_id;

              return (
                <tr key={categoryId} className="text-sm hover:bg-surface-muted transition-colors">
                  <td className="py-4 px-2 font-bold text-foreground">{categoryName}</td>
                  <td className="py-4 px-2 font-mono font-bold text-primary">{Number(turnoverRate ?? 0).toFixed(2)}x</td>
                  <td className="py-4 px-2 text-right font-mono">{(unitsSold || 0).toLocaleString('es-PY')}</td>
                  <td className="py-4 px-2 text-center">
                    {getPerformanceBadge(cat.performance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
