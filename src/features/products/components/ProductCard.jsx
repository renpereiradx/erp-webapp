import React from 'react';
import { Edit, Trash2, Eye, AlertTriangle, AlertCircle, CheckCircle, DollarSign, Tag, Package, XCircle } from 'lucide-react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createProductSummary, isEnrichedProduct, getStockStatus as computeStockStatus } from '@/utils/productUtils';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n';
import EditableField from '@/components/EditableField';
import { trackRender } from '@/utils/perfMetrics';

/**
 * ProductCard - tarjeta compacta para listado de productos
 * Props:
 * - product: objeto producto
 * - isNeoBrutalism: boolean (tema)
 * - getCategoryName: (id) => string
 * - onView(product), onEdit(product), onDelete(product)
 */
function ProductCardComponent({ product, isNeoBrutalism, getCategoryName, onView, onEdit, onDelete, onToggleSelect, selected, enableInlineEdit, inlineEditing, onStartInlineEdit, onCancelInlineEdit, onInlineSave }) {
  const { card, button: themeButton, header: themeHeader, label: themeLabel } = useThemeStyles();
  const productSummary = createProductSummary(product);
  const stockStatus = computeStockStatus(product);
  const { t } = useI18n();

  trackRender('ProductCard');

  const getStockIcon = (status) => {
    switch (status) {
      case 'out':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'low':
        return <AlertCircle className="w-3 h-3 text-orange-500" />;
      case 'in-stock':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'available':
        return <Package className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  // Estilos para chip de bajo stock (mantiene semántica de warning y coherencia con temas)
  const lowStockChipStyle = (() => {
    if (isNeoBrutalism) {
      return {
        background: 'var(--warning)',
        color: 'var(--warning-foreground)',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        textTransform: 'uppercase',
        fontWeight: 900,
        fontSize: '0.65rem',
        padding: '6px 8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        minWidth: 'fit-content'
      };
    }
    return {
      background: 'var(--warning)',
      color: 'var(--warning-foreground)',
      borderRadius: '9999px',
      fontWeight: 600,
      fontSize: '0.65rem',
      padding: '2px 8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      minWidth: 'fit-content'
    };
  })();

  const [localPrice, setLocalPrice] = React.useState(product.price || '');
  const [localStock, setLocalStock] = React.useState(product.stock_quantity ?? '');
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [errorType, setErrorType] = React.useState('validation');

  React.useEffect(() => {
    if (inlineEditing) {
      setLocalPrice(product.price || '');
      setLocalStock(product.stock_quantity ?? '');
      setErrorMsg('');
    }
  }, [inlineEditing, product.price, product.stock_quantity]);

  const handleSubmitInline = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const name = e.currentTarget.name.value.trim();
    const price = localPrice === '' ? null : parseFloat(localPrice);
    const stock = localStock === '' ? null : parseInt(localStock, 10);
    if (price != null && (isNaN(price) || price < 0)) {
      setErrorMsg(t('validation.price.invalid') || 'Precio inválido');
      return;
    }
    if (stock != null && (isNaN(stock) || stock < 0)) {
      setErrorMsg(t('validation.stock.invalid') || 'Stock inválido');
      return;
    }
    setSaving(true);
    await onInlineSave?.(product.id, { name, price, stock_quantity: stock });
    setSaving(false);
  };

  return (
    <div data-testid={`product-card-${product.id}`} className={`${card('p-4 sm:p-5')} group relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 flex flex-col`}>
      {/* Accent bar */}
      {!isNeoBrutalism ? (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80 rounded-t-md" aria-hidden="true" />
      ) : (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-border" aria-hidden="true" />
      )}

      {/* Enriched Product Indicators */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {isEnrichedProduct(product) && (
          <div className="w-2 h-2 bg-green-400 rounded-full" title={t('products.enriched_title') || 'Producto con datos enriquecidos'} />
        )}
        {productSummary.hasUnitPricing && (
          <div className="w-2 h-2 bg-blue-500 rounded-full" title={t('products.unit_pricing_title') || 'Producto con precios por unidad (kg, caja, etc.)'} />
        )}
      </div>

      {/* Header + Body */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-2 flex-1 pr-2 min-w-0">
            {onToggleSelect && (
              <input
                type="checkbox"
                aria-label={`Seleccionar producto ${product.name || product.id}`}
                checked={!!selected}
                onChange={() => onToggleSelect(product.id)}
                className="mt-1 accent-primary"
                data-testid={`product-select-${product.id}`}
              />
            )}
            <div className="flex-1">
              <h3 className={`${themeHeader('h3')} mb-1 line-clamp-2`} title={product.name || product.id} aria-label={product.name || product.id}>
                {inlineEditing ? (
                  <div className="flex flex-col gap-2" aria-label={`Editar producto ${product.name || product.id}`}> 
                    <div className="flex flex-wrap gap-2 items-center">
                      <EditableField
                        value={product.name}
                        name="name"
                        editing={inlineEditing}
                        label={t('field.name') || 'Nombre'}
                        onSave={async (val) => { await onInlineSave?.(product.id, { name: val }); return true; }}
                        validate={(v) => !v.trim() ? (t('validation.required') || 'Requerido') : ''}
                      />
                      <EditableField
                        value={product.price}
                        name="price"
                        editing={inlineEditing}
                        label={t('field.price') || 'Precio'}
                        allowEnterSubmit
                        type="number"
                        onSave={async (val) => {
                          const num = parseFloat(val);
                          const res = await onInlineSave?.(product.id, { price: num });
                          return res === undefined ? true : res;
                        }}
                        validate={(v) => v !== '' && (isNaN(parseFloat(v)) || parseFloat(v) < 0) ? (t('validation.price.invalid') || 'Precio inválido') : ''}
                      />
                      <EditableField
                        value={product.stock_quantity}
                        name="stock"
                        editing={inlineEditing}
                        label={t('field.stock') || 'Stock'}
                        type="number"
                        onSave={async (val) => {
                          const num = parseInt(val, 10);
                          if (isNaN(num) || num < 0) return false;
                          await onInlineSave?.(product.id, { stock_quantity: num });
                          return true;
                        }}
                        validate={(v) => v !== '' && (isNaN(parseInt(v,10)) || parseInt(v,10) < 0) ? (t('validation.stock.invalid') || 'Stock inválido') : ''}
                      />
                      <button type="button" onClick={onCancelInlineEdit} className="text-red-500 text-xs font-medium">{t('products.inline.cancel')}</button>
                    </div>
                    {errorMsg && (
                      <div className="text-xs text-red-500" role={errorType === 'validation' ? 'alert' : 'status'} aria-live={errorType === 'validation' ? 'assertive' : 'polite'}>
                        {errorType === 'validation' ? t('announce.error_validation', { msg: errorMsg }) : t('announce.error_network', { msg: errorMsg })}
                      </div>
                    )}
                  </div>
                ) : (
                  product.name || (t('field.no_name') || 'Sin nombre')
                )}
              </h3>
              <div className={`text-xs text-muted-foreground ${themeLabel()}`}>
                {product.code ? `${t('field.code') || 'Código'}: ${product.code}` : `${t('field.id') || 'ID'}: ${product.id}`}
              </div>
            </div>
          </div>
          {/* Move badges absolute to avoid title width issues */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge active={!!product.is_active} />
              {!!product.is_active && product.stock_quantity != null && product.stock_quantity < 10 && (
                <span style={lowStockChipStyle}>
                  <AlertCircle className="w-3 h-3" />
                  <span>{isNeoBrutalism ? (t('badge.low_stock.upper') || 'BAJO STOCK') : (t('badge.low_stock') || 'Bajo stock')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3">
          {/* Category */}
          <div className="flex justify-between items-center">
            <span className={`text-muted-foreground text-xs ${themeLabel()}`}>{t('field.category') || 'Categoría'}:</span>
            <span className={`text-xs ${themeLabel()}`}>
              {productSummary.category?.name || getCategoryName(product.category_id)}
            </span>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center">
            <span className={`text-muted-foreground text-xs ${themeLabel()}`}>
              {productSummary.hasUnitPricing ? (t('field.unit_price') || 'Precio/Unidad:') : (t('field.price') || 'Precio:')}
            </span>
            <div className="flex items-center gap-1">
              {productSummary.priceFormatted ? (
                <span className="text-xs font-medium text-green-600">{productSummary.priceFormatted}</span>
              ) : productSummary.price ? (
                <span className="text-xs font-medium text-green-600">{productSummary.price.formatted}</span>
              ) : (
                <span className="text-xs text-muted-foreground">{product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'N/A'}</span>
              )}
              {(productSummary.priceFormatted || productSummary.price) && (
                <DollarSign className="w-3 h-3 text-green-600" />
              )}
              {productSummary.hasUnitPricing && (
                <Tag className="w-3 h-3 text-blue-500" title={t('products.multiple_units_title') || 'Múltiples unidades disponibles'} />
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="flex justify-between items-center">
            <span className={`text-muted-foreground text-xs ${themeLabel()}`}>{t('field.stock') || 'Stock'}:</span>
            <div className="flex items-center gap-1">
              <span
                className={`font-medium text-xs ${themeLabel()}`}
                style={{
                  color: stockStatus.color === 'red' ? '#ef4444' :
                    stockStatus.color === 'orange' ? '#f97316' :
                    stockStatus.color === 'blue' ? '#3b82f6' :
                    stockStatus.color === 'green' ? '#10b981' : '#6b7280'
                }}
              >
                {stockStatus.text}
                {product.stock_quantity !== undefined && product.stock_quantity !== null && (
                  <span className="ml-1 text-xs opacity-75">({product.stock_quantity})</span>
                )}
              </span>
              {getStockIcon(stockStatus.status)}
            </div>
          </div>

          {/* Description */}
          {productSummary.description && (
            <div className="border-t pt-2">
              <p className={`text-xs text-muted-foreground line-clamp-2 ${themeLabel()}`} title={productSummary.description.text}>
                {productSummary.description.text}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Button onClick={() => onView?.(product)} variant="secondary" size="sm" className="flex-1 text-xs focus-visible:ring-2 focus-visible:ring-ring/50" data-testid="product-view-button" data-e2e={`product-view-${product.id}`} aria-label={t('action.view') || 'Ver'}>
          <Eye className="w-4 h-4 mr-1" /> {t('action.view') || 'Ver'}
        </Button>
        <Button onClick={() => onEdit?.(product)} variant="primary" size="sm" className="flex-1 text-xs focus-visible:ring-2 focus-visible:ring-ring/50" data-testid="product-edit-button" data-e2e={`product-edit-${product.id}`} aria-label={t('action.edit') || 'Editar'}>
          <Edit className="w-4 h-4 mr-1" /> {t('action.edit') || 'Editar'}
        </Button>
        {enableInlineEdit && !inlineEditing && (
          <Button onClick={() => onStartInlineEdit?.(product.id)} variant="outline" size="sm" className="flex-1 text-xs" data-testid="product-inline-button" data-e2e={`product-inline-${product.id}`} aria-label={t('action.inline') || 'Inline'}>
            {t('action.inline') || 'Inline'}
          </Button>
        )}
        <Button onClick={() => onDelete?.(product)} variant="destructive" size="icon" className="focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={t('action.delete_product') || 'Eliminar producto'} data-testid="product-delete-button" data-e2e={`product-delete-${product.id}`}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

const ProductCard = React.memo(ProductCardComponent, (prev, next) => {
  return (
    prev.product?.id === next.product?.id &&
    prev.product?.is_active === next.product?.is_active &&
    prev.product?.stock_quantity === next.product?.stock_quantity &&
    prev.product?.price === next.product?.price &&
    prev.isNeoBrutalism === next.isNeoBrutalism &&
    prev.selected === next.selected
  );
});

export default ProductCard;
