import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
// Optional debounce for future auto-search; not used by default to avoid behavior changes
import { useDebouncedValue } from './useDebouncedValue';

/**
 * useProductFilters
 * Extrae y centraliza estado/handlers para búsqueda en API y filtros locales.
 * Se apoya en el store existente a través de callbacks recibidos.
 *
 * Contract
 * - inputs: { products, categories, onApiSearch(term), onClear() }
 * - outputs: state + handlers + filteredProducts
 */
export function useProductFilters({ products = [], onApiSearch, onClear, persistKey = 'products.filters.v1', autoSearch = false, debounceMs = 350, minChars = 1 }) {
  // Refs para estabilizar callbacks
  const onApiSearchRef = useRef(onApiSearch);
  const onClearRef = useRef(onClear);
  const abortControllerRef = useRef(null);
  
  // Actualizar refs cuando cambien las props
  onApiSearchRef.current = onApiSearch;
  onClearRef.current = onClear;
  // Estado UI (igual que en Products.jsx para mantener compatibilidad)
  const getInitial = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(persistKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      // ignore JSON/storage errors and fallback to defaults
      return null;
    }
  };
  const initial = getInitial();
  const [apiSearchTerm, setApiSearchTerm] = useState(initial?.apiSearchTerm ?? '');
  const [localSearchTerm, setLocalSearchTerm] = useState(initial?.localSearchTerm ?? '');
  const [selectedCategory, setSelectedCategory] = useState(initial?.selectedCategory ?? 'all');
  const [selectedStock, setSelectedStock] = useState(initial?.selectedStock ?? 'all');

  // Persistir cambios
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        persistKey,
        JSON.stringify({ apiSearchTerm, localSearchTerm, selectedCategory, selectedStock })
      );
    } catch {
      // ignore storage write errors
    }
  }, [persistKey, apiSearchTerm, localSearchTerm, selectedCategory, selectedStock]);

  // Debounce disponible para futura activación (no usado aún para no cambiar UX)
  const { value: debouncedApiSearchTerm } = useDebouncedValue(apiSearchTerm, debounceMs);

  const handleApiSearch = useCallback(async () => {
    const apiSearchFn = onApiSearchRef.current;
    const clearFn = onClearRef.current;
    
    if (!apiSearchFn) return;
    const term = apiSearchTerm.trim();
    if (term.length >= minChars) {
      await apiSearchFn(term);
    } else if (term.length === 0) {
      clearFn?.();
    } else {
      // No dispares búsqueda si no alcanza el umbral mínimo
    }
  }, [apiSearchTerm, minChars]);

  const handleApiSearchKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleApiSearch();
    } else if (e.key === 'Escape') {
      // limpiar búsqueda rápida
      setApiSearchTerm('');
      onClearRef.current?.();
    }
  }, [handleApiSearch]);

  const handleClearSearch = useCallback(() => {
    setApiSearchTerm('');
    setLocalSearchTerm('');
    setSelectedCategory('all');
    setSelectedStock('all');
    onClearRef.current?.();
    try { localStorage.removeItem(persistKey); } catch {
      // ignore storage remove errors
    }
  }, [persistKey]);

  // Búsqueda automática con debounce y cancelación (opcional)
  useEffect(() => {
    if (!autoSearch) return;

    const term = debouncedApiSearchTerm?.trim?.() || '';
    
    // Cancelar búsqueda anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Solo crear AbortController si está disponible
    if (typeof AbortController !== 'undefined') {
      abortControllerRef.current = new AbortController();
    }

    const executeSearch = async () => {
      try {
        const apiSearchFn = onApiSearchRef.current;
        const clearFn = onClearRef.current;
        const controller = abortControllerRef.current;
        
        if (term.length >= minChars) {
          await apiSearchFn?.(term, { signal: controller?.signal });
        } else if (term.length === 0) {
          clearFn?.();
        }
      } catch (error) {
        // Ignorar errores de cancelación u otros
        if (error?.name !== 'AbortError') {
          console.warn('Error en búsqueda automática:', error);
        }
      }
    };

    // Ejecutar la búsqueda
    executeSearch();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [autoSearch, debouncedApiSearchTerm, minChars]); // Removed onApiSearch and onClear from deps

  const filteredProducts = useMemo(() => {
    const term = localSearchTerm.toLowerCase();
    return products.filter((product) => {
      const matchesLocalSearch = term === '' || (product.name || '').toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'all' || product.category_id == selectedCategory;
      const matchesStock =
        selectedStock === 'all' ||
        (selectedStock === 'active' && product.is_active) ||
        (selectedStock === 'inactive' && !product.is_active);
      return matchesLocalSearch && matchesCategory && matchesStock;
    });
  }, [products, localSearchTerm, selectedCategory, selectedStock]);

  // Cleanup cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // estado expuesto
    apiSearchTerm,
    setApiSearchTerm,
    localSearchTerm,
    setLocalSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStock,
    setSelectedStock,

    // derivados
    filteredProducts,
    debouncedApiSearchTerm,
  minChars,

    // handlers
    handleApiSearch,
    handleApiSearchKeyPress,
    handleClearSearch,
  resetFilters: handleClearSearch,
  };
}

export default useProductFilters;
