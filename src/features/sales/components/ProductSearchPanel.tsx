/**
 * ProductSearchPanel — buscador de productos del POS + dropdown de resultados.
 *
 * Presentacional: el estado (término, resultados, highlight, cantidad) vive en
 * SalesNew.tsx y llega por props; los handlers globales de teclado sobre el
 * input (flechas / Enter / barcode / Escape) también quedan en SalesNew porque
 * escuchan a nivel document contra el ref del input.
 *
 * El panel maneja solo el teclado del input de cantidad del dropdown
 * (Enter = agregar, Escape = cerrar, flechas = navegar resultados).
 */
import React from 'react';
import { Layers, Search, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';
import { isDecimalUnit } from '@/constants/units';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import {
  availableStockFor,
  isBlockedByStock,
  maxSellableQty,
  requiresStock,
  stockBadgeKind,
} from '@/domain/products/sellability';

export interface SearchResultProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  base_unit: string;
  has_valid_price: boolean;
  has_variants?: boolean;
  product_type?: string;
}

export interface ProductSearchPanelProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  searchInputRef: React.Ref<HTMLInputElement>;
  qtyInputRef: React.Ref<HTMLInputElement>;
  results: SearchResultProduct[];
  open: boolean;
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  selectedQty: number | string;
  onSelectedQtyChange: (value: number | string) => void;
  /** Click o Enter sobre el resultado: agrega (o abre variantes) en el padre. */
  onProductClick: (product: SearchResultProduct, qty: number) => void;
  onClose: () => void;
  /** Cantidad ya agregada al carrito de un producto (stock virtual). */
  getQuantityInCart: (productId: string) => number;
}

/** Normaliza la cantidad tipeada al rango válido [minQty, available]. */
export const clampRequestedQty = (
  qty: number,
  available: number,
  allowDecimal: boolean,
): number => {
  const minQty = allowDecimal ? 0.01 : 1;
  let val = Number.isNaN(qty) || qty <= 0 ? minQty : qty;
  if (!allowDecimal) val = Math.floor(val);
  return Math.min(Math.max(val, minQty), Math.max(available, minQty));
};

