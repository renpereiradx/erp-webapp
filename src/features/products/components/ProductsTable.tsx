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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductEnriched } from '@/domain/products/models';
import { getProductBaseUnitPrice } from '@/utils/productUtils';

interface ProductsTableProps {
  products: ProductEnriched[];
  onOpenDetailsModal: (product: ProductEnriched) => void;
  onOpenEditModal: (product: ProductEnriched) => void;
  children?: React.ReactNode;
}

const headClass = 'text-label-caps uppercase text-on-surface-deep';
const cellClass = 'px-md';
const chipClass =
  'inline-flex items-center rounded-full px-2 py-0.5 text-body-sm-bold uppercase';

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
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
    <Table className="border-separate border-spacing-0">
      <TableHeader className="bg-surface-muted">
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className={cn(headClass, 'py-md px-md')}>
            {t('products.table.product_name')}
          </TableHead>
          <TableHead className={cn(headClass, 'py-md px-md')}>
            {t('products.table.category')}
          </TableHead>
          <TableHead className={cn(headClass, 'py-md px-md')}>
            {t('products.table.iva', 'IVA')}
          </TableHead>
          <TableHead className={cn(headClass, 'py-md px-md text-right')}>
            {t('products.table.stock')}
          </TableHead>
          <TableHead className={cn(headClass, 'py-md px-md text-right')}>
            <div className="flex flex-col">
              <span>{t('products.table.cost_purchase', 'Costo de Compra')}</span>
              <span className="normal-case tracking-normal">
                {t('products.table.cost_neto', 'Neto')}
              </span>
            </div>
          </TableHead>
          <TableHead className={cn(headClass, 'py-md px-md text-right')}>
            <div className="flex flex-col">
              <span>{t('products.table.price_sale', 'Precio de Venta')}</span>
              <span className="normal-case tracking-normal">
                {t('products.table.price_pvp', 'P.V.P. (Con IVA)')}
              </span>
            </div>
          </TableHead>
          <TableHead className={cn(headClass, 'py-md px-md')}>
            {t('common.status', 'Estado')}
          </TableHead>
          <TableHead className="text-right py-md pr-lg"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {children}
        {products.map((product) => {
          const productId = String(product.id || product.product_id);
          const productName = product.name || product.product_name || t('field.no_name');
          const categoryName = product.category?.name || product.category_name || '-';
          const stockInfo = getStockDisplay(product);

          // Extraer costo y precio con fallbacks (anclados a la unidad base)
          const baseUnit = product.base_unit || 'unit';
          const purchaseCost =
            (product.unit_costs_summary || []).find(u => u.unit === baseUnit)?.last_cost
            ?? product.purchase_price
            ?? 0;
          const salesPrice = product.price ?? getProductBaseUnitPrice(product) ?? 0;
          const isAvailable = product.state !== false;

          return (
            <TableRow
              key={productId}
              className="hover:bg-surface-muted transition-colors duration-150 group border-none"
            >
              <TableCell className="py-md px-md">
                <div className="flex items-center gap-md">
                  <div className="size-10 bg-surface-muted rounded-sm border border-border-subtle flex items-center justify-center overflow-hidden text-on-surface-deep shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex flex-col gap-xs">
                    <span
                      className="text-body-md-bold text-foreground cursor-pointer hover:text-primary transition-colors duration-150"
                      onClick={() => onOpenDetailsModal(product)}
                    >
                      {productName}
                    </span>
                    {product.is_variable_measure && (
                      <span className={cn(chipClass, 'bg-tertiary-fixed text-on-tertiary-fixed w-max')}>
                        {t('products.table.variable_measure', 'Medida Variable')}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className={cn(cellClass, 'text-body-md text-on-surface-deep')}>
                {categoryName}
              </TableCell>
              <TableCell className={cellClass}>
                <span className={cn(chipClass, 'bg-primary-fixed text-on-primary-fixed')}>
                  {product.applied_tax_name ||
                    product.tax_rate_name ||
                    product.tax_rate_code ||
                    '10% (STD)'}
                </span>
              </TableCell>
              <TableCell className={cn(cellClass, 'text-right')}>
                <span
                  className={cn(
                    'text-data-mono font-data-mono',
                    stockInfo.isLow ? 'text-error' : 'text-foreground'
                  )}
                >
                  {stockInfo.display}{' '}
                  <span className="text-label-caps uppercase text-on-surface-deep">
                    {product.base_unit || 'unit'}
                  </span>
                </span>
              </TableCell>
              <TableCell className={cn(cellClass, 'text-right')}>
                <div className="flex flex-col items-end gap-xs">
                  <span className="text-data-mono font-data-mono text-on-surface-deep">
                    {formatCurrency(purchaseCost)}
                  </span>
                  <span className="text-label-caps uppercase text-on-surface-deep">
                    {t('products.table.cost_neto', 'Neto')}
                  </span>
                </div>
              </TableCell>
              <TableCell className={cn(cellClass, 'text-right')}>
                <div className="flex items-center justify-end gap-sm">
                  <div className="flex flex-col items-end gap-xs">
                    <span className="text-data-mono font-data-mono text-foreground">
                      {formatCurrency(salesPrice)}
                    </span>
                    <span className="text-label-caps uppercase text-on-surface-deep">
                      {t('products.table.with_tax', 'Con IVA')}
                    </span>
                  </div>
                  {salesPrice > 0 && purchaseCost > 0 && (
                    <span
                      className={cn(
                        'text-data-mono font-data-mono rounded-full px-2 py-0.5 shrink-0',
                        salesPrice > purchaseCost
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      )}
                    >
                      {Math.round(((salesPrice - purchaseCost) / salesPrice) * 100)}%{' '}
                      {t('products.table.margin', 'marg.')}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className={cellClass}>
                <span
                  className={cn(
                    chipClass,
                    isAvailable ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  )}
                >
                  {isAvailable
                    ? t('products.state.available', 'Disponible')
                    : t('products.state.unavailable', 'No Disponible')}
                </span>
              </TableCell>
              <TableCell className="text-right pr-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`edit-product-${productId}`}
                  aria-label={t('products.details.action.edit', 'Editar')}
                  className="text-on-surface-deep hover:text-primary transition-colors duration-150 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
                  onClick={() => onOpenEditModal(product)}
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
