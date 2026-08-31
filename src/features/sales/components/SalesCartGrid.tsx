import React from 'react';
import { MoreVertical, X, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface SalesCartGridProps {
  items: any[];
  onEditItem: (item: any) => void;
  onRemoveItem: (id: string) => void;
  getItemBaseUnitPrice: (item: any) => number;
  getItemLineDiscount: (item: any) => number;
  getItemLineTotal: (item: any) => number;
  /**
   * Ítem "activo" (fila en hover/foco): los atajos globales Alt+Q (editar
   * cantidad) y Alt+X (quitar) operan sobre él. El padre guarda el id.
   */
  activeItemId?: string | null;
  onActiveItemChange?: (id: string | null) => void;
}

const ShortcutHint = ({ keys }: { keys: string }) => (
  <span className="block font-data-mono text-body-sm text-outline-fg leading-none">
    [{keys}]
  </span>
);

export const SalesCartGrid: React.FC<SalesCartGridProps> = ({
  items,
  onEditItem,
  onRemoveItem,
  getItemBaseUnitPrice,
  getItemLineDiscount,
  getItemLineTotal,
  activeItemId,
  onActiveItemChange,
}) => {
  const { t } = useI18n();

  const setActive = (id: string | null) => onActiveItemChange?.(id);
  // La columna Desc. solo se muestra cuando hay descuentos: en el caso común
  // (sin descuentos) libera ancho para el nombre del producto en el POS.
  const hasDiscounts = items.some((item) => getItemLineDiscount(item) > 0);

  const emptyState = (
    <EmptyState
      icon={ShoppingCart}
      title={t('sales.cart.empty', 'Carrito vacío')}
      description={t('sales.cart.emptyHint', 'Buscá un producto arriba para agregarlo (F2 foco en búsqueda).')}
      size="medium"
      variant="instruction"
      data-testid="sales-cart-empty"
    />
  );

  return (
    <div className="overflow-x-auto">
      {/* Vista de tabla (desktop) */}
      <div className="hidden md:block">
        {items.length === 0 ? (
          emptyState
        ) : (
          <div className="rounded-md border border-border-subtle overflow-hidden">
            <Table className="table-fixed">
              <TableHeader className="bg-surface-muted">
                <TableRow className="hover:bg-surface-muted">
                  <TableHead className="w-14 px-3 text-label-caps uppercase text-on-surface-deep">
                    {t('sales.cart.col.id', 'ID')}
                  </TableHead>
                  <TableHead className="px-3 text-label-caps uppercase text-on-surface-deep">
                    {t('sales.cart.col.product', 'Producto')}
                  </TableHead>
                  <TableHead className="w-[88px] px-3 text-label-caps uppercase text-on-surface-deep text-right">
                    {t('sales.cart.col.qty', 'Cant.')}
                  </TableHead>
                  <TableHead className="w-[120px] px-3 text-label-caps uppercase text-on-surface-deep text-right">
                    {t('sales.cart.col.price', 'Precio')}
                  </TableHead>
                  {hasDiscounts && (
                    <TableHead className="w-[96px] px-3 text-label-caps uppercase text-on-surface-deep text-right">
                      {t('sales.cart.col.discount', 'Desc.')}
                    </TableHead>
                  )}
                  <TableHead className="w-[128px] px-3 text-label-caps uppercase text-on-surface-deep text-right">
                    {t('sales.cart.col.total', 'Total')}
                  </TableHead>
                  <TableHead className="w-[84px] px-3">
                    <span className="sr-only">{t('sales.cart.col.actions', 'Acciones')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    tabIndex={-1}
                    onMouseEnter={() => setActive(item.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(item.id)}
                    onBlur={() => setActive(null)}
                    className={cn(
                      'hover:bg-surface-muted transition-colors duration-150',
                      item.isFromPendingSale && 'bg-surface-subtle',
                      activeItemId === item.id && !item.isFromPendingSale && 'bg-primary-container/20',
                    )}
                  >
                    <TableCell className="px-3 text-body-md text-outline-fg font-data-mono align-top">
                      {item.productId || '-'}
                    </TableCell>
                    <TableCell className="px-3 text-body-md-bold text-foreground align-top">
                      <div className="flex items-start gap-2">
                        {item.isFromPendingSale && (
                          <Badge variant="secondary" size="sm">
                            {t('sales.cart.processedBadge', 'Procesado')}
                          </Badge>
                        )}
                        <div className="min-w-0">
                          <p className="truncate" title={item.name}>{item.name}</p>
                          <p className="text-body-sm text-outline-fg font-normal mt-0.5">
                            {t('sales.cart.unitLabel', 'Unidad')}: {item.unit}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 text-right align-top whitespace-nowrap">
                      <span className="font-data-mono text-body-md text-foreground">
                        {formatNumber(item.quantity)}
                      </span>{' '}
                      <span className="text-body-sm text-outline-fg">{item.unit}</span>
                      <ShortcutHint keys="Alt+Q" />
                    </TableCell>
                    <TableCell className="px-3 text-right text-body-md text-on-surface-deep font-data-mono align-top whitespace-nowrap">
                      {formatCurrency(getItemBaseUnitPrice(item))}
                    </TableCell>
                    {hasDiscounts && (
                      <TableCell className="px-3 text-right text-body-md text-error font-data-mono align-top whitespace-nowrap">
                        -{formatCurrency(getItemLineDiscount(item))}
                      </TableCell>
                    )}
                    <TableCell className="px-3 text-right font-data-mono text-body-md-bold text-foreground align-top whitespace-nowrap">
                      {formatCurrency(getItemLineTotal(item))}
                    </TableCell>
                    <TableCell className="px-3 text-right align-top whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditItem(item)}
                          disabled={item.isFromPendingSale}
                          aria-label={t('sales.cart.editAria', 'Editar producto')}
                          className="size-8 text-outline-fg hover:text-primary hover:bg-primary-container rounded-button"
                        >
                          <MoreVertical size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveItem(item.id)}
                          disabled={item.isFromPendingSale}
                          aria-label={t('sales.cart.removeAria', 'Quitar producto')}
                          className="size-8 text-outline-fg hover:text-error hover:bg-error-container rounded-button"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                      <ShortcutHint keys="Alt+X" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Vista de tarjetas (mobile) */}
      <div className="md:hidden divide-y divide-divider">
        {items.length === 0 ? (
          emptyState
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn('py-4 space-y-3 px-2 transition-colors duration-150', item.isFromPendingSale && 'bg-surface-subtle')}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="text-body-sm text-outline-fg font-data-mono mb-0.5">#{item.productId || '-'}</p>
                  <h4 className="text-body-md-bold text-foreground leading-tight">
                    {item.isFromPendingSale && (
                      <Badge variant="secondary" size="sm" className="mr-1.5 align-middle">
                        {t('sales.cart.processedBadge', 'Procesado')}
                      </Badge>
                    )}
                    {item.name}
                  </h4>
                  <p className="text-body-sm text-outline-fg mt-0.5">
                    {t('sales.cart.unitLabel', 'Unidad')}: {item.unit}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEditItem(item)}
                    disabled={item.isFromPendingSale}
                    aria-label={t('sales.cart.editAria', 'Editar producto')}
                    className="size-8 rounded-button"
                  >
                    <MoreVertical size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={item.isFromPendingSale}
                    aria-label={t('sales.cart.removeAria', 'Quitar producto')}
                    className="size-8 rounded-button text-error"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-surface-subtle p-3 rounded-md">
                <div>
                  <p className="text-label-caps text-on-surface-deep mb-0.5">{t('sales.cart.col.qty', 'Cant.')}</p>
                  <p className="text-body-md-bold font-data-mono text-foreground">
                    {formatNumber(item.quantity)} {item.unit}
                  </p>
                </div>
                <div>
                  <p className="text-label-caps text-on-surface-deep mb-0.5">{t('sales.cart.unitPrice', 'Unitario')}</p>
                  <p className="text-body-md-bold font-data-mono text-foreground">
                    {formatCurrency(getItemBaseUnitPrice(item))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-label-caps text-on-surface-deep mb-0.5">{t('sales.cart.lineTotal', 'Total Línea')}</p>
                  <p className="text-body-md-bold font-data-mono text-primary">
                    {formatCurrency(getItemLineTotal(item))}
                  </p>
                </div>
              </div>

              {getItemLineDiscount(item) > 0 && (
                <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-error-container/50">
                  <span className="text-label-caps uppercase text-on-surface-deep">
                    {t('sales.cart.appliedDiscount', 'Descuento Aplicado')}
                  </span>
                  <span className="text-body-md-bold font-data-mono text-error">
                    -{formatCurrency(getItemLineDiscount(item))}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