export const ProductSearchPanel: React.FC<ProductSearchPanelProps> = ({
  searchTerm,
  onSearchTermChange,
  searchInputRef,
  qtyInputRef,
  results,
  open,
  highlightedIndex,
  onHighlight,
  selectedQty,
  onSelectedQtyChange,
  onProductClick,
  onClose,
  getQuantityInCart,
}) => {
  const { t } = useI18n();
  const toast = useToast();

  const handleQtyKeyDown = (event: React.KeyboardEvent, product: SearchResultProduct) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const quantityInCart = getQuantityInCart(product.id);
      const maxQty = maxSellableQty(product, quantityInCart);
      const qty = clampRequestedQty(
        parseFloat(String(selectedQty)),
        maxQty,
        isDecimalUnit(product.base_unit),
      );
      if (qty > maxQty || qty <= 0) {
        toast.error(t('sales.search.invalidQty', 'Cantidad inválida'));
        return;
      }
      onProductClick(product, qty);
    } else if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      onHighlight(Math.max(0, highlightedIndex - 1));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      onHighlight(Math.min(results.length - 1, highlightedIndex + 1));
    }
    event.stopPropagation();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline-fg" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={t(
            'sales.search.placeholder',
            'Buscar producto por código, nombre o código de barras... (F2)',
          )}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-9 h-11 text-body-md border-divider focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-sm"
          aria-label={t('sales.search.placeholder', 'Buscar producto por código, nombre o código de barras')}
        />
      </div>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 bg-surface rounded-md shadow-fluent-8 border border-border-subtle overflow-x-hidden max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
          aria-label={t('sales.search.resultsAria', 'Resultados de búsqueda')}
        >
          <div className="p-1">
            {results.map((product, index) => {
              const isHighlighted = index === highlightedIndex;
              const quantityInCart = getQuantityInCart(product.id);
              const availableStock = availableStockFor(product, quantityInCart);
              const isOutOfStock = isBlockedByStock(product, quantityInCart);
              const badgeKind = stockBadgeKind(product);

              return (
                <div key={product.id ? `search-product-${product.id}` : `search-product-index-${index}`} className="w-full mb-0.5 last:mb-0">
                  <div
                    className={cn(
                      'flex items-center w-full transition-colors duration-150 rounded-md overflow-hidden',
                      isHighlighted ? 'bg-primary-container/50' : 'hover:bg-surface-muted',
                    )}
                    onMouseEnter={() => onHighlight(index)}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() => {
                        if (isOutOfStock) {
                          toast.error(
                            t('sales.search.outOfStock', 'Sin stock disponible para {name}', {
                              name: product.name,
                            }),
                          );
                          return;
                        }
                        let qty = parseFloat(String(selectedQty));
                        if (Number.isNaN(qty) || qty <= 0) qty = 1;
                        onProductClick(product, qty);
                      }}
                      className={cn(
                        'flex-1 flex items-center gap-2 px-3 py-2.5 text-left transition-colors min-w-0',
                        isOutOfStock && 'opacity-60 grayscale',
                      )}
                    >
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-body-md-bold text-foreground truncate leading-none uppercase">
                            {product.name}
                          </p>
                          <Badge variant="secondary" size="sm" className="font-data-mono shrink-0">
                            #{product.sku}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-baseline gap-1 shrink-0">
                            <p className="text-body-md-bold font-data-mono text-primary leading-none">
                              {formatCurrency(product.price)}
                            </p>
                            <span className="text-body-sm text-outline-fg uppercase">
                              / {product.base_unit}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            {badgeKind === 'variants' ? (
                              <Badge variant="secondary" size="sm" className="gap-1 shrink-0">
                                <Layers size={10} />
                                {t('sales.search.multipleVariants', 'Múltiples Variantes')}
                              </Badge>
                            ) : badgeKind === 'service' ? (
                              <Badge variant="secondary" size="sm" className="shrink-0">
                                {t('sales.search.serviceBadge', 'Servicio')}
                              </Badge>
                            ) : availableStock > 0 ? (
                              <Badge variant="success" size="sm" className="shrink-0">
                                {t('sales.search.stock', 'Stock: {qty} {unit}', {
                                  qty: formatNumber(availableStock),
                                  unit: product.base_unit,
                                })}
                              </Badge>
                            ) : (
                              <Badge variant="destructive" size="sm" className="shrink-0">
                                {t('sales.search.outOfStockShort', 'Sin stock')}
                              </Badge>
                            )}
                            {quantityInCart > 0 && (
                              <Badge variant="warning" size="sm" className="gap-1 shrink-0">
                                <ShoppingCart size={10} className="shrink-0" />
                                {t('sales.search.inCart', '{qty} en carrito', { qty: formatNumber(quantityInCart) })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {isHighlighted && !isOutOfStock && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 mr-1 bg-surface rounded-md shadow-whisper shrink-0 ml-1 animate-in slide-in-from-right-2 duration-200">
                        {product.has_variants ? (
                          <div className="text-body-sm-bold text-primary flex items-center gap-1 whitespace-nowrap">
                            <Layers size={14} />
                            {t('sales.search.selectVariant', 'Seleccionar Variante')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-label-caps text-on-surface-deep whitespace-nowrap">
                              {t('sales.search.qtyLabel', 'Cant')}:
                            </span>
                            <input
                              ref={qtyInputRef}
                              type="number"
                              min={isDecimalUnit(product.base_unit) ? '0.01' : '1'}
                              step={isDecimalUnit(product.base_unit) ? '0.01' : '1'}
                              max={requiresStock(product) ? availableStock : undefined}
                              value={selectedQty}
                              onChange={(e) => onSelectedQtyChange(e.target.value)}
                              onBlur={() => {
                                const clamped = clampRequestedQty(
                                  parseFloat(String(selectedQty)),
                                  maxSellableQty(product, quantityInCart),
                                  isDecimalUnit(product.base_unit),
                                );
                                onSelectedQtyChange(clamped);
                              }}
                              onKeyDown={(e) => handleQtyKeyDown(e, product)}
                              className="w-14 h-8 font-data-mono text-body-md text-center border border-divider rounded-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={t('sales.search.qtyLabel', 'Cantidad')}
                            />
                          </div>
                        )}
                        <div className="flex flex-col border-l border-divider pl-1.5">
                          <div className="flex items-center gap-0.5 text-body-sm font-data-mono text-primary leading-none">
                            <span className="opacity-60">⏎</span> OK
                          </div>
                          <div className="flex items-center gap-0.5 text-body-sm font-data-mono text-outline-fg uppercase leading-none mt-0.5">
                            <span className="opacity-60">ESC</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isHighlighted && isOutOfStock && (
                      <div className="px-3 py-1 mr-2 bg-error-container rounded border border-error/20 text-label-caps text-error uppercase animate-in fade-in duration-200">
                        {t('sales.search.soldOut', 'Agotado')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
