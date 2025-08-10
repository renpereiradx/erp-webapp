/**
 * Componente PurchaseProductSelector
 * Selector de productos para agregar a una compra
 * Incluye búsqueda, información de precios y cantidades mínimas
 */

import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, DollarSign, Hash } from 'lucide-react';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { MOCK_PURCHASE_PRODUCTS } from '../constants/purchaseData';

const PurchaseProductSelector = ({ 
  onProductAdd, 
  theme = 'neo-brutalism',
  supplierId = null,
  className = ''
}) => {
  const themeStyles = useThemeStyles(theme);
  const styles = themeStyles.styles || themeStyles;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Filtrar productos por búsqueda
  const filteredProducts = MOCK_PURCHASE_PRODUCTS.filter(product => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.supplier_code.toLowerCase().includes(term)
    );
  });

  // Resetear formulario
  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice('');
    setShowAddForm(false);
    setSearchTerm('');
  };

  // Manejar selección de producto
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setQuantity(product.min_order_quantity || 1);
    setCustomPrice(product.supplier_price?.toString() || '');
    setShowAddForm(true);
  };

  // Agregar producto al pedido
  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const finalPrice = customPrice ? parseFloat(customPrice) : selectedProduct.supplier_price;
    const finalQuantity = Math.max(quantity, selectedProduct.min_order_quantity || 1);

    onProductAdd(selectedProduct, finalQuantity, finalPrice);
    resetForm();
  };

  // Validaciones
  const canAdd = selectedProduct && 
                 quantity > 0 && 
                 quantity >= (selectedProduct.min_order_quantity || 1) &&
                 (customPrice ? parseFloat(customPrice) > 0 : true);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Búsqueda de productos */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar productos por nombre, categoría o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 ${styles.input()}`}
          />
        </div>
      </div>

      {/* Lista de productos encontrados */}
      {searchTerm && (
        <div className={`max-h-64 overflow-auto ${styles.card()} border`}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                  selectedProduct?.id === product.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="inline-flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        {product.category}
                      </span>
                      <span className="ml-3 inline-flex items-center">
                        <Hash className="w-3 h-3 mr-1" />
                        {product.supplier_code}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Mín: {product.min_order_quantity} {product.unit}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-lg">
                      ${product.supplier_price}
                    </div>
                    <div className="text-sm text-gray-600">
                      por {product.unit}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No se encontraron productos que coincidan con "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* Formulario para agregar producto */}
      {showAddForm && selectedProduct && (
        <div className={styles.card('p-4 border-2 border-blue-200 bg-blue-50')}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-medium text-gray-900">
                {selectedProduct.name}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedProduct.category} • Código: {selectedProduct.supplier_code}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
              title="Cancelar"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cantidad */}
            <div>
              <label className={styles.label()}>
                <Hash className="inline w-4 h-4 mr-2" />
                Cantidad
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                min={selectedProduct.min_order_quantity || 1}
                className={styles.input()}
              />
              {selectedProduct.min_order_quantity && (
                <div className="text-xs text-gray-600 mt-1">
                  Mínimo: {selectedProduct.min_order_quantity} {selectedProduct.unit}
                </div>
              )}
            </div>

            {/* Precio unitario */}
            <div>
              <label className={styles.label()}>
                <DollarSign className="inline w-4 h-4 mr-2" />
                Precio Unitario
              </label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                step="0.01"
                min="0.01"
                placeholder={selectedProduct.supplier_price?.toString()}
                className={styles.input()}
              />
              <div className="text-xs text-gray-600 mt-1">
                Precio sugerido: ${selectedProduct.supplier_price}
              </div>
            </div>
          </div>

          {/* Cálculo del total */}
          {quantity > 0 && customPrice && (
            <div className="mt-4 p-3 bg-white rounded border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {quantity} × ${customPrice} =
                </span>
                <span className="font-bold text-lg">
                  ${(quantity * parseFloat(customPrice)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Advertencias */}
          {quantity < (selectedProduct.min_order_quantity || 1) && (
            <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-sm text-orange-800">
              ⚠️ La cantidad es menor al mínimo requerido ({selectedProduct.min_order_quantity} {selectedProduct.unit})
            </div>
          )}

          {/* Botón agregar */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddProduct}
              disabled={!canAdd}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded font-medium ${
                canAdd
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar al Pedido
            </button>
            
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay búsqueda */}
      {!searchTerm && !showAddForm && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Busca productos para agregar al pedido</p>
          <p className="text-sm">Escribe el nombre, categoría o código del producto</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseProductSelector;
