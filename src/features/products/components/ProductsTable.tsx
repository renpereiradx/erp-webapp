import React from 'react';
import { Package, MoreVertical } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductEnriched } from '@/domain/products/models';

interface ProductsTableProps {
  products: ProductEnriched[];
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelectProduct: (id: string) => void;
  onOpenDetailsModal: (product: ProductEnriched) => void;
  onOpenEditModal: (product: ProductEnriched) => void;
  children?: React.ReactNode;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectProduct,
  onOpenDetailsModal,
  onOpenEditModal,
  children,
}) => {
  const { t } = useI18n();

  const getStockDisplay = (product: any) => {
    const stock = product.stock_quantity ?? product.stock ?? product.quantity ?? 0;
    const isLow = stock < 10;

    return {
      display: isLow ? t('products.stock.low', { quantity: stock }) : stock.toString(),
      isLow,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <Table>
      <TableHeader className="bg-slate-50/80 border-b border-border-subtle">
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className="w-[60px] text-center px-6">
            <Checkbox
              checked={selectedIds.length === products.length && products.length > 0}
              onCheckedChange={onToggleSelectAll}
              className="border-slate-300"
            />
          </TableHead>
          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">
            {t('products.table.product_name')}
          </TableHead>
          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">
            {t('products.table.category')}
          </TableHead>
          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">
            IVA
          </TableHead>
          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">
            {t('products.table.stock')}
          </TableHead>
          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">
            <div className="flex flex-col">
              <span>{t('products.modal.field.purchase_price', 'Costo de Compra')}</span>
              <span className="text-[9px] font-semibold text-slate-400 normal-case tracking-normal mt-0.5 font-sans">Costo Neto Adq.</span>
            </div>
          </TableHead>
          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">
            <div className="flex flex-col">
              <span>{t('products.details.table.price', 'Precio de Venta')}</span>
              <span className="text-[9px] font-semibold text-slate-400 normal-case tracking-normal mt-0.5 font-sans">P.V.P. (Con IVA)</span>
            </div>
          </TableHead>
          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">
            {t('products.table.created_at', 'Creado')}
          </TableHead>
          <TableHead className="text-right py-4 px-6"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {children}
        {products.map((product) => {
          const productId = String(product.id || product.product_id);
          const productName = product.name || product.product_name || t('field.no_name');
          const categoryName = product.category?.name || product.category_name || '-';
          const isSelected = selectedIds.includes(productId);
          const stockInfo = getStockDisplay(product);

          // Extraer costo y precio con fallbacks
          const purchaseCost =
            product.purchase_price ?? product.unit_costs_summary?.[0]?.last_cost ?? 0;
          const salesPrice = product.price ?? product.unit_prices?.[0]?.price_per_unit ?? 0;

          return (
            <TableRow
              key={productId}
              data-state={isSelected ? "selected" : undefined}
              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
            >
              <TableCell className="px-6 text-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelectProduct(productId)}
                  className="border-slate-300"
                />
              </TableCell>
              <TableCell className="py-5 px-4">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center border border-border-subtle overflow-hidden text-slate-400 shadow-sm shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={20} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className="font-bold text-text-main cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onOpenDetailsModal(product)}
                    >
                      {productName}
                    </span>
                    {product.is_variable_measure && (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded mt-1 w-max uppercase tracking-wider font-display">
                        Medida Variable
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-text-secondary font-medium px-4 text-sm">
                {categoryName}
              </TableCell>
              <TableCell className="px-4">
                <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-tighter">
                  {product.applied_tax_name ||
                    product.tax_rate_name ||
                    product.tax_rate_code ||
                    '10% (STD)'}
                </span>
              </TableCell>
              <TableCell className="px-4">
                <span
                  className={cn(
                    'font-black font-mono',
                    stockInfo.isLow ? 'text-error' : 'text-text-main'
                  )}
                >
                  {stockInfo.display}
                </span>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-secondary tabular-nums">
                    {formatCurrency(purchaseCost)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Neto</span>
                </div>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-primary tabular-nums">
                      {formatCurrency(salesPrice)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Con IVA</span>
                  </div>
                  {salesPrice > 0 && purchaseCost > 0 && (
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0",
                      salesPrice > purchaseCost 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : "bg-rose-50 text-rose-700 border border-rose-100"
                    )}>
                      {Math.round(((salesPrice - purchaseCost) / salesPrice) * 100)}% marg.
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-text-secondary tabular-nums px-4 text-xs font-mono">
                {product.created_at
                  ? new Date(product.created_at).toLocaleDateString('es-ES')
                  : '-'}
              </TableCell>
              <TableCell className="text-right px-6">
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`edit-product-${productId}`}
                  className="text-text-secondary hover:text-primary transition-colors size-8 rounded opacity-0 group-hover:opacity-100"
                  onClick={() => onOpenEditModal(product)}
                >
                  <MoreVertical size={18} />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
