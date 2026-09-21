import React from 'react';
import { useI18n } from '@/lib/i18n';
import { DeadStockProduct } from '../../../types/inventoryAnalytics';
import { formatPYG } from '../../../utils/currencyUtils';

export interface DeadStockTableProps {
  products: DeadStockProduct[];
}

export const DeadStockTable: React.FC<DeadStockTableProps> = ({ products }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-warning/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-warning">inventory_2</span>
          </div>
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
            {t('bi.inventory.risk.deadStockTitle', 'Productos con >90 Días de Inactividad', {})}
          </h3>
        </div>
        <span className="text-xs font-black bg-inverse-background text-white px-3 py-1 rounded-full uppercase tracking-widest font-mono shadow-sm">
          {t('bi.inventory.risk.skusIdentified', '{n} SKUs Identificados', { n: products.length })}
        </span>
      </div>
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border-subtle text-[10px] font-black uppercase tracking-widest text-on-surface-deep">
                <th className="px-6 py-4">{t('bi.inventory.col.product', 'Producto', {})}</th>
                <th className="px-6 py-4">{t('bi.inventory.risk.col.daysIdle', 'Días Inactivo', {})}</th>
                <th className="px-6 py-4 text-right">{t('bi.inventory.col.value', 'Valor', {})}</th>
                <th className="px-6 py-4 text-right">{t('bi.inventory.risk.col.recommendation', 'Recomendación', {})}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-surface-muted transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">{product.product_name}</span>
                      <span className="text-[10px] font-mono text-on-surface-deep uppercase tracking-tighter">
                        {t('bi.inventory.risk.sku', 'SKU: {sku}', { sku: product.sku })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold">
                    <span className={product.days_since_last_sale >= 120 ? 'text-error' : 'text-on-surface-deep'}>
                      {t('bi.inventory.days', '{n} días', { n: Math.round(product.days_since_last_sale) })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-foreground font-mono text-right">
                    {formatPYG(product.stock_value)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                      product.recommendation.toLowerCase().includes('liquidación') || product.recommendation.toLowerCase().includes('promoción')
                      ? 'bg-warning/10 text-warning border-warning/20'
                      : 'bg-error/10 text-error border-error/20'
                    }`}>
                      {product.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-on-surface-deep italic font-medium">
                    {t('bi.inventory.risk.deadStockEmpty', 'No se detectaron productos con inactividad crítica.', {})}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
