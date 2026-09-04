import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

import type { TFn, UsersPagination as Pagination } from '../types';

const PAGE_SIZES = [10, 20, 50, 100];

interface UsersPaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/** Footer of the users data grid: rows-per-page + page navigation. */
export function UsersPagination({ pagination, onPageChange, onPageSizeChange }: UsersPaginationProps) {
  const { t } = useI18n() as unknown as { t: TFn };

  const firstRow = (pagination.page - 1) * pagination.page_size + 1;
  const lastRow = Math.min(pagination.page * pagination.page_size, pagination.total_items);
  const labelClass = 'text-label-caps uppercase text-on-surface-deep';

  return (
    <div className="p-md bg-surface-muted border-t border-divider flex flex-col md:flex-row items-center justify-between gap-md">
      <p className={`text-label-caps uppercase ${labelClass}`}>
        {t('users.showing', 'Mostrando')}{' '}
        <span className="text-data-mono font-data-mono text-foreground">
          {firstRow}-{lastRow}
        </span>{' '}
        {t('users.of', 'de')}{' '}
        <span className="text-data-mono font-data-mono text-foreground">{pagination.total_items}</span>{' '}
        {t('users.records', 'registros')}
      </p>

      <div className="flex items-center gap-md">
        <div className="flex items-center gap-sm">
          <label htmlFor="users-page-size" className={labelClass}>
            {t('users.rowsPerPage', 'Filas por página:')}
          </label>
          <select
            id="users-page-size"
            className="h-8 rounded-input border-border-subtle bg-surface text-body-sm-bold px-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={pagination.page_size}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-xs">
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('users.firstPage', 'Primera página')}
            disabled={!pagination.has_prev}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('users.prevPage', 'Página anterior')}
            disabled={!pagination.has_prev}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className={`px-sm text-label-caps uppercase ${labelClass}`}>
            {t('users.page', 'Página')}{' '}
            <span className="text-data-mono font-data-mono text-foreground">
              {pagination.page} / {pagination.total_pages}
            </span>
          </span>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('users.nextPage', 'Página siguiente')}
            disabled={!pagination.has_next}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('users.lastPage', 'Última página')}
            disabled={!pagination.has_next}
            onClick={() => onPageChange(pagination.total_pages)}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
