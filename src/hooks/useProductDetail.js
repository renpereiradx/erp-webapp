/**
 * Hook personalizado para gestionar los detalles de un producto
 * Facilita la obtención y actualización de productos individuales
 */

import { useState, useEffect } from 'react';
import { productService } from '@/services/productService';

export const useProductDetail = (productId, options = {}) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { 
    enriched = true, 
    autoLoad = true,
    onSuccess,
    onError 
  } = options;

  const loadProduct = async (id = productId) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const productData = enriched 
        ? await productService.getProductByIdEnriched(id)
        : await productService.getProductById(id);
      
      setProduct(productData);
      onSuccess && onSuccess(productData);
      
      return productData;
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar el producto';
      setError(errorMessage);
      onError && onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshProduct = () => {
    return loadProduct(productId);
  };

  const updateProduct = async (updates) => {
    if (!product?.id) return;
    
    try {
      const updatedProduct = await productService.updateProduct(product.id, updates);
      setProduct(prev => ({ ...prev, ...updatedProduct }));
      return updatedProduct;
    } catch (err) {
      setError(err.message || 'Error al actualizar el producto');
      throw err;
    }
  };

  // Auto-cargar el producto cuando se proporciona un ID
  useEffect(() => {
    if (autoLoad && productId) {
      loadProduct();
    }
  }, [productId, autoLoad, enriched]);

  return {
    product,
    loading,
    error,
    loadProduct,
    refreshProduct,
    updateProduct,
    setProduct, // Para actualizaciones locales
    setError,   // Para limpiar errores manualmente
  };
};

// Hook simplificado para solo obtener un producto
export const useProduct = (productId, enriched = true) => {
  return useProductDetail(productId, { enriched, autoLoad: true });
};

export default useProductDetail;
