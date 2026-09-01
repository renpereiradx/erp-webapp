import React from 'react';
import { useI18n } from '@/lib/i18n';
import DataState from '@/components/ui/DataState';
import { Skeleton } from '@/components/ui/skeleton';
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

/** Skeleton con la forma de una fila de la tabla (§6.7: imitar la forma final). */
const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-md py-md px-md">
    <Skeleton className="size-10 rounded-sm bg-surface-subtle shrink-0" />
    <div className="flex-1 space-y-sm">
      <Skeleton className="h-4 w-1/3 bg-surface-subtle" />
      <Skeleton className="h-3 w-1/5 bg-surface-subtle" />
    </div>
    <Skeleton className="h-4 w-20 bg-surface-subtle" />
    <Skeleton className="h-4 w-24 bg-surface-subtle" />
  </div>
);

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
        <TableCell colSpan={8}>
          <div
            className="flex flex-col gap-xs p-md"
            data-testid="products-loading"
            role="status"
            aria-live="polite"
            aria-label={t('products.loading.inventory', 'Cargando inventario...')}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="py-20">
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
        <TableCell colSpan={8} className="py-20">
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
                ? t('products.empty.no_results_for', { term: searchTerm })
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
