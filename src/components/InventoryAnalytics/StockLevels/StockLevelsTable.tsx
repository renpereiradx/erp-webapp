import React from 'react';
import { useI18n } from '@/lib/i18n';
import { StockLevelProduct, ReorderProduct, StockStatus } from '../../../types/inventoryAnalytics';
import { formatNumber, formatPYG } from '../../../utils/currencyUtils';

// La tabla unifica filas de stock-levels (status canónico) y reorder
// (priority legacy); los campos exclusivos de cada fuente son opcionales.
export type StockLevelsTableRow = Partial<StockLevelProduct> & Partial<ReorderProduct> & {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  status?: StockStatus | string;
};

export interface StockLevelsTableProps {
  products: StockLevelsTableRow[];
  totalItems?: number;
}

export const StockLevelsTable: React.FC<StockLevelsTableProps> = ({ products, totalItems = 0 }) => {
  const { t } = useI18n();

  // H7: el footer de la tabla tenía un pager falso (Anterior disabled /
  // Siguiente sin handler) — la paginación real es responsabilidad de la
  // página; el botón more_vert por fila no tenía handler. Fuera ambos.
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success">
            {t('bi.inventory.stockStatus.inStock', 'En Stock', {})}
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/10 text-warning">
            {t('bi.inventory.stock.badge.low', 'Bajo', {})}
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-error/10 text-error">
            {t('bi.inventory.stock.badge.out', 'Agotado', {})}
          </span>
        );
      case 'OVERSTOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
            {t('bi.inventory.stockStatus.over', 'Sobre-stock', {})}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden font-display">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted border-b border-border-subtle text-on-surface-deep text-[10px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4">{t('bi.inventory.col.product', 'Producto', {})}</th>
              <th className="py-3 px-4">{t('bi.inventory.stock.col.skuCategory', 'SKU / Categoría', {})}</th>
              <th className="py-3 px-4 text-center">{t('bi.inventory.stock.col.stockMin', 'Stock / Mín', {})}</th>
              <th className="py-3 px-4 text-center">{t('bi.inventory.stock.col.daysStock', 'Días Stock', {})}</th>
              <th className="py-3 px-4 text-center">{t('bi.inventory.col.status', 'Status', {})}</th>
              <th className="py-3 px-4 text-right">{t('bi.inventory.stock.col.unitCost', 'Costo Unit.', {})}</th>
              <th className="py-3 px-4 text-right">{t('bi.inventory.stock.col.totalValue', 'Valor Total', {})}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {products.map((product) => {
              // Soporte para variaciones de nombres de campo entre endpoints:
              // stock-levels usa status canónico; reorder expone priority legacy
              const resolveStatus = () => {
                const raw = String(product.status || product.priority || '');
                if (raw === 'URGENT' || raw === 'OUT_OF_STOCK') return 'OUT_OF_STOCK';
                if (raw === 'HIGH' || raw === 'LOW_STOCK' || raw === 'MEDIUM') return 'LOW_STOCK';
                if (raw === 'OVERSTOCK') return 'OVERSTOCK';
                return 'IN_STOCK';
              };

              const status = resolveStatus();
              const daysStock = product.days_of_stock ?? product.days_until_stockout ?? 0;
              const unitCost = product.unit_cost ?? 0;
              const totalValue = product.stock_value ?? product.estimated_cost ?? 0;

              return (
                <tr key={product.product_id} className="text-sm hover:bg-surface-muted transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded bg-surface-muted flex items-center justify-center text-on-surface-deep">
                        <span className="material-symbols-outlined text-xl">package_2</span>
                      </div>
                      <span className="font-bold text-foreground">{product.product_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-on-surface-deep">{product.sku}</span>
                        <span className="text-xs text-on-surface-deep">{product.category_name}</span>
                      </div>

                      {product.brand_name && (
                        <span className="text-[10px] text-on-surface-deep font-semibold bg-surface-muted px-1.5 py-0.5 rounded w-fit mt-0.5">
                          {product.brand_name}
                        </span>
                      )}

                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {product.tags.map(tag => (
                            <span key={tag} className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-mono">
                    <div className="flex flex-col">
                      <span className="font-black">{product.current_stock}</span>
                      <span className="text-[10px] text-on-surface-deep">
                        {t('bi.inventory.stock.min', 'Mín: {n}', { n: product.min_stock })}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-mono">
                    <span className={`font-bold ${daysStock <= 5 ? 'text-error' : 'text-foreground'}`}>
                      {formatNumber(daysStock)} d
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {getStatusBadge(status)}
                  </td>
                  <td className="py-4 px-4 text-right font-medium font-mono">
                    {formatPYG(unitCost || 0)}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-primary font-mono">
                    {formatPYG(totalValue || 0)}
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-on-surface-deep italic font-medium">
                  {t('bi.inventory.stock.empty', 'Sin productos que coincidan con los filtros.', {})}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-surface-muted px-4 py-3 flex items-center justify-between border-t border-border-subtle font-mono">
        <p className="text-xs text-on-surface-deep">
          {t('bi.inventory.stock.showing', 'Mostrando {a} de {b} productos', { a: products.length, b: totalItems || products.length })}
        </p>
      </div>
    </div>
  );
};
