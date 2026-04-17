import React, { useState, useCallback } from 'react';
import { Package, X } from 'lucide-react';
import { Button } from './button';
import { SearchableDropdown, SearchableDropdownItem } from './SearchableDropdown';
import { productService } from '@/services/productService';

interface ProductSearchResult extends SearchableDropdownItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  base_unit: string;
  taxRate: number;
}

interface ProductSearchInputProps {
  onProductSelect: (product: ProductSearchResult) => void;
  placeholder?: string;
  className?: string;
  showSelectedProduct?: boolean;
  selectedProduct?: ProductSearchResult | null;
  onClear?: () => void;
  autoFocus?: boolean;
}

const getProductDisplay = (product: Record<string, unknown>): ProductSearchResult => {
  const rawTaxRateCandidates = [
    product.tax_rate,
    product.tax_rate_value,
    product.tax_percentage,
    product.vat_rate,
    product.iva,
  ];

  let normalizedTaxRate = 0;
  const rawTaxRate = rawTaxRateCandidates.find(candidate => candidate !== undefined && candidate !== null);
  if (rawTaxRate !== undefined) {
    const parsedRate = Number(rawTaxRate);
    if (Number.isFinite(parsedRate) && parsedRate > 0) {
      normalizedTaxRate = parsedRate >= 1 ? parsedRate / 100 : parsedRate;
    }
  }

  const price = 
    product.sale_price ||
    product.price ||
    product.unit_price ||
    0;

  return {
    id: String(product.id || product.product_id || ''),
    name: String(product.name || product.product_name || ''),
    sku: String(product.sku || product.barcode || product.code || '-'),
    barcode: product.barcode ? String(product.barcode) : undefined,
    price: Number(price) || 0,
    stock: Number(product.stock_quantity || product.stock || product.quantity || 0),
    base_unit: String(product.base_unit || product.unit || 'unit'),
    taxRate: normalizedTaxRate,
  };
};

const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  onProductSelect,
  placeholder = 'Buscar producto por ID, nombre o código de barras...',
  className = '',
  showSelectedProduct = true,
  selectedProduct = null,
  onClear,
  autoFocus = false,
}) => {
  const [localSelectedProduct, setLocalSelectedProduct] = useState<ProductSearchResult | null>(null);

  const displayProduct = selectedProduct || localSelectedProduct;

  const handleProductSelect = useCallback((item: SearchableDropdownItem) => {
    const product = item as unknown as ProductSearchResult;
    setLocalSelectedProduct(product);
    onProductSelect(product);
  }, [onProductSelect]);

  const handleClear = useCallback(() => {
    setLocalSelectedProduct(null);
    if (onClear) onClear();
  }, [onClear]);

  const handleSearch = useCallback(async (term: string): Promise<SearchableDropdownItem[]> => {
    const trimmedTerm = term.trim();
    if (trimmedTerm.length < 3) return [];
    
    try {
      const results = await productService.searchProducts(trimmedTerm);
      const productsArray = Array.isArray(results) ? results : results ? [results] : [];
      
      const filteredProducts = productsArray
        .filter((p: Record<string, unknown>) => {
          if (typeof p.status === 'boolean') return p.status;
          return p.state !== false && p.is_active !== false;
        })
        .slice(0, 50)
        .map((p: Record<string, unknown>) => getProductDisplay(p));

      return filteredProducts as SearchableDropdownItem[];
    } catch {
      return [];
    }
  }, []);

  const renderItem = useCallback((item: SearchableDropdownItem, _index: number, _isHighlighted: boolean) => {
    const product = item as unknown as ProductSearchResult;
    return (
      <div className="flex items-center gap-3">
        <Package className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {product.name}
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <span>ID: {product.id}</span>
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.barcode && <span>Cod: {product.barcode}</span>}
            {product.stock !== undefined && (
              <span className={product.stock > 0 ? 'text-success' : 'text-error'}>
                Stock: {product.stock}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-primary">
            {typeof product.price === 'number'
              ? product.price.toLocaleString('es-PY', {
                  style: 'currency',
                  currency: 'PYG',
                  minimumFractionDigits: 0,
                })
              : product.price}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <div className={`relative ${className}`}>
      {showSelectedProduct && displayProduct && (
        <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-green-900">
                {displayProduct.name}
              </div>
              <div className="text-sm text-green-700">
                ID: {displayProduct.id}
                {displayProduct.sku && ` | SKU: ${displayProduct.sku}`}
              </div>
            </div>
          </div>
          <Button
            onClick={handleClear}
            className="text-green-600 hover:bg-green-100 p-1"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <SearchableDropdown<SearchableDropdownItem>
        onSelect={handleProductSelect}
        onSearch={handleSearch}
        placeholder={placeholder}
        autoFocus={autoFocus}
        renderItem={renderItem}
        emptyMessage="No se encontraron productos"
        className="w-full"
      />
    </div>
  );
};

export default ProductSearchInput;
