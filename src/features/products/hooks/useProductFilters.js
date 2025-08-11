import { useCallback, useEffect, useMemo, useState } from 'react';
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
    if (!onApiSearch) return;
    const term = apiSearchTerm.trim();
    if (term.length >= minChars) {
      await onApiSearch(term);
    } else if (term.length === 0) {
      onClear?.();
    } else {
      // No dispares búsqueda si no alcanza el umbral mínimo
    }
  }, [apiSearchTerm, onApiSearch, onClear, minChars]);

  const handleApiSearchKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleApiSearch();
    } else if (e.key === 'Escape') {
      // limpiar búsqueda rápida
      setApiSearchTerm('');
      onClear?.();
    }
  }, [handleApiSearch, onClear]);

  const handleClearSearch = useCallback(() => {
    setApiSearchTerm('');
    setLocalSearchTerm('');
    setSelectedCategory('all');
    setSelectedStock('all');
    onClear?.();
    try { localStorage.removeItem(persistKey); } catch {
      // ignore storage remove errors
    }
  }, [onClear, persistKey]);

  // Búsqueda automática con debounce y cancelación (opcional)
  useEffect(() => {
    if (!autoSearch) return;
    if (!onApiSearch) return;

    const term = debouncedApiSearchTerm?.trim?.() || '';
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    if (term.length >= minChars) {
      Promise.resolve(onApiSearch(term, { signal: controller?.signal })).catch(() => {
        // Ignorar errores de cancelación u otros
      });
    } else if (term.length === 0) {
      onClear?.();
    } else {
      // Si no alcanza el umbral, no hacer nada (mantener resultados actuales)
    }

    return () => {
      controller?.abort?.();
    };
  }, [autoSearch, debouncedApiSearchTerm, onApiSearch, onClear, minChars]);

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
