import React from 'react';
import { Edit, Trash2, Eye, AlertCircle, CheckCircle, DollarSign, Tag, Package, RotateCcw, Barcode, FileText, Hash } from 'lucide-react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createProductSummary, getStockStatus } from '@/utils/productUtils';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n';
import EditableField from '@/components/EditableField';

const ProductCard = React.memo(({ product, onView, onEdit, onDelete, onReactivate, onToggleSelect, selected, inlineEditing, onStartInlineEdit, onCancelInlineEdit, onInlineSave }) => {
  const { styles } = useThemeStyles();
  const { t } = useI18n();
  const productSummary = createProductSummary(product);
  const stockStatus = getStockStatus(product);
  const [editName, setEditName] = React.useState(product.name || '');
  const [editPrice, setEditPrice] = React.useState(product.price ?? '');
  const [editStock, setEditStock] = React.useState(product.stock_quantity ?? '');
  const [errorMsg, setErrorMsg] = React.useState(null);

  const submitPatch = (patch) => {
    if (!onInlineSave) return;
    setErrorMsg(null);
    if (patch.price != null && Number(patch.price) < 0) {
      setErrorMsg('Precio inválido');
      return false;
    }
    if (patch.stock_quantity != null && Number(patch.stock_quantity) < 0) {
      setErrorMsg('Stock inválido');
      return false;
    }
    onInlineSave(product.id, patch);
    return true;
  };

  const handleKeySubmit = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'name') submitPatch({ name: editName });
      if (field === 'price') submitPatch({ price: Number(editPrice) });
      if (field === 'stock') submitPatch({ stock_quantity: Number(editStock) });
    }
  };

  const getStockIcon = (status) => {
    const iconProps = { className: "w-3 h-3" };
    switch (status) {
      case 'out': return <AlertCircle {...iconProps} style={{ color: 'var(--destructive)' }} />;
      case 'low': return <AlertCircle {...iconProps} style={{ color: 'var(--warning)' }} />;
      case 'in-stock': return <CheckCircle {...iconProps} style={{ color: 'var(--success)' }} />;
      default: return <Package {...iconProps} style={{ color: 'var(--info)' }} />;
    }
  };

  const isInactive = product.state === false;
  const cardVariant = stockStatus.status === 'in-stock' ? 'success' : undefined;
  
  return (
    <div className={`erp-hover-card ${styles.card(cardVariant || 'group flex flex-col', cardVariant ? { interactive: true, density: 'compact', extra: 'group flex flex-col' } : '')} ${isInactive ? 'opacity-70 border-dashed border-2' : ''}`}>
      <div className="flex-1 p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-2 flex-1 pr-2 min-w-0">
            {onToggleSelect && <input type="checkbox" checked={!!selected} onChange={() => onToggleSelect(product.id)} className="mt-1 accent-primary" />}
            <div className="flex-1 min-w-0">
              {inlineEditing ? (
                <div className="space-y-1">
                  <label htmlFor={`name-${product.id}`} className="sr-only">Nombre</label>
                  <input
                    id={`name-${product.id}`}
                    aria-label="Nombre"
                    className="w-full border px-2 py-1 rounded text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => handleKeySubmit(e, 'name')}
                  />
                </div>
              ) : (
                <>
                  <h3 className={`${styles.header('h3')} mb-2`} 
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={product.name}>
                    {product.name || t('field.no_name')}
                  </h3>
                  <div className="space-y-1">
                    <p className={`text-xs text-muted-foreground ${styles.label()} flex items-center gap-1`}>
                      <Hash className="w-3 h-3" />
                      {product.code || product.product_id || product.id}
                    </p>
                    {product.barcode && (
                      <p className={`text-xs text-muted-foreground ${styles.label()} flex items-center gap-1`}>
                        <Barcode className="w-3 h-3" />
                        {product.barcode}
                      </p>
                    )}
                    {product.product_type && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                        <Package className="w-3 h-3" />
                        {product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {product.is_active ? t('status.active', 'Activo') : t('status.inactive', 'Inactivo')}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('field.category')}</span>
            <span className="font-medium">{productSummary.category?.name || 'Sin categoría'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('field.price')}</span>
            {inlineEditing ? (
              <input
                aria-label="Precio"
                className="w-24 border px-1 py-0.5 rounded text-right"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                onKeyDown={(e) => handleKeySubmit(e, 'price')}
              />
            ) : (
              <span className="font-semibold text-green-600">{productSummary.priceFormatted || 'N/A'}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('field.stock')}</span>
            {inlineEditing ? (
              <input
                aria-label="Stock"
                className="w-20 border px-1 py-0.5 rounded text-right"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
                onKeyDown={(e) => handleKeySubmit(e, 'stock')}
              />
            ) : (
              <div className="flex items-center gap-1 font-semibold" style={{ color: stockStatus.color }}>
                <span>{stockStatus.text} ({product.stock_quantity ?? 'N/A'})</span>
                {getStockIcon(stockStatus.status)}
              </div>
            )}
          </div>
          
          {/* Información adicional */}
          {product.description && (
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-start gap-2">
                <FileText className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground" 
                   style={{
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis'
                   }}
                   title={product.description}>
                  {product.description}
                </p>
              </div>
            </div>
          )}
          
          {/* Información de fechas si está disponible */}
          {(product.created_at || product.updated_at) && (
            <div className="pt-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                {product.updated_at && (
                  <span>Actualizado: {new Date(product.updated_at).toLocaleDateString('es-ES')}</span>
                )}
                {product.created_at && (
                  <span>Creado: {new Date(product.created_at).toLocaleDateString('es-ES')}</span>
                )}
              </div>
            </div>
          )}
        </div>
        {errorMsg && <div role="alert" className="mt-2 text-xs text-red-600 font-medium">{errorMsg}</div>}
      </div>

      <div className="flex gap-2 p-4 border-t border-border/50">
        <Button onClick={() => onView?.(product)} variant="secondary" size="sm" className="flex-1 text-xs">
          <Eye className="w-4 h-4 mr-1" />{t('action.view')}
        </Button>
        
        {isInactive ? (
          // Producto inactivo - solo mostrar reactivar
          <Button 
            onClick={() => onReactivate?.(product)} 
            variant="default" 
            size="sm" 
            className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
          >
            <RotateCcw className="w-4 h-4 mr-1" />Reactivar
          </Button>
        ) : (
          // Producto activo - mostrar editar y eliminar
          <>
            <Button 
              onClick={() => (inlineEditing ? onCancelInlineEdit?.(product) : onEdit?.(product))} 
              variant="secondary" 
              size="sm" 
              className="flex-1 text-xs"
            >
              <Edit className="w-4 h-4 mr-1" />{t('action.edit')}
            </Button>
            <Button onClick={() => onDelete?.(product)} variant="destructive" size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

export default ProductCard;