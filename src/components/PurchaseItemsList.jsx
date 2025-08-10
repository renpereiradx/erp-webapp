/**
 * Componente PurchaseItemsList
 * Lista editable de productos agregados a una compra
 * Permite modificar cantidades, precios y eliminar items
 */

import React from 'react';
import { Trash2, Edit3, Package, DollarSign, Hash, AlertTriangle } from 'lucide-react';
import { useThemeStyles } from '../hooks/useThemeStyles';

const PurchaseItemsList = ({ 
  items = [], 
  onQuantityChange, 
  onPriceChange, 
  onRemoveItem,
  theme = 'neo-brutalism',
  errors = {},
  className = ''
}) => {
  const themeStyles = useThemeStyles(theme);
  const styles = themeStyles.styles || themeStyles;

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No hay productos en el pedido</p>
        <p className="text-sm">Agrega productos usando el selector de arriba</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header de la tabla */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-gray-600">
        <div className="col-span-4">Producto</div>
        <div className="col-span-2 text-center">Cantidad</div>
        <div className="col-span-2 text-center">Precio Unit.</div>
        <div className="col-span-2 text-center">Subtotal</div>
        <div className="col-span-2 text-center">Acciones</div>
      </div>

      {/* Lista de items */}
      {items.map((item, index) => {
        const subtotal = item.quantity * item.unitPrice;
        const quantityError = errors[`item_${index}_quantity`];
        const priceError = errors[`item_${index}_price`];
        const minQuantityError = errors[`item_${index}_min`];
        const hasError = quantityError || priceError || minQuantityError;

        return (
          <div 
            key={item.productId} 
            className={`${styles.card('p-4')} ${hasError ? 'border-red-200 bg-red-50' : ''}`}
          >
            {/* Vista móvil */}
            <div className="md:hidden space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.productName}</h4>
                  <div className="text-sm text-gray-600 flex items-center mt-1">
                    <Package className="w-3 h-3 mr-1" />
                    {item.category}
                    {item.supplierCode && (
                      <>
                        <span className="mx-2">•</span>
                        <Hash className="w-3 h-3 mr-1" />
                        {item.supplierCode}
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.productId)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cantidad ({item.unit})
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                    min={item.minOrderQuantity || 1}
                    className={`w-full text-sm ${styles.input()} ${quantityError ? 'border-red-500' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Precio Unitario
                  </label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => onPriceChange(item.productId, parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0.01"
                    className={`w-full text-sm ${styles.input()} ${priceError ? 'border-red-500' : ''}`}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="font-bold text-lg">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Vista desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
              <div className="col-span-4">
                <div className="font-medium text-gray-900">{item.productName}</div>
                <div className="text-sm text-gray-600 flex items-center mt-1">
                  <Package className="w-3 h-3 mr-1" />
                  {item.category}
                  {item.supplierCode && (
                    <>
                      <span className="mx-2">•</span>
                      <Hash className="w-3 h-3 mr-1" />
                      {item.supplierCode}
                    </>
                  )}
                </div>
                {item.packaging && (
                  <div className="text-xs text-gray-500 mt-1">
                    {item.packaging}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                  min={item.minOrderQuantity || 1}
                  className={`w-full text-center ${styles.input()} ${quantityError ? 'border-red-500' : ''}`}
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  {item.unit}
                </div>
              </div>

              <div className="col-span-2">
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => onPriceChange(item.productId, parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0.01"
                    className={`w-full pl-8 text-center ${styles.input()} ${priceError ? 'border-red-500' : ''}`}
                  />
                </div>
              </div>

              <div className="col-span-2 text-center">
                <div className="font-bold text-lg">${subtotal.toFixed(2)}</div>
              </div>

              <div className="col-span-2 text-center">
                <button
                  onClick={() => onRemoveItem(item.productId)}
                  className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Errores y advertencias */}
            {(quantityError || priceError || minQuantityError) && (
              <div className="mt-3 space-y-1">
                {quantityError && (
                  <div className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {quantityError}
                  </div>
                )}
                {priceError && (
                  <div className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {priceError}
                  </div>
                )}
                {minQuantityError && (
                  <div className="text-sm text-orange-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {minQuantityError}
                  </div>
                )}
              </div>
            )}

            {/* Información adicional */}
            {item.minOrderQuantity && item.quantity < item.minOrderQuantity && !minQuantityError && (
              <div className="mt-2 text-sm text-orange-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Cantidad mínima recomendada: {item.minOrderQuantity} {item.unit}
              </div>
            )}
          </div>
        );
      })}

      {/* Resumen de la lista */}
      <div className={`${styles.card('p-4 bg-gray-50')}`}>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Total de productos: {items.length} • 
            Cantidad total: {items.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
          <div className="text-lg font-bold">
            Subtotal: ${items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseItemsList;
