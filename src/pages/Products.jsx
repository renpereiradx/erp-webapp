// ===========================================================================
// Products Page - MVP Implementation
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md
// ===========================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Share, Plus, ChevronLeft, ChevronRight, MoreHorizontal, X, Calendar, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import useProductStore from '@/store/useProductStore';
import DataState from '@/components/ui/DataState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import ProductFormModal from '@/components/ProductFormModal';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import '@/styles/scss/pages/_products.scss';

/**
 * Custom hook para debounce
 * @param {Function} callback - Función a ejecutar después del debounce
 * @param {number} delay - Retraso en milisegundos
 */
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedFunction = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunction;
};

const Products = () => {
  const { t } = useI18n();

  // Zustand store
  const {
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    fetchProducts,
    fetchProductsPaginated,
    fetchCategories,
    categories,
    filters,
    setFilters,
    setCurrentPage,
    clearError,
  } = useProductStore();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' o 'search'
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    category: 'all',
    status: 'all',
  });

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Cargar productos paginados y categorías al inicio
  useEffect(() => {
    fetchProductsPaginated(1, 10);
    fetchCategories();
  }, [fetchProductsPaginated, fetchCategories]);

  // Función de búsqueda con validación de mínimo 4 caracteres
  const performSearch = useCallback((term) => {
    const trimmedTerm = term.trim();

    // Si el término está vacío, volver a modo paginado
    if (!trimmedTerm) {
      setIsSearching(false);
      setHasSearched(false);
      setViewMode('paginated');
      fetchProductsPaginated(1, 10);
      return;
    }

    // Validar mínimo 4 caracteres
    if (trimmedTerm.length < 4) {
      setIsSearching(false);
      return;
    }

    // Realizar búsqueda
    setIsSearching(true);
    setHasSearched(true);
    setViewMode('search');
    fetchProducts(1, 10, trimmedTerm).finally(() => {
      setIsSearching(false);
    });
  }, [fetchProducts, fetchProductsPaginated]);

  // Debounce de 500ms para la búsqueda
  const debouncedSearch = useDebounce(performSearch, 500);

  // Handlers
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = searchTerm.trim();
      if (value.length >= 4) {
        // Cancelar el debounce pendiente y buscar inmediatamente
        performSearch(value);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (viewMode === 'search') {
        fetchProducts(currentPage - 1, 10, searchTerm);
      } else {
        fetchProductsPaginated(currentPage - 1, 10);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (viewMode === 'search') {
        fetchProducts(currentPage + 1, 10, searchTerm);
      } else {
        fetchProductsPaginated(currentPage + 1, 10);
      }
    }
  };

  // Handler para aplicar filtros
  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
    if (viewMode === 'paginated') {
      fetchProductsPaginated(1, 10);
    }
  };

  // Handler para limpiar filtros
  const handleClearFilters = () => {
    const clearedFilters = { category: 'all', status: 'all' };
    setLocalFilters(clearedFilters);
    setFilters(clearedFilters);
    if (viewMode === 'paginated') {
      fetchProductsPaginated(1, 10);
    }
  };

  // Handler para refrescar datos
  const handleRefresh = () => {
    if (viewMode === 'search' && searchTerm) {
      fetchProducts(currentPage, 10, searchTerm);
    } else {
      fetchProductsPaginated(currentPage, 10);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString || dateString.startsWith('0001')) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id || p.product_id));
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const getStockDisplay = (product) => {
    // Handle both financial API format (stock_quantity) and standard format (stock, quantity)
    const stock = product.stock_quantity ?? product.stock ?? product.quantity ?? 0;
    const isLow = stock < 10;

    return {
      display: isLow ? t('products.stock.low', { quantity: stock }) : stock.toString(),
      isLow
    };
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    setSelectedProduct(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedProduct(null);
    // Reload products after modal closes to get updated data
    if (viewMode === 'search' && searchTerm) {
      fetchProducts(currentPage, 10, searchTerm);
    } else {
      fetchProductsPaginated(currentPage, 10);
    }
  };

  const handleOpenDetailsModal = (product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleEditFromDetails = (product) => {
    setIsDetailsModalOpen(false);
    setSelectedProduct(product);
    setIsFormModalOpen(true);
  };

  const getHealthIndicator = (product) => {
    // Use financial health data from API if available, otherwise use simple logic
    const stock = product.stock_quantity ?? product.stock ?? product.quantity ?? 0;
    const isActive = product.state !== false && product.is_active !== false;

    // If financial_health data is available from the API, use it
    if (product.financial_health) {
      const { has_prices, has_costs, has_stock } = product.financial_health;

      if (!has_prices || !has_costs || !has_stock) {
        return { level: 'poor', text: t('products.health.poor') };
      } else if (stock < 10) {
        return { level: 'at-risk', text: t('products.health.at_risk') };
      } else {
        return { level: 'healthy', text: t('products.health.healthy') };
      }
    }

    // Fallback to simple logic
    if (!isActive || stock === 0) {
      return { level: 'poor', text: t('products.health.poor') };
    } else if (stock < 10) {
      return { level: 'at-risk', text: t('products.health.at_risk') };
    } else {
      return { level: 'healthy', text: t('products.health.healthy') };
    }
  };

  const startIndex = (currentPage - 1) * 10 + 1;
  const endIndex = Math.min(currentPage * 10, totalProducts);

    return (
      <div className="products-page">
        {/* Page Header */}
        <header className="page-header">
          <div className="page-header__content">
            <h1 className="page-header__title">
              {t('products.page.title')}
            </h1>
            <p className="page-header__subtitle">
              {t('products.page.subtitle')}
            </p>
          </div>
        </header>
  
        {/* Toolbar */}
        <div className="toolbar">
          {/* Search */}
          <div className="toolbar__search">
            <div className="search-box">
              <div className="search-box__icon-wrapper">
                {isSearching ? (
                  <div className="spinner spinner--small" />
                ) : (
                  <Search className="search-box__icon" aria-hidden="true" />
                )}
              </div>
              <Input
                type="search"
                className="search-box__input"
                placeholder={t('products.search.by_name_sku')}
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={handleSearchKeyDown}
                aria-label={t('products.search.by_name_sku')}
                aria-describedby="search-helper"
              />
            </div>
            {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 4 && (
              <p id="search-helper" style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                Escribe al menos 4 caracteres para buscar ({searchTerm.trim().length}/4)
              </p>
            )}
          </div>
  
          {/* Actions */}
          <div className="toolbar__actions">
            <Button
              variant="secondary"
              size="icon"
              className={showFilters ? 'btn--active' : ''}
              aria-label={t('products.action.filter')}
              title={t('products.action.filter')}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="btn__icon" aria-hidden="true" />
            </Button>
  
            <Button
              variant="secondary"
              size="icon"
              aria-label={t('products.action.refresh', 'Refrescar')}
              title={t('products.action.refresh', 'Refrescar')}
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`btn__icon ${loading ? 'spin' : ''}`} aria-hidden="true" />
            </Button>
  
            <Button
              variant="secondary"
              size="icon"
              aria-label={t('products.action.export')}
              title={t('products.action.export')}
            >
              <Share className="btn__icon" aria-hidden="true" />
            </Button>
  
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              className="gap-2"
            >
              <Plus className="btn__icon" aria-hidden="true" />
              <span>{t('products.action.new_product')}</span>
            </Button>
          </div>
        </div>
  
        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel" style={{ padding: '24px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Filtro por categoría */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>
                {t('products.filter.category', 'Categoría')}
              </label>
              <Select
                value={localFilters.category}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="input" style={{ width: '220px', height: '40px' }}>
                  <SelectValue placeholder={t('products.filter.all_categories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('products.filter.all_categories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            {/* Filtro por estado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>
                {t('products.filter.status', 'Estado')}
              </label>
              <Select
                value={localFilters.status}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="input" style={{ width: '180px', height: '40px' }}>
                  <SelectValue placeholder={t('products.filter.all_statuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('products.filter.all_statuses')}</SelectItem>
                  <SelectItem value="active">{t('products.state.active')}</SelectItem>
                  <SelectItem value="inactive">{t('products.state.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                variant="primary"
                onClick={handleApplyFilters}
                size="sm"
                style={{ padding: '0 24px', height: '40px' }}
              >
                {t('products.filter.apply', 'Aplicar')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleClearFilters}
                size="sm"
                style={{ padding: '0 24px', height: '40px' }}
              >
                {t('products.filter.clear', 'Limpiar')}
              </Button>
            </div>
          </div>
        )}
  
        {/* Products Table */}
        <div className="products-table">
          <div className="products-table__container">
            <table className="products-table__table">
              <thead className="products-table__thead">
                <tr>
                  <th className="products-table__th products-table__th--checkbox" scope="col">
                    <Checkbox
                      checked={selectedIds.length === products.length && products.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="products-table__th" scope="col">
                    {t('products.table.product_name')}
                  </th>
                  <th className="products-table__th" scope="col">
                    {t('products.table.category')}
                  </th>
                  <th className="products-table__th" scope="col">
                    {t('products.table.stock')}
                  </th>
                  <th className="products-table__th" scope="col">
                    {t('products.table.state')}
                  </th>
                  <th className="products-table__th" scope="col">
                    {t('products.table.financial_health')}
                  </th>
                  <th className="products-table__th" scope="col">
                    {t('products.table.created_at', 'Creado')}
                  </th>
                  <th className="products-table__th" scope="col">
                    {t('products.table.updated_at', 'Actualizado')}
                  </th>
                  <th className="products-table__th products-table__th--actions" scope="col">
                    <span className="sr-only">{t('products.table.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="products-table__tbody">
                {/* Estado: Cargando */}
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <DataState 
                        variant="loading" 
                        skeletonVariant="list" 
                        skeletonProps={{ count: 10 }} 
                      />
                    </td>
                  </tr>
                ) : /* Estado: Error */
                error ? (
                  <tr>
                    <td colSpan="9">
                      <DataState
                        variant="error"
                        title={t('products.error.title')}
                        message={error}
                        onRetry={() => {
                          clearError();
                          handleRefresh();
                        }}
                      />
                    </td>
                  </tr>
                ) : /* Estado: Sin productos */
                products.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <DataState
                        variant="empty"
                        title={viewMode === 'search' ? t('products.empty.no_results') : t('products.empty.title')}
                        description={viewMode === 'search' 
                          ? `No se encontraron productos con "${searchTerm}"` 
                          : t('products.empty.description')}
                        actionLabel={t('products.action.new_product')}
                        onAction={handleOpenCreateModal}
                      />
                    </td>
                  </tr>
                ) : /* Estado: Productos encontrados */
                products.map((product) => {
                  const productId = product.product_id || product.id;
                  const productName = product.product_name || product.name || t('field.no_name');
                  const categoryName = product.category_name || product.category?.name || '-';
                  const isSelected = selectedIds.includes(productId);
                  const stockInfo = getStockDisplay(product);
                  const healthInfo = getHealthIndicator(product);
                  const isActive = product.state !== false && product.is_active !== false;
  
                  return (
                    <tr key={productId}>
                      <td className="products-table__td products-table__td--checkbox">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectProduct(productId)}
                        />
                      </td>
                      <td 
                        className="products-table__td products-table__td--name"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenDetailsModal(product)}
                      >
                        {productName}
                      </td>
                      <td className="products-table__td">
                        {categoryName}
                      </td>
                      <td className={`products-table__td ${stockInfo.isLow ? 'products-table__td--stock-low' : ''}`}>
                        {stockInfo.display}
                      </td>
                      <td className="products-table__td">
                        <span className={`badge ${isActive ? 'badge--active' : 'badge--inactive'}`}>
                          {isActive ? t('products.state.active') : t('products.state.inactive')}
                        </span>
                      </td>
                      <td className="products-table__td">
                        <div className="health-indicator">
                          <div className={`health-indicator__dot health-indicator__dot--${healthInfo.level}`}></div>
                          <span className="health-indicator__text">{healthInfo.text}</span>
                        </div>
                      </td>
                      <td className="products-table__td" style={{ fontSize: '12px' }}>
                        {formatDate(product.created_at)}
                      </td>
                      <td className="products-table__td" style={{ fontSize: '12px' }}>
                        {formatDate(product.updated_at)}
                      </td>
                      <td className="products-table__td products-table__td--actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(product)}
                        >
                          <MoreHorizontal className="btn__icon" aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
  
          {/* Pagination */}
          <div className="pagination">
            <span className="pagination__info">
              {t('products.pagination.showing', {
                start: startIndex,
                end: endIndex,
                total: totalProducts
              })}
            </span>
            <div className="pagination__controls">
              <button
                className="pagination__button"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft className="pagination__icon" aria-hidden="true" />
              </button>
              <span className="pagination__page-info">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                className="pagination__button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                aria-label="Página siguiente"
              >
                <ChevronRight className="pagination__icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
  

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        product={selectedProduct}
      />

      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        product={selectedProduct}
        onEdit={handleEditFromDetails}
      />
    </div>
  );
};

export default Products;
