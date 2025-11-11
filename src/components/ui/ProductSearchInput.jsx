import React, { useState, useEffect } from 'react';
import { Search, Package, X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import useProductStore from '@/store/useProductStore';
import { useThemeStyles } from '@/hooks/useThemeStyles';

const ProductSearchInput = ({ 
  onProductSelect, 
  placeholder = "Buscar producto por ID, nombre o código de barras...",
  className = "",
  showSelectedProduct = true,
  selectedProduct = null,
  onClear = null 
}) => {
  const { styles } = useThemeStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState('name');
  
  const { searchProducts } = useProductStore();

  // Auto-detectar tipo de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setSearchType('name');
      return;
    }

    // Detectar si es ID (8+ caracteres alfanuméricos)
    const looksLikeId = /^[A-Za-z0-9]{8,}$/.test(searchTerm.trim());
    // Detectar si es código de barras (solo números, 8-14 dígitos)
    const looksLikeBarcode = /^\d{8,14}$/.test(searchTerm.trim());
    
    if (looksLikeBarcode) {
      setSearchType('barcode');
    } else if (looksLikeId) {
      setSearchType('id');
    } else {
      setSearchType('name');
    }
  }, [searchTerm]);

  const performSearch = async () => {
    const trimmed = searchTerm.trim();
    
    // Validar longitud mínima según tipo de búsqueda
    const minLength = searchType === 'id' ? 8 : searchType === 'barcode' ? 8 : 3;
    if (!trimmed || trimmed.length < minLength) return;
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      const results = await searchProducts(trimmed);
      const productsArray = Array.isArray(results?.data) ? results.data :
                           Array.isArray(results) ? results :
                           results ? [results] : [];

      setSearchResults(productsArray);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Auto-search on typing (with debounce effect)
    // Validar longitud mínima según tipo detectado
    const trimmed = value.trim();
    const isId = /^[A-Za-z0-9]{8,}$/.test(trimmed);
    const isBarcode = /^\d{8,14}$/.test(trimmed);
    const minLength = isId || isBarcode ? 8 : 3;
    
    if (trimmed.length >= minLength) {
      const timeoutId = setTimeout(performSearch, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setShowResults(false);
      setSearchResults([]);
    }
  };

  const handleProductClick = (product) => {
    setShowResults(false);
    setSearchTerm('');
    setSearchResults([]);
    onProductSelect(product);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    if (onClear) onClear();
  };

  // Limpiar resultados cuando se desmonta el componente
  useEffect(() => {
    return () => {
      setSearchResults([]);
      setShowResults(false);
    };
  }, []);

  const getSearchTypeLabel = () => {
    switch (searchType) {
      case 'id': return 'ID';
      case 'barcode': return 'Código';
      case 'name': 
      default: return 'Nombre';
    }
  };

  const getSearchTypeColor = () => {
    switch (searchType) {
      case 'id': return 'bg-blue-100 text-blue-800';
      case 'barcode': return 'bg-purple-100 text-purple-800';
      case 'name': 
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Product Display */}
      {showSelectedProduct && selectedProduct && (
        <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-green-900">
                {selectedProduct.product_name || selectedProduct.name || selectedProduct.product_id}
              </div>
              <div className="text-sm text-green-700">
                ID: {selectedProduct.product_id} 
                {selectedProduct.barcode && ` | Código: ${selectedProduct.barcode}`}
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

      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              performSearch();
            }
          }}
          className={`pl-10 pr-20 ${styles.input()}`}
        />
        
        {/* Search Type Indicator */}
        {searchTerm && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <span className={`text-xs px-2 py-1 rounded-full ${getSearchTypeColor()}`}>
              {getSearchTypeLabel()}
            </span>
          </div>
        )}
      </div>

      {/* Search Type Help */}
      {searchTerm && searchTerm.length > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          💡 Buscando por {searchType === 'id' ? 'ID de producto' : 
                          searchType === 'barcode' ? 'código de barras' : 
                          'nombre de producto'} ({searchTerm.length}/
          {searchType === 'id' ? '8+' : searchType === 'barcode' ? '8+' : '3+'} caracteres)
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-muted-foreground">
              <Search className="w-4 h-4 animate-spin mx-auto mb-2" />
              Buscando productos...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((product) => (
              <div
                key={product.product_id || product.id}
                onClick={() => handleProductClick(product)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {product.product_name || product.name || product.product_id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {product.product_id}
                      {product.barcode && ` | Código: ${product.barcode}`}
                      {product.stock_quantity !== undefined && 
                        ` | Stock: ${product.stock_quantity}`}
                      {product.unit_prices?.[0]?.price_per_unit && 
                        ` | Precio: PYG ${product.unit_prices[0].price_per_unit.toLocaleString('es-PY')}`}
                      {(!product.unit_prices?.[0]?.price_per_unit && product.price) && 
                        ` | Precio: PYG ${product.price.toLocaleString('es-PY')}`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No se encontraron productos
              <div className="text-xs mt-1">
                Intenta con {searchType === 'name' ? 'un ID o código de barras' : 'el nombre del producto'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchInput;
