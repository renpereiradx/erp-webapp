import React from 'react';
import { DeadStockProduct } from '../../../types/inventoryAnalytics';

export interface DeadStockTableProps {
  products: DeadStockProduct[];
}

export const DeadStockTable: React.FC<DeadStockTableProps> = ({ products }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500">inventory</span>
          Productos con &gt;90 Días de Inactividad
        </h3>
        <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
          {products.length} SKU Detectados
        </span>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Producto</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Días Inactivo</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Valor (Gs.)</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">Recomendación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((product) => (
              <tr key={product.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-white">{product.product_name}</span>
                    <span className="text-xs text-slate-500">Cod: {product.sku}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {product.days_since_last_sale} días
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                  {product.stock_value.toLocaleString('es-PY')}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.recommendation.includes('Liquidación') 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {product.recommendation}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-200 dark:border-slate-800">
          <button className="text-primary text-sm font-bold hover:underline">
            Ver reporte completo de inactividad
          </button>
        </div>
      </div>
    </div>
  );
};
