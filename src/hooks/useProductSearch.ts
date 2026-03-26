import { useState, useCallback, useRef } from 'react';
import { productService } from '@/services/productService';

export interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  base_unit: string;
  taxRate: number;
  [key: string]: unknown;
}

interface UseProductSearchOptions {
  debounceMs?: number;
  minSearchLength?: number;
  maxResults?: number;
}

interface UseProductSearchReturn {
  items: ProductSearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (term: string) => Promise<void>;
  clear: () => void;
  searchByBarcode: (barcode: string) => Promise<ProductSearchResult | null>;
}

const getProductDisplay = (product: Record<string, unknown>): ProductSearchResult => {
  const rawTaxRateCandidates = [
    product.tax_rate,
    product.tax_rate_value,
    product.tax_percentage,
    product.vat_rate,
    product.iva,
    product.tax?.rate,
    product.tax?.percentage,
    product.metadata?.tax_rate,
  ];

  const taxInfo = product.applicable_tax_rate || product.tax?.rate;
  const rawTaxRate = (
    typeof taxInfo === 'object' ? (taxInfo as Record<string, unknown>)?.rate : taxInfo
  ) ?? rawTaxRateCandidates.find(candidate => candidate !== undefined && candidate !== null);

  let normalizedTaxRate = 0;
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
    (Array.isArray(product.unit_prices) && (product.unit_prices[0] as Record<string, unknown>)?.price_per_unit) ||
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

export function useProductSearch(options: UseProductSearchOptions = {}): UseProductSearchReturn {
  const { minSearchLength = 3, maxResults = 50 } = options;
  
  const [items, setItems] = useState<ProductSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (term: string) => {
    const trimmedTerm = term.trim();
    
    if (trimmedTerm.length < minSearchLength) {
      setItems([]);
      setError(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const results = await productService.searchProducts(trimmedTerm, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      const productsArray = Array.isArray(results) ? results : results ? [results] : [];
      
      const filteredProducts = productsArray
        .filter((p: Record<string, unknown>) => {
          if (typeof p.status === 'boolean') return p.status;
          return p.state !== false && p.is_active !== false;
        })
        .slice(0, maxResults)
        .map((p: Record<string, unknown>) => getProductDisplay(p));

      setItems(filteredProducts);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError('Error al buscar productos');
      setItems([]);
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [minSearchLength, maxResults]);

  const clear = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setItems([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const searchByBarcode = useCallback(async (barcode: string): Promise<ProductSearchResult | null> => {
    if (!barcode.trim()) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await productService.getProductByBarcode(barcode);
      const product = Array.isArray(result) ? result[0] : result;
      
      if (product) {
        return getProductDisplay(product);
      }
      return null;
    } catch (err) {
      setError('Error al buscar por código de barras');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    items,
    isLoading,
    error,
    search,
    clear,
    searchByBarcode,
  };
}

export default useProductSearch;
