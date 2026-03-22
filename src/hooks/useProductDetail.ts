/**
 * Hook personalizado para gestionar los detalles de un producto
 * Facilita la obtención y actualización de productos individuales
 */

import { useState, useEffect, useCallback } from 'react';
import { productService } from '@/services/productService';
import { ProductOperationInfoResponse } from '@/types';

export interface UseProductDetailOptions {
  enriched?: boolean;
  autoLoad?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useProductDetail = (productId?: string | null, options: UseProductDetailOptions = {}) => {
  const [product, setProduct] = useState<ProductOperationInfoResponse | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    enriched = true, 
    autoLoad = true,
    onSuccess,
    onError 
  } = options;

  const loadProduct = useCallback(async (id: string | null | undefined = productId) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Usar Info en lugar de Enriched por el cambio de API
      const productData = enriched 
        ? await productService.getProductByIdInfo(id)
        : await productService.getProductById(id);
      
      setProduct(productData);
      if (onSuccess) onSuccess(productData);
      
      return productData;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar el producto';
      setError(errorMessage);
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [productId, enriched, onSuccess, onError]);

  const refreshProduct = useCallback(() => {
    return loadProduct(productId);
  }, [loadProduct, productId]);

  const updateProduct = async (updates: any) => {
    if (!product?.id && !product?.product_id) return;
    
    try {
      const idToUpdate = product.id || product.product_id;
      const updatedProduct = await productService.updateProduct(idToUpdate, updates);
      setProduct((prev: any) => ({ ...prev, ...updatedProduct }));
      return updatedProduct;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el producto');
      throw err;
    }
  };

  // Auto-cargar el producto cuando se proporciona un ID
  useEffect(() => {
    let ignore = false;
    
    if (autoLoad && productId) {
      if (!ignore) {
        loadProduct();
      }
    }
    
    return () => {
      ignore = true;
    };
  }, [productId, autoLoad, loadProduct]);

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
export const useProduct = (productId?: string | null, enriched = true) => {
  return useProductDetail(productId, { enriched, autoLoad: true });
};

export default useProductDetail;
