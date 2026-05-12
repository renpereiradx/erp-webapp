import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import DataState from '@/components/ui/DataState';
import { TableRow, TableCell } from '@/components/ui/table';

interface ProductsEmptyStateProps {
  loading: boolean;
  error: string | null;
  productsLength: number;
  viewMode: 'paginated' | 'search';
  searchTerm: string;
  onRetry: () => void;
  onOpenCreateModal: () => void;
}

export const ProductsEmptyState: React.FC<ProductsEmptyStateProps> = ({
  loading,
  error,
  productsLength,
  viewMode,
  searchTerm,
  onRetry,
  onOpenCreateModal,
}) => {
  const { t } = useI18n();

  if (loading && productsLength === 0) {
    return (
      <TableRow>
        <TableCell colSpan={9} className="py-32">
          <div className="flex flex-col items-center justify-center gap-4" data-testid="products-loading">
            <RefreshCw className="w-12 h-12 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Cargando Inventario...
            </p>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={9} className="py-20">
          <DataState
            variant="error"
            testId="error-main"
            title={t('products.error.title')}
            message={error}
            onRetry={onRetry}
          />
        </TableCell>
      </TableRow>
    );
  }

  if (productsLength === 0) {
    return (
      <TableRow>
        <TableCell colSpan={9} className="py-20">
          <DataState
            variant="empty"
            testId={viewMode === 'search' ? 'products-empty-search' : 'products-empty-initial'}
            title={
              viewMode === 'search'
                ? t('products.empty.no_results')
                : t('products.empty.title')
            }
            description={
              viewMode === 'search'
                ? `No se encontraron productos con "${searchTerm}"`
                : t('products.empty.description')
            }
            actionLabel={t('products.action.new_product')}
            onAction={onOpenCreateModal}
          />
        </TableCell>
      </TableRow>
    );
  }

  return null;
};
