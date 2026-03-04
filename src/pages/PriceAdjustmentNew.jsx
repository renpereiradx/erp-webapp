/**
 * Página de Ajuste de Precios Nuevo - Patrón MVP
 * Búsqueda y selección de productos para ajuste de precios
 * Siguiendo Fluent Design System 2
 */

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import usePriceAdjustmentNewStore from '@/store/usePriceAdjustmentNewStore';
import { useNavigate } from 'react-router-dom';

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
  }, [localSearchTerm, searchProducts, pagination.page_size, setSearchTerm]);

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
    navigate('/ajustes-precios/detalle', { state: { selectedProduct: product } });
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Barra de búsqueda */}
      <div className="bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle">
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="search"
            placeholder={t('priceAdjustmentNew.search.placeholder', 'Buscar por nombre o ID de producto...')}
            value={localSearchTerm}
            onChange={handleInputChange}
            className="w-full pl-12 pr-4 h-12 border border-border-subtle rounded-xl text-sm bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={20} />}
        </form>
        {/* Mensaje de ayuda para búsqueda */}
        {localSearchTerm.length > 0 && localSearchTerm.length < 4 && (
          <div className="mt-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
            <span className='text-sm'>💡</span> {t('priceAdjustmentNew.search.hint', 'Escribe al menos 4 caracteres para buscar')} ({localSearchTerm.length}/4)
          </div>
        )}
      </div>

      {/* Mensaje de error si existe */}
      {error && (
        <div className="p-4 bg-error/10 border-l-4 border-error rounded-r-lg flex items-center justify-between">
          <p className="text-sm text-error font-bold">{error}</p>
          <button
            onClick={() => {
              clearError();
              searchProducts(searchTerm, pagination.page, pagination.page_size);
            }}
            className="px-4 py-1.5 bg-error text-white text-[10px] font-black uppercase rounded hover:bg-red-700 transition-all"
          >
            {t('priceAdjustmentNew.action.retry', 'Reintentar')}
          </button>
        </div>
      )}

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl shadow-fluent-shadow border border-border-subtle overflow-hidden">
        <div className='overflow-x-auto'>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-border-subtle text-[13px] font-semibold text-gray-700">
              <tr>
                <th className="py-4 px-6">
                  {t('priceAdjustmentNew.table.name', 'Nombre del Producto')}
                </th>
                <th className="py-4 px-4">
                  {t('priceAdjustmentNew.table.id', 'ID del Producto')}
                </th>
                <th className="py-4 px-4">
                  {t('priceAdjustmentNew.table.price', 'Precio Actual')}
                </th>
                <th className="py-4 px-6 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-text-main">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center italic text-slate-400">
                    <div className='flex flex-col items-center gap-3'>
                      <Loader2 size={32} className='animate-spin text-primary' />
                      {t('priceAdjustmentNew.loading', 'Cargando productos...')}
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 opacity-50 italic">
                    <div className='flex flex-col items-center gap-2'>
                      <Search size={48} />
                      {t('priceAdjustmentNew.empty.title', 'No se encontraron productos')}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.product_id || product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6 font-bold text-text-main">
                      {product.product_name || product.name || t('field.no_name', 'Sin nombre')}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-primary font-bold">
                      {product.product_id || product.id}
                    </td>
                    <td className="py-4 px-4 font-black">
                      PYG {(product.unit_prices?.[0]?.price_per_unit || product.current_price || product.price || 0).toLocaleString('es-PY')}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleSelectProduct(product)}
                        className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all"
                      >
                        {t('priceAdjustmentNew.action.select', 'Seleccionar')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {products.length > 0 && (
          <div className='px-6 py-4 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4 bg-[#fafafa]'>
            <div className='text-[13px] text-gray-500 font-medium'>
              {t('priceAdjustmentNew.pagination.showing', 'Mostrando')} <span className="font-bold text-text-main">{((pagination.page - 1) * pagination.page_size) + 1}</span> a <span className="font-bold text-text-main">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> de <span className="font-bold text-text-main">{pagination.total}</span> resultados
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={handlePreviousPage}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-border-subtle rounded-lg text-xs font-bold uppercase text-text-secondary hover:bg-white hover:text-text-main disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={16} />
                {t('priceAdjustmentNew.pagination.previous', 'Anterior')}
              </button>
              <div className='text-sm font-bold text-primary'>
                {pagination.page} / {pagination.total_pages}
              </div>
              <button
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.total_pages}
                className="flex items-center gap-1 px-3 py-1.5 border border-border-subtle rounded-lg text-xs font-bold uppercase text-text-secondary hover:bg-white hover:text-text-main disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                {t('priceAdjustmentNew.pagination.next', 'Siguiente')}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAdjustmentNew;
