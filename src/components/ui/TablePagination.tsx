import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Pager server-side para tablas de datos (regla ≤10 filas por página,
 * PLAN_ALINEACION_BI cierre). Renderiza el conteo real del server y los
 * botones anterior/siguiente; `onPageChange` dispara el refetch con la
 * página destino — el componente no pagina client-side ni fabrica totales.
 *
 * @param {number} page - Página actual (1-based).
 * @param {number} totalPages - Total de páginas reportado por el server.
 * @param {number} totalItems - Total de ítems reportado por el server.
 * @param {(page: number) => void} onPageChange - Callback con la página destino.
 */
interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const TablePagination = ({ page, totalPages, totalItems, onPageChange }: TablePaginationProps) => {
  const { t } = useI18n();
  const safeTotalPages = Math.max(1, totalPages ?? 1);
  const safePage = Math.min(Math.max(1, page ?? 1), safeTotalPages);

  return (
    <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between font-mono">
      <p className="text-xs text-on-surface-deep font-bold uppercase tracking-tighter">
        {t('bi.common.pageOf', 'Página {page} de {total} ({items} items)', {
          page: safePage,
          total: safeTotalPages,
          items: totalItems ?? 0,
        })}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          aria-label={t('bi.common.pagePrev', 'Página anterior')}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle text-on-surface-deep disabled:opacity-50 hover:bg-surface-muted"
        >
          <ChevronLeft size={16} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-black">
          {safePage}
        </button>
        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === safeTotalPages}
          aria-label={t('bi.common.pageNext', 'Página siguiente')}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle text-on-surface-deep hover:bg-surface-muted disabled:opacity-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
