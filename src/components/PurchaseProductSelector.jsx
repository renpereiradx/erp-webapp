/**
 * Componente PurchaseProductSelector
 * Selector de productos para agregar a una compra
 * Incluye búsqueda, información de precios y cantidades mínimas
 */

import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, DollarSign, Hash } from 'lucide-react';
// useThemeStyles removido para MVP - sin hooks problemáticos
import { MOCK_PURCHASE_PRODUCTS } from '../constants/purchaseData';

const PurchaseProductSelector = ({
  onProductAdd,
  theme = 'neo-brutalism',
  supplierId = null,
  className = ''
}) => {
  // Para MVP - estilos fijos sin hooks problemáticos
  const themeStyles = { styles: { input: () => 'input-class', card: (classes = '') => `card-class ${classes}`, button: () => 'button-class' } };
  const styles = themeStyles.styles || themeStyles;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [quantityError, setQuantityError] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Utilidad para obtener configuración de unidad
  const getUnitConfig = (unit) => {
    // Unidades con decimales
    const DECIMAL_UNITS = {
      'kg': { step: 0.01, min: 0.01, decimals: 2, label: 'Kilogramo' },
      'g': { step: 0.1, min: 0.1, decimals: 1, label: 'Gramo' },
      'lb': { step: 0.01, min: 0.01, decimals: 2, label: 'Libra' },
      'oz': { step: 0.1, min: 0.1, decimals: 1, label: 'Onza' },
      'ton': { step: 0.001, min: 0.001, decimals: 3, label: 'Tonelada' },
      'l': { step: 0.01, min: 0.01, decimals: 2, label: 'Litro' },
      'ml': { step: 1, min: 1, decimals: 0, label: 'Mililitro' },
      'gal': { step: 0.1, min: 0.1, decimals: 1, label: 'Galón' },
      'meter': { step: 0.01, min: 0.01, decimals: 2, label: 'Metro' },
      'cm': { step: 0.1, min: 0.1, decimals: 1, label: 'Centímetro' },
      'sqm': { step: 0.01, min: 0.01, decimals: 2, label: 'Metro cuadrado' },
      'month': { step: 0.5, min: 0.5, decimals: 1, label: 'Mes' }
    };

    // Unidades enteras (por defecto)
    const INTEGER_CONFIG = { step: 1, min: 1, decimals: 0, allowDecimals: false };

    if (DECIMAL_UNITS[unit]) {
      return { ...DECIMAL_UNITS[unit], allowDecimals: true };
    }

    return { ...INTEGER_CONFIG, label: unit || 'unidad' };
  };

  // Validar cantidad según unidad
  const validateQuantity = (value, unit, minOrderQty) => {
    const config = getUnitConfig(unit);

    // Validar que value sea un string o número válido
    const valueStr = String(value).trim();
    if (!valueStr || valueStr === '') {
      return { valid: false, error: 'Ingrese una cantidad' };
    }

    const num = parseFloat(valueStr);

    // Validar que sea un número válido
    if (isNaN(num)) {
      return { valid: false, error: 'Debe ser un número válido' };
    }

    // Validar mínimo
    if (num < config.min) {
      return { valid: false, error: `Mínimo: ${config.min}` };
    }

    // Validar cantidad mínima de pedido
    if (minOrderQty && num < minOrderQty) {
      return { valid: false, error: `Pedido mínimo: ${minOrderQty}` };
    }

    // Validar decimales para unidades que NO permiten decimales
    if (!config.allowDecimals) {
      // Verificar si el string contiene un punto decimal
      if (valueStr.includes('.') || valueStr.includes(',')) {
        return { valid: false, error: 'Solo números enteros permitidos' };
      }
      // Verificar que sea un entero
      if (!Number.isInteger(num)) {
        return { valid: false, error: 'Solo números enteros permitidos' };
      }
    }

    // Validar cantidad de decimales para unidades que SÍ permiten decimales
    if (config.allowDecimals && config.decimals !== undefined) {
      const decimalPart = valueStr.split('.')[1];
      if (decimalPart && decimalPart.length > config.decimals) {
        return { valid: false, error: `Máximo ${config.decimals} decimal${config.decimals > 1 ? 'es' : ''}` };
      }
    }

    return { valid: true, error: null };
  };

  // Filtrar productos por búsqueda incluyendo código de barras
  const filteredProducts = MOCK_PURCHASE_PRODUCTS.filter(product => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.supplier_code.toLowerCase().includes(term) ||
      (product.barcode && product.barcode.toLowerCase().includes(term))
    );
  });

  // Resetear formulario
  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity('1');
    setQuantityError(null);
    setCustomPrice('');
    setShowAddForm(false);
    setSearchTerm('');
  };

  // Manejar selección de producto
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    const unit = product.unit || 'unit';
    const config = getUnitConfig(unit);
    const minQty = product.min_order_quantity || config.min;
    setQuantity(minQty.toString());
    setQuantityError(null);
    setCustomPrice(product.supplier_price?.toString() || '');
    setShowAddForm(true);
  };

  // Manejar cambio de cantidad
  const handleQuantityChange = (value) => {
    setQuantity(value);

    if (selectedProduct) {
      const unit = selectedProduct.unit || 'unit';
      const minOrderQty = selectedProduct.min_order_quantity;
      const validation = validateQuantity(value, unit, minOrderQty);
      setQuantityError(validation.error);
    }
  };

  // Agregar producto al pedido
  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const unit = selectedProduct.unit || 'unit';
    const minOrderQty = selectedProduct.min_order_quantity;
    const validation = validateQuantity(quantity, unit, minOrderQty);

    if (!validation.valid) {
      setQuantityError(validation.error);
      return;
    }

    const finalPrice = customPrice ? parseFloat(customPrice) : selectedProduct.supplier_price;
    const numQuantity = parseFloat(quantity);

    onProductAdd(selectedProduct, numQuantity, finalPrice);
    resetForm();
  };

  // Validaciones
  const canAdd = selectedProduct &&
                 !quantityError &&
                 quantity &&
                 parseFloat(quantity) > 0 &&
                 (customPrice ? parseFloat(customPrice) > 0 : true);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Búsqueda de productos */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar productos por nombre, categoría, código o código de barras..."
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
                Cantidad ({getUnitConfig(selectedProduct.unit || 'unit').label})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const unit = selectedProduct.unit || 'unit';
                    const config = getUnitConfig(unit);
                    const current = parseFloat(quantity) || config.min;
                    const newVal = Math.max(config.min, current - config.step);
                    handleQuantityChange(newVal.toFixed(config.decimals));
                  }}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onKeyDown={(e) => {
                    const unit = selectedProduct.unit || 'unit';
                    const config = getUnitConfig(unit);
                    // Bloquear punto decimal para unidades enteras
                    if (!config.allowDecimals && (e.key === '.' || e.key === ',')) {
                      e.preventDefault();
                    }
                  }}
                  min={selectedProduct.min_order_quantity || getUnitConfig(selectedProduct.unit || 'unit').min}
                  step={getUnitConfig(selectedProduct.unit || 'unit').step}
                  className={`flex-1 ${styles.input()} ${quantityError ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const unit = selectedProduct.unit || 'unit';
                    const config = getUnitConfig(unit);
                    const current = parseFloat(quantity) || config.min;
                    const newVal = current + config.step;
                    handleQuantityChange(newVal.toFixed(config.decimals));
                  }}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              {quantityError ? (
                <div className="text-xs text-red-600 mt-1">
                  {quantityError}
                </div>
              ) : (
                <>
                  {selectedProduct.min_order_quantity && (
                    <div className="text-xs text-gray-600 mt-1">
                      Pedido mínimo: {selectedProduct.min_order_quantity} {selectedProduct.unit}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {getUnitConfig(selectedProduct.unit || 'unit').allowDecimals
                      ? '✅ Decimales permitidos'
                      : '❌ Solo números enteros'}
                  </div>
                </>
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
