import React, { useEffect, useRef } from 'react';
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
   * Ítem seleccionado (fila bajo el mouse o elegida con ↑/↓): los atajos
   * globales Alt+Q (editar detalles) y Alt+X (quitar) operan sobre él y la
   * fila se resalta. La selección es PERSISTENTE: no se limpia al salir con
   * el mouse — el padre guarda el id.
   */
  activeItemId?: string | null;
  onActiveItemChange?: (id: string | null) => void;
  /** Acción del empty state (foco al buscador, F2). Opcional: sin ella no hay botón. */
  onEmptyAction?: () => void;
}

const ShortcutHint = ({ keys }: { keys: string }) => (
  <span className="block font-data-mono text-body-sm text-outline-fg leading-none">
    [{keys}]
  </span>
);

type TFn = (key: string, fallback?: string, vars?: Record<string, unknown>) => string;

/**
 * FASE 5 (stock en caja): los ítems cargados desde un pedido de mostrador
 * viajan con el stock resuelto al leer. Si ya no alcanza —otra venta pagada
 * lo consumió, el pedido no reserva— la fila lo grita antes del error seco
 * del checkout. null = no aplica (sin dato de stock o cantidad cubierta).
 */
function stockBadgeLabel(item: { stock?: number; quantity: number }, t: TFn): string | null {
  if (item.stock == null || item.stock >= item.quantity) return null;
  if (item.stock <= 0) return t('sales.cart.outOfStock', 'Sin stock');
  return t('sales.cart.lowStock', 'Stock insuficiente: {stock}', { stock: item.stock });
}

