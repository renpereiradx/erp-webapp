import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useProductStore from '@/store/useProductStore';
import { ProductEnriched } from '@/domain/products/models';
import { useToast } from '@/hooks/useToast';
import { telemetry } from '@/utils/telemetry';
import { productService } from '@/services/productService';
import { AdvancedProductSearchPayload, ProductSearchFacet } from '@/types';

export type ViewMode = 'paginated' | 'search';

export const useProductsLogic = () => {
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Zustand store
  const {
    products: storeProducts,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    fetchProducts: searchProducts, // searchProducts llama a fetchProducts del store
    fetchProductsPaginated,
    fetchCategories,
    categories,
    setFilters,
    setCurrentPage,
    clearError,
  } = useProductStore();

  // De-duplicar productos por ID para evitar claves duplicadas de React
  const products = useMemo(() => {
    const seen = new Set();
    return storeProducts.filter((product: any) => {
      const id = product.id || product.product_id;
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [storeProducts]);

  const { errorFrom } = toast;
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      telemetry.record('products.error.store', { message: error });
      errorFrom(error);
      lastErrorRef.current = error;
    } else if (!error) {
      lastErrorRef.current = null;
    }
  }, [error, errorFrom]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('paginated');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    category: 'all',
    status: 'all',
  });

  const [facets, setFacets] = useState<ProductSearchFacet[]>([]);
  const [advancedSearchPayload, setAdvancedSearchPayload] = useState<AdvancedProductSearchPayload>({});
  const [advancedProducts, setAdvancedProducts] = useState<ProductEnriched[]>([]);
  const [advancedTotal, setAdvancedTotal] = useState(0);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductEnriched | null>(null);

  useEffect(() => {
    fetchProductsPaginated(1, 10);
    fetchCategories();
    // Pre-cargar facetas
    productService.getSearchFacets().then(res => {
      if (res && res.facets) setFacets(res.facets);
    }).catch(console.error);
  }, [fetchProductsPaginated, fetchCategories]);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(
    (term: string) => {
      const trimmedTerm = term.trim();

      if (!trimmedTerm) {
        setIsSearching(false);
        setViewMode('paginated');
        fetchProductsPaginated(1, 10);
        return;
      }

      if (trimmedTerm.length < 3) {
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setViewMode('search');
      searchProducts(1, 10, trimmedTerm).finally(() => {
        setIsSearching(false);
      });
    },
    [searchProducts, fetchProductsPaginated],
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      const value = searchTerm.trim();
      if (value.length >= 3) {
        performSearch(value);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (viewMode === 'search') {
        searchProducts(currentPage - 1, 10, searchTerm);
      } else {
        fetchProductsPaginated(currentPage - 1, 10);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (viewMode === 'search') {
        searchProducts(currentPage + 1, 10, searchTerm);
      } else {
        fetchProductsPaginated(currentPage + 1, 10);
      }
    }
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
    
    // Si se aplicaron filtros avanzados (usando la nueva API)
    if (Object.keys(advancedSearchPayload).length > 0) {
      setViewMode('search');
      setIsSearching(true);
      productService.searchAdvanced({ ...advancedSearchPayload, search: searchTerm, page: 1, page_size: 10 })
        .then(res => {
          setAdvancedProducts(res.data || []);
          setAdvancedTotal(res.total || 0);
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    } else if (viewMode === 'paginated') {
      fetchProductsPaginated(1, 10);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = { category: 'all', status: 'all' };
    setLocalFilters(clearedFilters);
    setFilters(clearedFilters);
    setAdvancedSearchPayload({});
    if (viewMode === 'paginated') {
      fetchProductsPaginated(1, 10);
    } else if (viewMode === 'search') {
      performSearch(searchTerm); // fallback a la búsqueda simple
    }
  };

  const handleRefresh = () => {
    if (viewMode === 'search' && searchTerm) {
      searchProducts(currentPage, 10, searchTerm);
    } else {
      fetchProductsPaginated(currentPage, 10);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length && products.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p: any) => String(p.id || p.product_id)));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const handleOpenCreateModal = () => {
    setSelectedProduct(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductEnriched) => {
    setSelectedProduct(product);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedProduct(null);
    handleRefresh();
  };

  const handleOpenDetailsModal = (product: ProductEnriched) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleEditFromDetails = (product: ProductEnriched) => {
    setIsDetailsModalOpen(false);
    setSelectedProduct(product);
    setIsFormModalOpen(true);
  };

  return {
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    categories,
    searchTerm,
    selectedIds,
    isSearching,
    viewMode,
    showFilters,
    localFilters,
    isFormModalOpen,
    isDetailsModalOpen,
    selectedProduct,
    toast,
    searchInputRef,
    setShowFilters,
    setLocalFilters,
    handleSearch,
    handleSearchKeyDown,
    handlePreviousPage,
    handleNextPage,
    handleApplyFilters,
    handleClearFilters,
    handleRefresh,
    toggleSelectAll,
    toggleSelectProduct,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleOpenDetailsModal,
    handleCloseDetailsModal,
    handleEditFromDetails,
    clearError,
    facets,
    advancedSearchPayload,
    setAdvancedSearchPayload,
    advancedProducts,
    advancedTotal,
  };
};
