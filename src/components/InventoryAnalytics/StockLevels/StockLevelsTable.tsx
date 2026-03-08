import React from 'react';
import { StockLevelProduct } from '../../../types/inventoryAnalytics';

export interface StockLevelsTableProps {
  products: StockLevelProduct[];
}

export const StockLevelsTable: React.FC<StockLevelsTableProps> = ({ products }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            En Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Bajo
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            Agotado
          </span>
        );
      case 'OVERSTOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            Sobre-stock
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden font-display">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Producto</th>
              <th className="py-3 px-4">SKU / Categoría</th>
              <th className="py-3 px-4 text-center">Stock / Mín</th>
              <th className="py-3 px-4 text-center">Días Stock</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Costo Unit.</th>
              <th className="py-3 px-4 text-right">Valor Total</th>
              <th className="py-3 px-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((product) => (
              <tr key={product.product_id} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined">image</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{product.product_name}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-slate-500">{product.sku}</span>
                    <span className="text-xs text-slate-400">{product.category_name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-mono">
                  <div className="flex flex-col">
                    <span className="font-black">{product.current_stock}</span>
                    <span className="text-[10px] text-slate-400">Mín: {product.min_stock}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-mono">
                  <span className={`font-bold ${product.days_of_stock <= 5 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {product.days_of_stock} d
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  {getStatusBadge(product.status)}
                </td>
                <td className="py-4 px-4 text-right font-medium font-mono">
                  Gs. {product.unit_cost.toLocaleString('es-PY')}
                </td>
                <td className="py-4 px-4 text-right font-black text-primary font-mono">
                  Gs. {product.stock_value.toLocaleString('es-PY')}
                </td>
                <td className="py-4 px-4 text-center">
                  <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 font-mono">
        <p className="text-xs text-slate-500">Mostrando {products.length} de 150 productos</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold disabled:opacity-50" disabled>Anterior</button>
          <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold">Siguiente</button>
        </div>
      </div>
    </div>
  );
};
