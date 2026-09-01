import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface ProductsPaginationProps {
  startIndex: number;
  endIndex: number;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export const ProductsPagination: React.FC<ProductsPaginationProps> = ({
  startIndex,
  endIndex,
  totalProducts,
  currentPage,
  totalPages,
  loading,
  onPreviousPage,
  onNextPage,
}) => {
  const { t } = useI18n();

  return (
    <div className="px-lg py-md flex items-center justify-between bg-surface-muted border-t border-border-subtle">
      <p className="text-body-sm-bold text-on-surface-deep">
        <span className="text-data-mono font-data-mono">
          {startIndex}–{endIndex}
        </span>{' '}
        {t('products.pagination.of_total', {
          total: totalProducts,
        })}
      </p>
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-xs">
          <Button
            variant="secondary"
            size="icon"
            onClick={onPreviousPage}
            disabled={currentPage === 1 || loading}
            aria-label={t('products.pagination.prev', 'Anterior')}
            className="rounded-button"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onNextPage}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            aria-label={t('products.pagination.next', 'Siguiente')}
            className="rounded-button"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <span className="text-body-sm-bold text-foreground">
          {t('products.pagination.page', {
            current: currentPage,
            total: totalPages || 1,
          })}
        </span>
      </div>
    </div>
  );
};
