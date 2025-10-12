/**
 * Compact Product Selection Modal
 * Modal component for searching and selecting products with table view
 */

import React, { useState } from 'react';
import { Search, Package, X, Plus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useProductStore from '@/store/useProductStore';
import { isProductActive } from '@/utils/productUtils';

const ProductSelectionModal = ({ isOpen, onClose, onSelectProduct, selectedProductIds = [], activeOnly = true }) => {
  const { products, searchProducts, searchProductByBarcodeFinancial, loading } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      // Check if it looks like a barcode (numeric or contains common barcode patterns)
      const isBarcode = /^\d{8,}$/.test(searchTerm.trim()) ||
                       /^(EAN|UPC|CODE)/i.test(searchTerm.trim());

      if (isBarcode) {
        // Search by barcode
        await searchProductByBarcodeFinancial(searchTerm.trim());
      } else {
        // Search by name or ID
        await searchProducts(searchTerm.trim());
      }
    } catch (error) {
      console.error('Error searching products:', error);
      alert(`Error al buscar productos: ${error.message}`);
    }
  };

  const handleAddProduct = (product) => {
    const productId = product.product_id || product.id || product.productId;
    const productName = product.name || product.product_name || product.title || 'Sin nombre';
    const productDescription = product.description || product.desc || product.product_description || 'Sin descripción';

    onSelectProduct({
      ...product,
      product_id: productId,
      name: productName,
      description: productDescription
    });
  };

  if (!isOpen) return null;

  // Filter products based on activeOnly prop
  const availableProducts = activeOnly
    ? (products || []).filter(product => {
        // Debug: log product structure to understand status field
        if (products.length > 0 && products.indexOf(product) === 0) {
          console.log('Estructura del primer producto:', product);
          console.log('Campos disponibles:', Object.keys(product));
        }
        // Use the existing utility function for consistency
        return isProductActive(product);
      })
    : (products || []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden">
        <Card className="border-0 shadow-none h-full flex flex-col">
          <CardHeader className="pb-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Seleccionar Productos
              </CardTitle>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Buscar por ID, nombre o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                size="sm"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0 flex-1 overflow-hidden">
            {/* Products Table */}
            <div className="border rounded-lg overflow-hidden h-full">
              {availableProducts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">
                    {activeOnly ? 'No hay productos activos' : 'No hay productos'}
                  </p>
                  <p className="text-sm">
                    Busca productos {activeOnly ? 'activos ' : ''}por ID, nombre o código de barras usando el campo de arriba
                  </p>
                </div>
              ) : (
                <div className="overflow-auto h-full">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">ID</th>
                        <th className="text-left p-3 font-medium">Nombre</th>
                        <th className="text-left p-3 font-medium">Descripción</th>
                        <th className="text-center p-3 font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableProducts.map((product, index) => {
                        const productId = product.product_id || product.id || product.productId || `product-${index}`;
                        const productName = product.name || product.product_name || product.title || 'Sin nombre';
                        const productDescription = product.description || product.desc || product.product_description || 'Sin descripción';
                        const isSelected = selectedProductIds.includes(productId);

                        return (
                          <tr key={productId} className="border-t hover:bg-gray-50">
                            <td className="p-3">
                              <span className="font-mono text-sm">{productId}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{productName}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm text-muted-foreground">
                                {productDescription}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                size="sm"
                                onClick={() => handleAddProduct(product)}
                                disabled={isSelected}
                                className="text-xs"
                                variant={isSelected ? "secondary" : "default"}
                              >
                                {isSelected ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t flex-shrink-0">
              <Button onClick={onClose} variant="outline">
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductSelectionModal;
