import React from 'react';
import { TurnoverCategory } from '../../data/mockInventoryABCData';

export interface CategoryTurnoverTableProps {
  categories: TurnoverCategory[];
}

export const CategoryTurnoverTable: React.FC<CategoryTurnoverTableProps> = ({ categories }) => {
  const getPerformanceBadge = (performance?: string) => {
    switch (performance) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/10 text-emerald-800">
            Excelente
          </span>
        );
      case 'GOOD':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            Bueno
          </span>
        );
      case 'AVERAGE':
      case 'POOR':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/10 text-orange-800">
            Pobre
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-surface rounded-xl p-6 border border-border-subtle shadow-sm overflow-hidden font-display">
      <h2 className="text-foreground text-xl font-bold uppercase tracking-tight">Rotación por Categoría</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle text-on-surface-deep text-[10px] font-bold uppercase tracking-wider">
              <th className="pb-3 px-2">Categoría</th>
              <th className="pb-3 px-2">Tasa de Rotación</th>
              <th className="pb-3 px-2 text-right">Unidades</th>
              <th className="pb-3 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map((cat) => {
              // Soporte para ambos formatos (API snake_case y Mock camelCase)
              const turnoverRate = cat.turnoverRate ?? (cat as any).turnover_rate;
              const unitsSold = cat.unitsSold ?? (cat as any).units_sold;
              const categoryName = cat.name ?? (cat as any).category_name;
              const categoryId = cat.id ?? (cat as any).category_id;

              return (
                <tr key={categoryId} className="text-sm hover:bg-surface-muted:bg-surface-deep/30 transition-colors">
                  <td className="py-4 px-2 font-bold text-foreground">{categoryName}</td>
                  <td className="py-4 px-2 font-mono font-bold text-primary">{Number(turnoverRate).toFixed(2)}x</td>
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
      <button className="mt-2 text-primary text-sm font-black flex items-center gap-1 hover:underline w-fit uppercase tracking-tighter">
        Ver todas las categorías
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>
    </div>
  );
};
