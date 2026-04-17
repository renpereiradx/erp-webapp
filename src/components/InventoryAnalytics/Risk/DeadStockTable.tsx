import React from 'react';
import { DeadStockProduct } from '../../../types/inventoryAnalytics';

export interface DeadStockTableProps {
  products: DeadStockProduct[];
}

export const DeadStockTable: React.FC<DeadStockTableProps> = ({ products }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
            <span className="material-symbols-outlined text-orange-600">inventory_2</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Productos con &gt;90 Días de Inactividad
          </h3>
        </div>
        <span className="text-xs font-black bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1 rounded-full uppercase tracking-widest font-mono shadow-sm">
          {products.length} SKUs Identificados
        </span>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Días Inactivo</th>
                <th className="px-6 py-4">Valor (Gs.)</th>
                <th className="px-6 py-4 text-right">Recomendación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{product.product_name}</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">SKU: {product.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold">
                    <span className={product.days_since_last_sale >= 120 ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}>
                      {Math.round(product.days_since_last_sale)} días
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white font-mono">
                    {product.stock_value.toLocaleString('es-PY')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                      product.recommendation.toLowerCase().includes('liquidación') || product.recommendation.toLowerCase().includes('promoción')
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' 
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                    }`}>
                      {product.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic font-medium">
                    No se detectaron productos con inactividad crítica.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => alert(`Generando reporte completo para los ${products.length} productos inactivos...`)}
            className="text-primary text-xs font-black uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto transition-all"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            Descargar Reporte Completo de Inactividad
          </button>
        </div>
      </div>
    </div>
  );
};
