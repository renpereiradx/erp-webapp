import React from 'react';
import { DeadStockProduct } from '../../../types/inventoryAnalytics';
import { formatPYG } from '../../../utils/currencyUtils';

export interface DeadStockTableProps {
  products: DeadStockProduct[];
}

export const DeadStockTable: React.FC<DeadStockTableProps> = ({ products }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-warning/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-warning">inventory_2</span>
          </div>
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
            Productos con &gt;90 Días de Inactividad
          </h3>
        </div>
        <span className="text-xs font-black bg-inverse-background text-white px-3 py-1 rounded-full uppercase tracking-widest font-mono shadow-sm">
          {products.length} SKUs Identificados
        </span>
      </div>
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border-subtle text-[10px] font-black uppercase tracking-widest text-on-surface-deep">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Días Inactivo</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-right">Recomendación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-surface-muted:bg-surface-deep/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">{product.product_name}</span>
                      <span className="text-[10px] font-mono text-on-surface-deep uppercase tracking-tighter">SKU: {product.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold">
                    <span className={product.days_since_last_sale >= 120 ? 'text-error' : 'text-on-surface-deep dark:text-on-surface-deep'}>
                      {Math.round(product.days_since_last_sale)} días
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-foreground font-mono text-right">
                    {formatPYG(product.stock_value)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                      product.recommendation.toLowerCase().includes('liquidación') || product.recommendation.toLowerCase().includes('promoción')
                      ? 'bg-warning/10 text-warning border-warning/20 dark:bg-warning/10/20 dark:text-warning dark:border-warning/20' 
                      : 'bg-error/10 text-error border-error/20 dark:bg-error/10/20 dark:text-error dark:border-rose-800'
                    }`}>
                      {product.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-on-surface-deep italic font-medium">
                    No se detectaron productos con inactividad crítica.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-surface-muted text-center border-t border-border-subtle">
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
