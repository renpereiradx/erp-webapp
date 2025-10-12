/**
 * Componente mejorado para selección de productos en compras
 * Incluye manejo de tasas de impuestos, fechas de vencimiento y precios de proveedor
 * Alineado con la especificación del procedimiento register_purchase_order
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Package, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Percent,
  Info
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Hooks
import productService from '@/services/productService';
import purchaseService from '@/services/purchaseService';
// useThemeStyles removido para MVP - sin hooks problemáticos

// Constants
import { TAX_RATES, PRODUCT_TAX_CATEGORIES } from '@/constants/purchaseData';

const EnhancedPurchaseProductSelector = ({ 
  onProductAdd, 
  supplierId, 
  theme,
  className = ''
}) => {
  // Para MVP - estilos fijos sin hooks problemáticos
  const styles = {
    card: (classes = '') => `border rounded-lg shadow-sm bg-white ${classes}`
  };
  // Estado local
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    quantity: 1,
    unitPrice: 0,
    expDate: '',
    taxRateId: null,
    profitPct: 0
  });

  // Cargar tasas de impuestos disponibles
  useEffect(() => {
    const loadTaxRates = async () => {
      try {
        const result = await purchaseService.getTaxRates();
        if (result.success) {
          setTaxRates([TAX_RATES.DEFAULT, ...result.data]);
        } else {
          // Fallback a tasas predefinidas
          setTaxRates([
            TAX_RATES.DEFAULT,
            TAX_RATES.IVA_16,
            TAX_RATES.IVA_8,
            TAX_RATES.IEPS
          ]);
        }
      } catch (error) {
        console.error('Error loading tax rates:', error);
        setTaxRates([TAX_RATES.DEFAULT, TAX_RATES.IVA_16]);
      }
    };

    loadTaxRates();
  }, []);

  // Buscar productos con debounce - ahora incluye búsqueda por código de barras
  const searchProducts = useCallback(async (term) => {
    if (!term.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      // Detectar si es un código de barras (número de 8-15 dígitos)
      const isBarcode = /^\d{8,15}$/.test(term.trim());
      
      let result;
      if (isBarcode) {
        // Buscar por código de barras específicamente
        try {
          const product = await productService.getProductByBarcode(term.trim());
          result = { success: true, data: product ? [product] : [] };
        } catch (error) {
          // Si no se encuentra por código de barras, intentar búsqueda general
          result = await productService.searchProducts(term, {
            includeSupplierPrices: true,
            supplierId: supplierId
          });
        }
      } else {
        // Búsqueda general por nombre o ID
        result = await productService.searchProducts(term, {
          includeSupplierPrices: true,
          supplierId: supplierId
        });
      }
      
      if (result.success) {
        setProducts(result.data || []);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchProducts]);

  // Seleccionar producto para configurar
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    
    // Pre-llenar formulario con datos del producto
    setProductForm({
      quantity: product.min_order_quantity || 1,
      unitPrice: product.supplier_price || product.price || 0,
      expDate: '',
      taxRateId: determineTaxRate(product),
      profitPct: product.default_profit_pct || 0
    });
  };

  // Determinar tasa de impuesto basada en categoría del producto
  const determineTaxRate = (product) => {
    if (!product.category) return null;
    
    switch (product.tax_category || product.category.toLowerCase()) {
      case PRODUCT_TAX_CATEGORIES.MEDICINE:
        return TAX_RATES.DEFAULT.id; // Medicamentos sin IVA
      case PRODUCT_TAX_CATEGORIES.EQUIPMENT:
      case PRODUCT_TAX_CATEGORIES.SUPPLIES:
        return TAX_RATES.IVA_16.id; // Equipos e insumos con IVA 16%
      case PRODUCT_TAX_CATEGORIES.CONTROLLED:
        return TAX_RATES.IEPS.id; // Productos controlados con IEPS
      default:
        return TAX_RATES.IVA_16.id; // Default IVA 16%
    }
  };

  // Calcular precio con impuestos
  const calculatePriceWithTax = () => {
    const selectedTaxRate = taxRates.find(rate => rate.id === productForm.taxRateId);
    const taxRate = selectedTaxRate ? selectedTaxRate.rate : 0;
    const subtotal = productForm.quantity * productForm.unitPrice;
    const tax = subtotal * taxRate;
    return {
      subtotal,
      tax,
      total: subtotal + tax,
      taxRate: taxRate * 100
    };
  };

  // Agregar producto al pedido
  const handleAddProduct = () => {
    if (!selectedProduct || !productForm.quantity || !productForm.unitPrice) {
      return;
    }

    const productToAdd = {
      ...selectedProduct,
      quantity: productForm.quantity,
      unitPrice: productForm.unitPrice,
      expDate: productForm.expDate || null,
      taxRateId: productForm.taxRateId,
      profitPct: productForm.profitPct
    };

    onProductAdd(productToAdd, productForm.quantity, productForm.unitPrice);
    
    // Limpiar selección
    setSelectedProduct(null);
    setSearchTerm('');
    setProducts([]);
    setProductForm({
      quantity: 1,
      unitPrice: 0,
      expDate: '',
      taxRateId: null,
      profitPct: 0
    });
  };

  // Componente de configuración de producto - minimalista
  const ProductConfigForm = () => {
    if (!selectedProduct) return null;

    const priceCalculation = calculatePriceWithTax();
    const selectedTaxRate = taxRates.find(rate => rate.id === productForm.taxRateId);

    return (
      <div className={`mt-3 p-3 ${styles.card('border-blue-200 bg-blue-50')}`}>
        <h4 className={`text-sm font-bold mb-3 flex items-center ${
          styles.isNeoBrutalism ? 'font-black uppercase' : 'font-semibold'
        }`}>
          <Package className="w-4 h-4 mr-2" />
          {selectedProduct.name}
        </h4>

        {/* Información básica del producto - compacta */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-white rounded text-xs mb-3">
          <div>
            <span className="text-gray-600">Código:</span>
            <p className="font-medium">{selectedProduct.code}</p>
          </div>
          <div>
            <span className="text-gray-600">Stock:</span>
            <p className="font-medium">{selectedProduct.stock} {selectedProduct.unit}</p>
          </div>
        </div>

        {/* Formulario compacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Cantidad */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Cantidad *
            </label>
            <Input
              type="number"
              value={productForm.quantity}
              onChange={(e) => setProductForm(prev => ({ 
                ...prev, 
                quantity: parseFloat(e.target.value) || 0 
              }))}
              min={selectedProduct.min_order_quantity || 1}
              step="0.01"
              className="h-8 text-xs"
            />
          </div>

          {/* Precio unitario */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Precio Unitario *
            </label>
            <Input
              type="number"
              value={productForm.unitPrice}
              onChange={(e) => setProductForm(prev => ({ 
                ...prev, 
                unitPrice: parseFloat(e.target.value) || 0 
              }))}
              min="0"
              step="0.01"
              className="h-8 text-xs"
            />
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={productForm.expDate}
              onChange={(e) => setProductForm(prev => ({ 
                ...prev, 
                expDate: e.target.value 
              }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-8 text-xs p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Tasa de impuesto */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Tasa de Impuesto
            </label>
            <select
              value={productForm.taxRateId || ''}
              onChange={(e) => setProductForm(prev => ({ 
                ...prev, 
                taxRateId: e.target.value ? parseInt(e.target.value) : null 
              }))}
              className="w-full h-8 text-xs p-2 border border-gray-300 rounded-md"
            >
              {taxRates.map(rate => (
                <option key={rate.id || 'none'} value={rate.id || ''}>
                  {rate.name} {rate.rate > 0 && `(${rate.rate * 100}%)`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cálculo compacto */}
        {productForm.quantity > 0 && productForm.unitPrice > 0 && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
            <div className="flex justify-between items-center">
              <span>Subtotal: ${priceCalculation.subtotal.toFixed(2)}</span>
              <span>Impuesto: ${priceCalculation.tax.toFixed(2)}</span>
              <span className="font-bold text-green-600">
                Total: ${priceCalculation.total.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Botones compactos */}
        <div className="flex justify-end space-x-2 mt-3">
          <Button
            onClick={() => setSelectedProduct(null)}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddProduct}
            disabled={!productForm.quantity || !productForm.unitPrice}
            size="sm"
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Agregar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Búsqueda de productos - compacta */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar productos por nombre, ID o código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-8 text-sm"
        />
      </div>

      {/* Resultados de búsqueda - compactos */}
      {loading && (
        <div className="text-center py-3">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-xs text-gray-600 mt-1">Buscando...</p>
        </div>
      )}

      {products.length > 0 && !selectedProduct && (
        <div className={`mb-3 p-3 border rounded ${styles.card()}`}>
          <h4 className={`text-sm font-bold mb-2 ${
            styles.isNeoBrutalism ? 'font-black uppercase' : 'font-semibold'
          }`}>
            Productos ({products.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {products.map(product => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-xs">{product.name}</p>
                    <p className="text-xs text-gray-600">
                      {product.code} | {product.category} | Stock: {product.stock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-xs">
                      ${product.supplier_price || product.price}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de configuración */}
      <ProductConfigForm />

      {/* Información de ayuda - compacta */}
      {!selectedProduct && (
        <div className={`mt-3 p-2 rounded text-xs ${styles.card('bg-blue-50 border-blue-200')}`}>
          <div className="flex items-start">
            <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800">
              <p className="font-medium">Busca productos por nombre o código</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPurchaseProductSelector;
