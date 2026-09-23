import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useProductStore from '@/store/useProductStore';
import { ProductEnriched } from '@/domain/products/models';
import { useToast } from '@/hooks/useToast';
import { useSearchFocusShortcut } from '@/hooks/useSearchFocusShortcut';
import { telemetry } from '@/utils/telemetry';
import { productService } from '@/services/productService';
import { AdvancedProductSearchPayload, ProductSearchFacet } from '@/types';
import { useBranch } from '@/contexts/BranchContext';

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

  // De-duplicar productos para evitar claves duplicadas de React. Con filas
  // planas (granularity=variant) la unidad es (producto, variante): las
  // variantes comparten el id del padre y NO deben colapsarse en una fila.
  const products = useMemo(() => {
    const seen = new Set();
    return storeProducts.filter((product: any) => {
      const productId = product.id || product.product_id;
      const key = product.variant_id
        ? `${productId}|${product.variant_id}`
        : productId;
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
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

  // F2 → foco al buscador (DESIGN.md §12); muere si hay un modal abierto.
  useSearchFocusShortcut({
    enabled: !(isFormModalOpen || isDetailsModalOpen),
    inputRef: searchInputRef,
  });

  useEffect(() => {
    fetchProductsPaginated(1, 10);
    fetchCategories();
    // Pre-cargar facetas
    productService.getSearchFacets().then(res => {
      if (res && res.facets) setFacets(res.facets);
    }).catch(console.error);
  }, [fetchProductsPaginated, fetchCategories]);

  // El stock es por sucursal: al cambiar la sucursal activa (switcher del
  // header) hay que refethear la vista actual — el store ya vació sus cachés
  // vía el evento 'branch:changed'. Sin esto, la página montada seguía
  // mostrando el stock de la sucursal anterior.
  const { currentBranchId } = useBranch();
  const prevBranchRef = useRef<number | null | undefined>(undefined);
  useEffect(() => {
    if (prevBranchRef.current === undefined) {
      prevBranchRef.current = currentBranchId ?? null;
      return;
    }
    const nextBranch = currentBranchId ?? null;
    if (prevBranchRef.current === nextBranch) return;
    prevBranchRef.current = nextBranch;
    telemetry.record('products.refetch.branch_changed', { branchId: nextBranch });

    if (viewMode === 'search') {
      if (Object.keys(advancedSearchPayload).length > 0 || localFilters.category !== 'all' || localFilters.status !== 'all') {
        const payload: AdvancedProductSearchPayload = { ...advancedSearchPayload, search: searchTerm, page: 1, page_size: 10, granularity: 'variant' };
        if (localFilters.category !== 'all' && !payload.category_id) payload.category_id = parseInt(localFilters.category);
        setIsSearching(true);
        productService.searchAdvanced(payload)
          .then(res => {
            setAdvancedProducts(res.products || []);
            setAdvancedTotal(res.total_count || 0);
          })
          .catch(console.error)
          .finally(() => setIsSearching(false));
      } else if (searchTerm) {
        searchProducts(1, 10, searchTerm);
      } else {
        fetchProductsPaginated(1, 10);
      }
    } else {
      fetchProductsPaginated(1, 10);
    }
    // Solo reacciona al cambio de sucursal; el closure lee el resto del
    // estado vigente al momento del cambio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranchId]);

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
        if (Object.keys(advancedSearchPayload).length > 0 || localFilters.category !== 'all' || localFilters.status !== 'all') {
          const payload = { ...advancedSearchPayload, search: searchTerm, page: currentPage - 1, page_size: 10, granularity: 'variant' as const };
          if (localFilters.category !== 'all' && !payload.category_id) payload.category_id = parseInt(localFilters.category);
          
          setIsSearching(true);
          productService.searchAdvanced(payload)
            .then(res => { setAdvancedProducts(res.products || []); setAdvancedTotal(res.total_count || 0); })
            .catch(console.error)
            .finally(() => setIsSearching(false));
        } else {
          searchProducts(currentPage - 1, 10, searchTerm);
        }
      } else {
        fetchProductsPaginated(currentPage - 1, 10);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (viewMode === 'search') {
        if (Object.keys(advancedSearchPayload).length > 0 || localFilters.category !== 'all' || localFilters.status !== 'all') {
          const payload = { ...advancedSearchPayload, search: searchTerm, page: currentPage + 1, page_size: 10, granularity: 'variant' as const };
          if (localFilters.category !== 'all' && !payload.category_id) payload.category_id = parseInt(localFilters.category);
          
          setIsSearching(true);
          productService.searchAdvanced(payload)
            .then(res => { setAdvancedProducts(res.products || []); setAdvancedTotal(res.total_count || 0); })
            .catch(console.error)
            .finally(() => setIsSearching(false));
        } else {
          searchProducts(currentPage + 1, 10, searchTerm);
        }
      } else {
        fetchProductsPaginated(currentPage + 1, 10);
      }
    }
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
    
    // Si se aplicaron filtros avanzados (usando la nueva API)
    // Inclusive si solo seleccionaron categoría, usamos la búsqueda avanzada porque es más potente
    if (Object.keys(advancedSearchPayload).length > 0 || localFilters.category !== 'all' || localFilters.status !== 'all') {
      setViewMode('search');
      setIsSearching(true);
      
      const payload: AdvancedProductSearchPayload = { ...advancedSearchPayload, search: searchTerm, page: 1, page_size: 10, granularity: 'variant' };
      
      // Si la categoría está en localFilters pero no en advancedSearchPayload, agregarla
      if (localFilters.category !== 'all' && !payload.category_id) {
        payload.category_id = parseInt(localFilters.category);
      }
      
      productService.searchAdvanced(payload)
        .then(res => {
          setAdvancedProducts(res.products || []);
          setAdvancedTotal(res.total_count || 0);
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
    if (searchTerm) {
      performSearch(searchTerm); // fallback a la búsqueda simple
    } else {
      setViewMode('paginated');
      fetchProductsPaginated(1, 10);
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

  // Fila plana (granularity=variant, PLAN_VARIANTES_PLANAS_AJUSTES_PRODUCTOS
  // F-C): la fila trae la unidad vendible; los modales admin necesitan el
  // producto PADRE enriquecido (formulario completo + gestor de variantes).
  const resolveEnrichedForModal = async (product: any): Promise<ProductEnriched> => {
    const isEnriched = product?.description !== undefined && product?.unit_prices !== undefined;
    if (isEnriched) return product;
    const productId = String(product?.id || product?.product_id || '');
    try {
      // getById retorna el ProductEnriched del contrato API; el hook trabaja
      // con el modelo de dominio (state no-opcional).
      return (await productService.getById(productId)) as unknown as ProductEnriched;
    } catch (err) {
      console.error('Error resolving enriched product for modal', err);
      return product; // degradación: abrir con la fila tal cual
    }
  };

  const handleOpenEditModal = async (product: ProductEnriched) => {
    setSelectedProduct(await resolveEnrichedForModal(product));
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedProduct(null);
    handleRefresh();
  };

  const handleOpenDetailsModal = async (product: ProductEnriched) => {
    setSelectedProduct(await resolveEnrichedForModal(product));
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
