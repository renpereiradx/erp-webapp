/**
 * Página de Ajuste de Precios Nuevo - Patrón MVP
 * Búsqueda y selección de productos para ajuste de precios
 * Siguiendo Fluent Design System 2
 */

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataState from '@/components/ui/DataState';
import { useI18n } from '@/lib/i18n';
import usePriceAdjustmentNewStore from '@/store/usePriceAdjustmentNewStore';
import { useNavigate } from 'react-router-dom';
import '@/styles/scss/pages/_price-adjustment-new.scss';

const PriceAdjustmentNew = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const {
    products,
    loading,
    error,
    searchTerm,
    pagination,
    searchProducts,
    setSearchTerm,
    clearError,
    changePage,
    selectProductForAdjustment,
    resetState
  } = usePriceAdjustmentNewStore();

  // Estado local para el input de búsqueda
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Cargar productos inicialmente (sin búsqueda)
  useEffect(() => {
    searchProducts('', 1, 10);
  }, [searchProducts]);

  // Limpiar estado al desmontar el componente
  useEffect(() => {
    return () => {
      // Limpiar el estado del product store cuando salimos de esta página
      resetState();
    };
  }, [resetState]);

  // Debounce para búsqueda automática
  useEffect(() => {
    // Solo buscar si hay al menos 4 caracteres
    if (localSearchTerm.trim().length >= 4) {
      const timeoutId = setTimeout(() => {
        setSearchTerm(localSearchTerm);
        searchProducts(localSearchTerm, 1, pagination.page_size);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else if (localSearchTerm.trim().length === 0) {
      // Si el input está vacío, cargar todos los productos
      const timeoutId = setTimeout(() => {
        setSearchTerm('');
        searchProducts('', 1, pagination.page_size);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [localSearchTerm, searchProducts, pagination.page_size]);

  // Manejar búsqueda manual (al presionar Enter)
  const handleSearch = (e) => {
    e.preventDefault();
    if (localSearchTerm.trim().length >= 4 || localSearchTerm.trim().length === 0) {
      setSearchTerm(localSearchTerm);
      searchProducts(localSearchTerm, 1, pagination.page_size);
    }
  };

  // Manejar cambio de input
  const handleInputChange = (e) => {
    setLocalSearchTerm(e.target.value);
  };

  // Manejar selección de producto
  const handleSelectProduct = async (product) => {
    await selectProductForAdjustment(product.product_id);
    // Navegar a página de detalle para ajustar el precio
    navigate('/ajustes-precios-nuevo/detalle', { state: { selectedProduct: product } });
  };

  // Manejar paginación
  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      changePage(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.total_pages) {
      changePage(pagination.page + 1);
    }
  };

  return (
    <div className="price-adjustment-new">
      {/* Header */}
      <div className="price-adjustment-new__header">
        <h1 className="price-adjustment-new__title">
          {t('priceAdjustmentNew.title', 'Búsqueda y Selección de Productos')}
        </h1>
      </div>

      {/* Barra de búsqueda */}
      <div className="price-adjustment-new__search">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-form__input-wrapper">
            <Search className="search-form__icon" />
            <Input
              type="search"
              placeholder={t('priceAdjustmentNew.search.placeholder', 'Buscar por nombre o ID de producto...')}
              value={localSearchTerm}
              onChange={handleInputChange}
              className="search-form__input"
            />
          </div>
        </form>
        {/* Mensaje de ayuda para búsqueda */}
        {localSearchTerm.length > 0 && localSearchTerm.length < 4 && (
          <div className="search-form__hint">
            <p className="search-form__hint-text">
              💡 {t('priceAdjustmentNew.search.hint', 'Escribe al menos 4 caracteres para buscar')} ({localSearchTerm.length}/4)
            </p>
          </div>
        )}
      </div>

      {/* Mensaje de error si existe */}
      {error && (
        <div className="error-message">
          <p className="error-message__text">{error}</p>
          <button
            onClick={() => {
              clearError();
              searchProducts(searchTerm, pagination.page, pagination.page_size);
            }}
            className="error-message__retry"
          >
            {t('priceAdjustmentNew.action.retry', 'Reintentar')}
          </button>
        </div>
      )}

      {/* Tabla de productos */}
      <div className="price-adjustment-new__table-container">
        {loading && products.length === 0 ? (
          <div className="loading-state">
            <div className="loading-state__spinner" />
            <p className="loading-state__text">{t('priceAdjustmentNew.loading', 'Cargando productos...')}</p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead className="product-table__head">
                <tr>
                  <th className="product-table__th">
                    {t('priceAdjustmentNew.table.name', 'Nombre del Producto')}
                  </th>
                  <th className="product-table__th">
                    {t('priceAdjustmentNew.table.id', 'ID del Producto')}
                  </th>
                  <th className="product-table__th">
                    {t('priceAdjustmentNew.table.price', 'Precio Actual')}
                  </th>
                  <th className="product-table__th">
                    {t('priceAdjustmentNew.table.actions', 'Acción')}
                  </th>
                </tr>
              </thead>
              <tbody className="product-table__body">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="product-table__empty">
                      <div className="empty-state">
                        <Search className="empty-state__icon" />
                        <p className="empty-state__title">
                          {t('priceAdjustmentNew.empty.title', 'No se encontraron productos')}
                        </p>
                        <p className="empty-state__message">
                          {t('priceAdjustmentNew.empty.message', 'Intente con otra búsqueda')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.product_id || product.id} className="product-table__row">
                      <td className="product-table__td product-table__td--name">
                        {product.product_name || product.name || t('field.no_name', 'Sin nombre')}
                      </td>
                      <td className="product-table__td product-table__td--id">
                        {product.product_id || product.id}
                      </td>
                      <td className="product-table__td product-table__td--price">
                        PYG {(product.unit_prices?.[0]?.price_per_unit || product.current_price || product.price || 0).toLocaleString('es-PY')}
                      </td>
                      <td className="product-table__td product-table__td--actions">
                        <Button
                          onClick={() => handleSelectProduct(product)}
                          className="btn btn--primary btn--sm"
                        >
                          {t('priceAdjustmentNew.action.select', 'Seleccionar')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {products.length > 0 && (
        <nav className="pagination" aria-label="Pagination">
          <div className="pagination__info">
            <p className="pagination__text">
              {t('priceAdjustmentNew.pagination.showing', 'Mostrando')} <span className="pagination__emphasis">{((pagination.page - 1) * pagination.page_size) + 1}</span> {t('priceAdjustmentNew.pagination.to', 'a')} <span className="pagination__emphasis">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> {t('priceAdjustmentNew.pagination.of', 'de')} <span className="pagination__emphasis">{pagination.total}</span> {t('priceAdjustmentNew.pagination.results', 'resultados')}
            </p>
          </div>
          <div className="pagination__controls">
            <button
              onClick={handlePreviousPage}
              disabled={pagination.page <= 1}
              className="pagination__btn"
              aria-label={t('priceAdjustmentNew.pagination.previous', 'Anterior')}
            >
              {t('priceAdjustmentNew.pagination.previous', 'Anterior')}
            </button>
            <button
              onClick={handleNextPage}
              disabled={pagination.page >= pagination.total_pages}
              className="pagination__btn"
              aria-label={t('priceAdjustmentNew.pagination.next', 'Siguiente')}
            >
              {t('priceAdjustmentNew.pagination.next', 'Siguiente')}
            </button>
          </div>
        </nav>
      )}

      {/* Indicador de carga durante búsqueda */}
      {loading && products.length > 0 && (
        <div className="loading-overlay">
          <div className="loading-overlay__spinner" />
        </div>
      )}
    </div>
  );
};

export default PriceAdjustmentNew;
