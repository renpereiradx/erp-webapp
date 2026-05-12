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
    <div className="px-10 py-6 flex items-center justify-between bg-slate-50/50 border-t border-border-subtle">
      <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
        {t('products.pagination.showing', {
          start: startIndex,
          end: endIndex,
          total: totalProducts,
        })}
      </p>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousPage}
            disabled={currentPage === 1 || loading}
            className="size-8 rounded border-border-subtle hover:bg-white disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextPage}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="size-8 rounded border-border-subtle hover:bg-white disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main">
          Página {currentPage} de {totalPages || 1}
        </span>
      </div>
    </div>
  );
};