export const SalesCartGrid: React.FC<SalesCartGridProps> = ({
  items,
  onEditItem,
  onRemoveItem,
  getItemBaseUnitPrice,
  getItemLineDiscount,
  getItemLineTotal,
  activeItemId,
  onActiveItemChange,
  onEmptyAction,
}) => {
  const { t } = useI18n();

  const setActive = (id: string | null) => onActiveItemChange?.(id);
  // La fila seleccionada por teclado (↑/↓) puede quedar fuera del viewport
  // cuando el carrito desborda: llevarla a la vista (scrollIntoView no existe
  // en jsdom → optional call).
  const desktopTableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeItemId) return;
    const row = desktopTableRef.current?.querySelector<HTMLElement>(
      `[data-cart-row="${activeItemId}"]`,
    );
    row?.scrollIntoView?.({ block: 'nearest' });
  }, [activeItemId]);
  // La columna Desc. solo se muestra cuando hay descuentos: en el caso común
  // (sin descuentos) libera ancho para el nombre del producto en el POS.
  const hasDiscounts = items.some((item) => getItemLineDiscount(item) > 0);
  // Label de stock por fila, calculado UNA vez por render (no dos por celda).
  // useI18n es JS: su t llega sin firma (patrón repo: cast local a TFn).
  const stockLabels = new Map(
    items.map((item) => [item.id, stockBadgeLabel(item, t as unknown as TFn)] as const),
  );

  // Empty state solo para la vista mobile (cards, sin tabla). En desktop la
  // tabla se renderiza siempre y el empty vive dentro (receta §6.3 DESIGN.md).
  const emptyState = (
    <EmptyState
      icon={ShoppingCart}
      title={t('sales.cart.empty', 'Carrito vacío')}
      description={t('sales.cart.emptyHint', 'Buscá un producto arriba para agregarlo (F2 foco en búsqueda).')}
      actionLabel={t('sales.cart.emptyAction', 'Buscar producto (F2)')}
      onAction={onEmptyAction}
      size="medium"
      variant="instruction"
      data-testid="sales-cart-empty"
    />
  );

  return (
    <div className="overflow-x-auto">
      {/* Vista de tabla (desktop) — anatomía canónica "card con tabla"
          (DESIGN.md §6.3): tabla full-bleed sin recuadro interno; el empty
          state vive DENTRO de la tabla (fila colSpan) igual que el carrito
          de /compras. El componente EmptyState queda para la vista mobile. */}
      <div ref={desktopTableRef} className="hidden md:block">
        <Table className="table-fixed">
          <TableHeader className="bg-surface-muted">
            <TableRow className="hover:bg-surface-muted border-0">
              <TableHead className="w-24 px-sm py-sm text-label-caps uppercase text-on-surface-deep">
                {t('sales.cart.col.id', 'SKU')}
              </TableHead>
              <TableHead className="px-sm py-sm text-label-caps uppercase text-on-surface-deep">
                {t('sales.cart.col.product', 'Producto')}
              </TableHead>
              <TableHead className="w-[88px] px-sm py-sm text-label-caps uppercase text-on-surface-deep text-right">
                {t('sales.cart.col.qty', 'Cant.')}
              </TableHead>
              <TableHead className="w-[120px] px-sm py-sm text-label-caps uppercase text-on-surface-deep text-right">
                {t('sales.cart.col.price', 'Precio')}
              </TableHead>
              {hasDiscounts && (
                <TableHead className="w-[96px] px-sm py-sm text-label-caps uppercase text-on-surface-deep text-right">
                  {t('sales.cart.col.discount', 'Desc.')}
                </TableHead>
              )}
              <TableHead className="w-[128px] px-sm py-sm text-label-caps uppercase text-on-surface-deep text-right">
                {t('sales.cart.col.total', 'Total')}
              </TableHead>
              <TableHead className="w-[84px] px-sm py-sm">
                <span className="sr-only">{t('sales.cart.col.actions', 'Acciones')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent border-0">
                <TableCell colSpan={hasDiscounts ? 7 : 6} className="py-xl">
                  <div
                    className="flex flex-col items-center justify-center gap-sm text-on-surface-deep"
                    data-testid="sales-cart-empty"
                  >
                    <div className="size-16 rounded-full bg-surface-muted flex items-center justify-center">
                      <ShoppingCart size={28} strokeWidth={1.5} className="text-outline-fg" aria-hidden="true" />
                    </div>
                    <p className="text-body-md-bold text-foreground">
                      {t('sales.cart.empty', 'Carrito vacío')}
                    </p>
                    <p className="text-body-sm text-on-surface-deep">
                      {t('sales.cart.emptyHint', 'Buscá un producto arriba para agregarlo (F2 foco en búsqueda).')}
                    </p>
                    {onEmptyAction && (
                      <Button variant="secondary" size="sm" onClick={onEmptyAction} data-testid="empty-action">
                        {t('sales.cart.emptyAction', 'Buscar producto (F2)')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  tabIndex={-1}
                  data-testid={`sales-cart-row-${item.id}`}
                  data-cart-row={item.id}
                  // Selección PERSISTENTE: el hover/foco la mueve pero jamás
                  // la limpia — Alt+Q/Alt+X siempre tienen un ítem seleccionado.
                  onMouseEnter={() => setActive(item.id)}
                  onFocus={() => setActive(item.id)}
                  className={cn(
                    'hover:bg-surface-muted transition-colors duration-150',
                    item.isFromPendingSale && 'bg-surface-subtle',
                    activeItemId === item.id && !item.isFromPendingSale && 'bg-primary-container/20',
                  )}
                >
                  <TableCell className="px-sm py-sm text-body-md text-outline-fg font-data-mono align-top">
                    {/* SKUs largos desbordan la celda fija y pintan encima de
                        la columna Producto: truncar. Sin sku (ítems de venta
                        pendiente vieja) cae al id de producto. */}
                    <div className="truncate" title={String(item.sku || item.productId || '-')}>
                      {item.sku || item.productId || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="px-sm py-sm text-body-md-bold text-foreground align-top">
                    <div className="flex items-start gap-2">
                      {item.isFromPendingSale && (
                        <Badge variant="secondary" size="sm">
                          {t('sales.cart.processedBadge', 'Procesado')}
                        </Badge>
                      )}
                      {stockLabels.get(item.id) && (
                        <Badge variant="destructive" size="sm" data-testid={`sales-cart-stock-${item.id}`}>
                          {stockLabels.get(item.id)}
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
                  <TableCell className="px-sm py-sm text-right align-top whitespace-nowrap">
                    <span className="font-data-mono text-body-md text-foreground">
                      {formatNumber(item.quantity)}
                    </span>{' '}
                    <span className="text-body-sm text-outline-fg">{item.unit}</span>
                    <ShortcutHint keys="Alt+Q" />
                  </TableCell>
                  <TableCell className="px-sm py-sm text-right text-body-md text-on-surface-deep font-data-mono align-top whitespace-nowrap">
                    {formatCurrency(getItemBaseUnitPrice(item))}
                  </TableCell>
                  {hasDiscounts && (
                    <TableCell className="px-sm py-sm text-right text-body-md text-error font-data-mono align-top whitespace-nowrap">
                      -{formatCurrency(getItemLineDiscount(item))}
                    </TableCell>
                  )}
                  <TableCell className="px-sm py-sm text-right font-data-mono text-body-md-bold text-foreground align-top whitespace-nowrap">
                    {formatCurrency(getItemLineTotal(item))}
                  </TableCell>
                  <TableCell className="px-sm py-sm text-right align-top whitespace-nowrap">
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista de tarjetas (mobile) */}
      <div className="md:hidden divide-y divide-divider">
        {items.length === 0 ? (
          emptyState
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn('py-md space-y-sm px-sm transition-colors duration-150', item.isFromPendingSale && 'bg-surface-subtle')}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="text-body-sm text-outline-fg font-data-mono mb-0.5 truncate" title={String(item.productId || '-')}>
                    #{item.productId || '-'}
                  </p>
                  <h4 className="text-body-md-bold text-foreground leading-tight">
                    {item.isFromPendingSale && (
                      <Badge variant="secondary" size="sm" className="mr-1.5 align-middle">
                        {t('sales.cart.processedBadge', 'Procesado')}
                      </Badge>
                    )}
                    {stockLabels.get(item.id) && (
                      <Badge variant="destructive" size="sm" className="mr-1.5 align-middle" data-testid={`sales-cart-stock-${item.id}`}>
                        {stockLabels.get(item.id)}
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

              <div className="grid grid-cols-3 gap-sm bg-surface-subtle p-md rounded-md">
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
