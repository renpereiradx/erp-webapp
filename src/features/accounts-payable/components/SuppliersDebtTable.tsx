import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatPYG } from '@/utils/currencyUtils';
import type { PayablesVendorRow } from '@/domain/payables/dashboard';

/**
 * Tabla de proveedores con mayor deuda del dashboard de CxP.
 * Migración FASE 4: .tsx + tokens; el filtro local sin estado y los botones
 * de acción por fila sin handler se eliminaron (§2.6).
 */

interface SuppliersDebtTableProps {
  vendors?: PayablesVendorRow[]
  pagination?: { page?: number; pageSize?: number; totalItems?: number; totalPages?: number }
  onPageChange?: (page: number) => void
}

const SuppliersDebtTable = ({ vendors = [], pagination = {}, onPageChange }: SuppliersDebtTableProps) => {
  const { t } = useI18n();
  const { page = 1, totalPages = 1, totalItems = 0 } = pagination;

  return (
    <div className="bg-surface border border-border-subtle shadow-whisper rounded-md overflow-hidden transition-shadow hover:shadow-fluent-8">
      <div className="p-md border-b border-border-subtle flex items-center gap-sm bg-surface">
        <div className="p-sm bg-primary/10 text-primary rounded-md">
          <Search className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-title-md tracking-tight text-foreground">
            {t('bi.payables.suppliers.title', 'Proveedores con Mayor Deuda', {})}
          </h3>
          <p className="text-label-caps uppercase text-on-surface-deep mt-0.5">
            {t('bi.payables.suppliers.subtitle', 'Listado de los principales proveedores', {})}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-muted text-on-surface-deep border-b border-border-subtle">
            <tr>
              <th className="px-md py-sm text-label-caps uppercase">
                {t('bi.payables.suppliers.col.name', 'Nombre del Proveedor', {})}
              </th>
              <th className="px-md py-sm text-label-caps uppercase text-right">
                {t('bi.payables.suppliers.col.totalBalance', 'Saldo Total', {})}
              </th>
              <th className="px-md py-sm text-label-caps uppercase text-right">
                {t('bi.payables.suppliers.col.overdue', 'Monto Vencido', {})}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-surface-muted transition-colors duration-150">
                <td className="px-md py-sm">
                  <div className="flex items-center gap-sm">
                    <div className="size-8 rounded-sm bg-surface-muted flex items-center justify-center text-body-sm-bold text-on-surface-deep">
                      {vendor.name?.charAt(0)}
                    </div>
                    <span className="text-body-md-bold text-foreground">{vendor.name}</span>
                  </div>
                </td>
                <td className="px-md py-sm text-right">
                  <span className="text-body-md font-data-mono text-data-mono text-foreground">
                    {formatPYG(vendor.totalBalance ?? 0)}
                  </span>
                </td>
                <td className="px-md py-sm text-right">
                  <span
                    className={`text-body-md font-data-mono text-data-mono ${(vendor.overdueAmount ?? 0) > 0 ? 'text-error' : 'text-foreground'}`}
                  >
                    {formatPYG(vendor.overdueAmount ?? 0)}
                  </span>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td colSpan={3} className="px-md py-lg text-center text-on-surface-deep text-body-md italic">
                  {t('bi.payables.suppliers.empty', 'Sin proveedores con deuda', {})}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-md border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center bg-surface-muted gap-sm">
        <span className="text-label-caps uppercase text-on-surface-deep">
          {t('bi.payables.suppliers.showing', 'Mostrando {n} de {t} proveedores', {
            n: vendors.length,
            t: totalItems || vendors.length,
          })}
        </span>
        <div className="flex items-center gap-xs">
          <button
            type="button"
            aria-label={t('bi.profitability.products.pagination.prev', 'Página anterior', {})}
            className="p-sm rounded-md border border-border-subtle text-on-surface-deep disabled:opacity-30 transition-colors hover:bg-surface"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              className={`size-9 rounded-md text-body-sm-bold transition-colors ${
                p === page ? 'bg-primary text-on-primary shadow-whisper' : 'text-on-surface-deep hover:bg-surface'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            aria-label={t('bi.profitability.products.pagination.next', 'Página siguiente', {})}
            className="p-sm rounded-md border border-border-subtle text-on-surface-deep disabled:opacity-30 transition-colors hover:bg-surface"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuppliersDebtTable
