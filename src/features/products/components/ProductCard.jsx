import React from 'react';
import { Edit, Trash2, Eye, AlertTriangle, AlertCircle, CheckCircle, DollarSign, Tag, Package } from 'lucide-react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createProductSummary, isEnrichedProduct, getStockStatus as computeStockStatus } from '@/utils/productUtils';

/**
 * ProductCard - tarjeta compacta para listado de productos
 * Props:
 * - product: objeto producto
 * - isNeoBrutalism: boolean (tema)
 * - getCategoryName: (id) => string
 * - onView(product), onEdit(product), onDelete(product)
 */
function ProductCardComponent({ product, isNeoBrutalism, getCategoryName, onView, onEdit, onDelete }) {
  const { card, button: themeButton } = useThemeStyles();
  const productSummary = createProductSummary(product);
  const stockStatus = computeStockStatus(product);

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

  const statusBadge = () => {
    const isActive = product.is_active;
    const type = !isActive ? 'inactive' : (product.stock_quantity && product.stock_quantity < 10 ? 'low-stock' : 'active');

    const style = (() => {
      if (isNeoBrutalism) {
        return {
          background: type === 'inactive' ? 'var(--brutalist-pink)' : type === 'low-stock' ? 'var(--brutalist-orange)' : 'var(--brutalist-lime)',
          color: '#000000',
          border: '2px solid var(--border)',
          borderRadius: '0px',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          fontSize: '0.75rem',
          padding: '8px 12px',
          display: 'inline-block',
          minWidth: '80px',
          textAlign: 'center'
        };
      }
      return {
        background: type === 'inactive' ? 'var(--destructive)' : type === 'low-stock' ? 'var(--warning)' : 'var(--success)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontWeight: '500',
        fontSize: '0.75rem',
        padding: '4px 8px',
        display: 'inline-block',
        minWidth: '80px',
        textAlign: 'center'
      };
    })();

    const icon = !isActive ? <CheckCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />;

    return (
      <div style={style}>
        <div className="flex items-center gap-1">
          {icon}
          <span>{isActive ? (isNeoBrutalism ? 'ACTIVO' : 'Activo') : (isNeoBrutalism ? 'INACTIVO' : 'Inactivo')}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`${card()} hover:shadow-lg transition-shadow relative`}>
      {/* Enriched Product Indicators */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {isEnrichedProduct(product) && (
          <div className="w-2 h-2 bg-green-400 rounded-full" title="Producto con datos enriquecidos" />
        )}
        {productSummary.hasUnitPricing && (
          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Producto con precios por unidad (kg, caja, etc.)" />
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-2 truncate">
            {product.name || 'Sin nombre'}
          </h3>
          <div className="text-xs text-muted-foreground mb-2">
            {product.code ? `Código: ${product.code}` : `ID: ${product.id}`}
          </div>
        </div>
        {statusBadge()}
      </div>

      {/* Body */}
      <div className="space-y-3 mb-4">
        {/* Category */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">Categoría:</span>
          <span className="text-xs">
            {productSummary.category?.name || getCategoryName(product.category_id)}
          </span>
        </div>

        {/* Price */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">
            {productSummary.hasUnitPricing ? 'Precio/Unidad:' : 'Precio:'}
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
              <Tag className="w-3 h-3 text-blue-500" title="Múltiples unidades disponibles" />
            )}
          </div>
        </div>

        {/* Stock */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">Stock:</span>
          <div className="flex items-center gap-1">
            <span
              className="font-medium text-xs"
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
            <p className="text-xs text-muted-foreground line-clamp-2" title={productSummary.description.text}>
              {productSummary.description.text}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => onView?.(product)} className={`${themeButton('secondary')} flex-1 px-3 py-2 text-xs`}>
          <Eye className="w-4 h-4 mr-1" /> Ver
        </button>
        <button onClick={() => onEdit?.(product)} className={`${themeButton('primary')} flex-1 px-3 py-2 text-xs`}>
          <Edit className="w-4 h-4 mr-1" /> Editar
        </button>
  <button onClick={() => onDelete?.(product)} className={`${themeButton('destructive')} px-3 py-2`}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const ProductCard = React.memo(ProductCardComponent, (prev, next) => {
  // Memoizar en base a id y flags clave
  return (
    prev.product?.id === next.product?.id &&
    prev.product?.is_active === next.product?.is_active &&
    prev.product?.stock_quantity === next.product?.stock_quantity &&
    prev.product?.price === next.product?.price &&
    prev.isNeoBrutalism === next.isNeoBrutalism
  );
});

export default ProductCard;
