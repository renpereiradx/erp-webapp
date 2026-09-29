/**
 * Página de Ajuste de Precios Nuevo - Patrón MVP
 * Búsqueda y selección de unidades vendibles (filas planas) para ajuste
 * de precios. Alineada a DESIGN.md: tokens semánticos, componentes ui/,
 * estados loading/empty/error (§6.7), F2 al buscador (§12.4).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import usePriceAdjustmentNewStore from '@/store/usePriceAdjustmentNewStore';
import { useNavigate } from 'react-router-dom';
import { getProductBaseUnitPrice } from '@/utils/productUtils';
import { formatPYG } from '@/utils/currencyUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import TablePagination from '@/components/ui/TablePagination';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { useSearchFocusShortcut } from '@/hooks/useSearchFocusShortcut';

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
  const searchInputRef = useRef(null);

  // F2 → foco al buscador de la página (§12.4; sin modales: enabled fijo)
  useSearchFocusShortcut({ enabled: true, inputRef: searchInputRef });

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
    // Fila plana: el id del padre viaja en `id` (no hay product_id).
    await selectProductForAdjustment(product.product_id || product.id);
    // Navegar a página de detalle para ajustar el precio
    navigate('/ajustes-precios/detalle', { state: { selectedProduct: product } });
  };

  // Reintentar tras un error de carga (§6.7: onRetry)
  const handleRetry = () => {
    clearError();
    searchProducts(searchTerm, pagination.page, pagination.page_size);
  };

  return (
    <div className="flex flex-col gap-lg animate-in fade-in">
      {/* Barra de búsqueda */}
      <section className="bg-surface rounded-md shadow-whisper border-0 p-lg">
        <form autoComplete="off" onSubmit={handleSearch} className="relative max-w-2xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-deep w-5 h-5"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder={t('priceAdjustmentNew.search.placeholder', 'Buscar por nombre o ID de producto... (F2)')}
            value={localSearchTerm}
            onChange={handleInputChange}
            size="lg"
            className="pl-12"
          />
          {loading && (
            <Loader2
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary w-5 h-5"
              aria-hidden="true"
            />
          )}
        </form>
        {/* Mensaje de ayuda para búsqueda */}
        {localSearchTerm.length > 0 && localSearchTerm.length < 4 && (
          <p className="mt-sm text-body-sm-bold text-warning flex items-center gap-xs">
            {t('priceAdjustmentNew.search.hint', 'Escribe al menos 4 caracteres para buscar')} ({localSearchTerm.length}/4)
          </p>
        )}
      </section>

      {/* Mensaje de error si existe (§6.7: ErrorState con onRetry) */}
      {error && (
        <ErrorState
          title={t('priceAdjustmentNew.error.title', 'Error al cargar productos')}
          message={error}
          onRetry={handleRetry}
        />
      )}

      {/* Tabla de productos */}
      <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-lg">
            <GenericSkeletonList count={5} />
          </div>
        ) : !loading && products.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('priceAdjustmentNew.empty.title', 'Sin resultados')}
            description={t('priceAdjustmentNew.empty.message', 'No se encontraron productos')}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">
                    {t('priceAdjustmentNew.table.name', 'Nombre del Producto')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">
                    {t('priceAdjustmentNew.table.id', 'ID del Producto')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                    {t('priceAdjustmentNew.table.price', 'Precio Actual')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                    <span className="sr-only">{t('priceAdjustmentNew.table.actions', 'Acción')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={`${product.product_id || product.id}-${product.variant_id || 'base'}`}
                    className="hover:bg-surface-muted transition-colors duration-150"
                  >
                    <TableCell className="text-body-md text-foreground">
                      {/* Fila plana: la variante es la unidad ajustable; se
                          indica su producto padre (owner request 2026-09-14). */}
                      {product.variant_name || product.product_name || product.name || t('field.no_name', 'Sin nombre')}
                      {product.variant_id && (
                        <Badge variant="secondary" className="ml-sm align-middle">
                          {t('priceAdjustmentNew.table.parent_of', 'Producto padre: {name}', { name: product.product_name || product.name })}
                        </Badge>
                      )}
                      {product.sku && (
                        <span className="block text-data-mono font-data-mono text-on-surface-deep mt-xs">
                          {product.sku}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-data-mono font-data-mono text-on-surface-deep">
                      {product.sku || product.product_id || product.id}
                    </TableCell>
                    <TableCell className="text-data-mono font-data-mono text-right text-foreground">
                      {formatPYG(getProductBaseUnitPrice(product) ?? product.current_price ?? product.price ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="secondary" size="sm" onClick={() => handleSelectProduct(product)}>
                        {t('priceAdjustmentNew.action.select', 'Seleccionar')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación server-side real */}
            <TablePagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total}
              onPageChange={changePage}
            />
          </>
        )}
      </section>
    </div>
  );
};

export default PriceAdjustmentNew;
