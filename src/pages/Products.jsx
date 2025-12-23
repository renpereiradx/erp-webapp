// ===========================================================================
// Products Page - MVP Implementation
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md
// ===========================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Share, Plus, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import useProductStore from '@/store/useProductStore';
import DataState from '@/components/ui/DataState';
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
    setCurrentPage,
    clearError,
  } = useProductStore();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // DESHABILITADO: No cargar productos automáticamente
  // Los productos solo se cargarán cuando el usuario realice una búsqueda explícita
  // useEffect(() => {
  //   if (!searchTerm) {
  //     fetchProducts();
  //   }
  // }, []);

  // Función de búsqueda con validación de mínimo 4 caracteres
  const performSearch = useCallback((term) => {
    const trimmedTerm = term.trim();

    // Si el término está vacío, limpiar búsqueda pero no cargar productos
    if (!trimmedTerm) {
      setIsSearching(false);
      setHasSearched(false);
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
    fetchProducts(1, 10, trimmedTerm).finally(() => {
      setIsSearching(false);
    });
  }, [fetchProducts]);

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
      fetchProducts(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      fetchProducts(currentPage + 1);
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
    fetchProducts();
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
                <div className="spinner" style={{ width: '16px', height: '16px' }} />
              ) : (
                <Search className="search-box__icon" aria-hidden="true" />
              )}
            </div>
            <input
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
            <p id="search-helper" className="search-box__helper-text" style={{ fontSize: '11px', marginTop: '4px', color: '#605e5c' }}>
              Escribe al menos 4 caracteres para buscar ({searchTerm.trim().length}/4)
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="toolbar__actions">
          <button
            className="btn--icon-only"
            aria-label={t('products.action.filter')}
            title={t('products.action.filter')}
          >
            <Filter className="btn__icon" aria-hidden="true" />
          </button>

          <button
            className="btn--icon-only"
            aria-label={t('products.action.export')}
            title={t('products.action.export')}
          >
            <Share className="btn__icon" aria-hidden="true" />
          </button>

          <button
            className="btn btn--primary"
            onClick={handleOpenCreateModal}
          >
            <Plus className="btn__icon" aria-hidden="true" />
            <span>{t('products.action.new_product')}</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-table">
        <div className="products-table__container">
          <table className="products-table__table">
            <thead className="products-table__thead">
              <tr>
                <th className="products-table__th products-table__th--checkbox" scope="col">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Seleccionar todos los productos"
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
                <th className="products-table__th products-table__th--actions" scope="col">
                  <span className="sr-only">{t('products.table.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="products-table__tbody">
              {/* Estado: Cargando */}
              {loading && products.length === 0 && hasSearched ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div className="spinner" style={{ width: '48px', height: '48px' }} />
                      <p style={{ fontSize: '14px', color: '#605e5c', margin: 0 }}>
                        Buscando productos...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : /* Estado: Error */
              error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '48px', color: '#d13438' }}>⚠</div>
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#323130', margin: '0 0 8px 0' }}>
                          {t('products.error.title')}
                        </p>
                        <p style={{ fontSize: '14px', color: '#605e5c', margin: '0 0 16px 0' }}>
                          {error}
                        </p>
                        <button
                          className="btn btn--primary"
                          onClick={() => {
                            clearError();
                            if (searchTerm && searchTerm.length >= 4) {
                              fetchProducts(1, 10, searchTerm);
                            }
                          }}
                        >
                          Reintentar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : /* Estado: Sin búsqueda inicial */
              products.length === 0 && !hasSearched ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <Search size={48} style={{ color: '#a19f9d', opacity: 0.5 }} />
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#323130', margin: '0 0 8px 0' }}>
                          Busca productos para comenzar
                        </p>
                        <p style={{ fontSize: '14px', color: '#605e5c', margin: 0 }}>
                          Escribe al menos 4 caracteres en el buscador para encontrar productos
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : /* Estado: Búsqueda sin resultados */
              products.length === 0 && hasSearched ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '48px', color: '#a19f9d', opacity: 0.5 }}>📦</div>
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#323130', margin: '0 0 8px 0' }}>
                          {t('products.empty.title')}
                        </p>
                        <p style={{ fontSize: '14px', color: '#605e5c', margin: '0 0 16px 0' }}>
                          No se encontraron productos con "{searchTerm}"
                        </p>
                        <button
                          className="btn btn--primary"
                          onClick={handleOpenCreateModal}
                        >
                          <Plus className="btn__icon" aria-hidden="true" />
                          <span>{t('products.action.new_product')}</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : /* Estado: Productos encontrados */
              products.map((product) => {
                // Handle both financial API format and standard format
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
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(productId)}
                        aria-label={`Seleccionar ${productName}`}
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
                    <td className="products-table__td products-table__td--actions">
                      <button
                        className="action-btn"
                        aria-label={`Editar ${productName}`}
                        onClick={() => handleOpenEditModal(product)}
                      >
                        <MoreHorizontal className="action-btn__icon" aria-hidden="true" />
                      </button>
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
              {t('products.pagination.page_of', {
                current: currentPage,
                total: totalPages || 1
              })}
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
