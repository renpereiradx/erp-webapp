import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import type { MasterListInvoice } from '../types'

/**
 * Tabla principal para la lista maestra de cuentas por cobrar.
 * Migración FASE 3: .tsx + tokens. Fuera: columna de checkboxes sin estado,
 * botón de configuración sin handler y botón de acción por fila sin
 * handler (§2.6). Sin fallback 'CLI-001' al navegar al perfil.
 */

const SORTABLE_COLUMNS: Array<{ key: string; label: string; fallback: string; align?: string }> = [
  { key: 'id', label: 'receivables.master.table.id', fallback: 'ID Factura' },
  { key: 'client', label: 'receivables.master.table.client', fallback: 'Cliente' },
  { key: 'sale_date', label: 'receivables.master.table.sale_date', fallback: 'Emisión' },
  { key: 'due_date', label: 'receivables.master.table.due_date', fallback: 'Vencimiento' },
  { key: 'original_amt', label: 'receivables.master.table.original_amt', align: 'text-right', fallback: 'Monto Total' },
  { key: 'pending_amt', label: 'receivables.master.table.pending_amt', align: 'text-right', fallback: 'Imp. Pendiente' },
  { key: 'status', label: 'receivables.master.table.status', align: 'text-center', fallback: 'Estado' },
]

const STATUS_BADGE: Record<string, string> = {
  red: 'bg-error/10 text-error border border-error/20',
  yellow: 'bg-warning/10 text-warning border border-warning/20',
  blue: 'bg-primary/10 text-primary border border-primary/20',
  green: 'bg-success/10 text-success border border-success/20',
  gray: 'bg-surface-subtle text-on-surface-deep border border-border-subtle',
}

interface MasterListTableProps {
  invoices?: MasterListInvoice[]
  loading?: boolean
  pagination?: { page?: number; pageSize?: number; totalItems?: number; totalPages?: number }
  sorting?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onSort?: (column: string) => void
  onRefresh?: () => void
}

const MasterListTable = ({
  invoices = [],
  loading,
  pagination = {},
  sorting = {},
  onPageChange,
  onPageSizeChange,
  onSort,
  onRefresh,
}: MasterListTableProps) => {
  const navigate = useNavigate()
  const { t } = useI18n()

  const safeInvoices = Array.isArray(invoices) ? invoices : []
  const { page = 1, pageSize = 20, totalItems = 0, totalPages = 0 } = pagination
  const { sortBy, sortOrder } = sorting

  const startItem = totalItems > 0 ? (page - 1) * pageSize + 1 : 0
  const endItem = Math.min(page * pageSize, totalItems) || safeInvoices.length

  const statusLabel = (status?: string | null) =>
    status === 'OVERDUE'
      ? t('bi.receivables.status.OVERDUE', 'VENCIDO', {})
      : status === 'PENDING'
        ? t('bi.receivables.status.PENDING', 'PENDIENTE', {})
        : status === 'PARTIAL'
          ? t('bi.receivables.status.partialShort', 'P. PARCIAL', {})
          : status === 'PAID'
            ? t('bi.receivables.status.PAID', 'PAGADO', {})
            : (status ?? '')

  return (
    <div className="bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden flex flex-col transition-shadow hover:shadow-fluent-8">
      {/* Toolbar inside Grid */}
      <div className="px-md py-sm border-b border-border-subtle flex justify-between items-center bg-surface-muted">
        <div className="text-label-caps uppercase text-on-surface-deep">
          {t('bi.receivables.master.showing', 'Mostrando', {})}{' '}
          <span className="text-foreground">{startItem}-{endItem}</span>{' '}
          {t('bi.receivables.master.of', 'de', {})}{' '}
          <span className="text-foreground">{totalItems || safeInvoices.length}</span>{' '}
          {t('bi.receivables.master.records', 'registros', {})}
        </div>
        <button
          type="button"
          aria-label={t('bi.profitability.action.refresh', 'Actualizar', {})}
          className="p-xs text-on-surface-deep hover:text-primary transition-colors"
          onClick={onRefresh}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-surface-muted text-label-caps uppercase text-on-surface-deep border-b border-border-subtle">
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-md py-md cursor-pointer hover:bg-surface transition-colors ${col.align === 'text-right' ? 'text-right' : col.align === 'text-center' ? 'text-center' : ''}`}
                  onClick={() => onSort?.(col.key)}
                >
                  <div
                    className={`flex items-center gap-xs ${col.align === 'text-right' ? 'justify-end' : col.align === 'text-center' ? 'justify-center' : ''}`}
                  >
                    {t(col.label, col.fallback, {})}
                    {sortBy === col.key && (
                      <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={SORTABLE_COLUMNS.length} className="text-center py-xl bg-surface">
                  <div className="flex flex-col items-center gap-sm">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-label-caps uppercase text-on-surface-deep">
                      {t('receivables.loading.generic', 'Cargando registros...', {})}
                    </p>
                  </div>
                </td>
              </tr>
            ) : safeInvoices.length === 0 ? (
              <tr>
                <td colSpan={SORTABLE_COLUMNS.length} className="text-center py-xl text-on-surface-deep text-body-md italic">
                  {t('receivables.empty', 'No se encontraron registros en el periodo seleccionado', {})}
                </td>
              </tr>
            ) : (
              safeInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-muted transition-colors duration-150">
                  <td className="px-md py-sm">
                    <button
                      type="button"
                      className="text-primary font-data-mono text-data-mono hover:underline"
                      onClick={() => navigate(`/receivables/detail/${inv.id}`)}
                    >
                      #{inv.id}
                    </button>
                  </td>
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-sm">
                      <div
                        className="size-7 rounded-full flex items-center justify-center text-body-sm-bold border border-primary/5 uppercase bg-primary/10 text-primary"
                      >
                        {inv.clientInitial || inv.clientName?.charAt(0)}
                      </div>
                      <button
                        type="button"
                        className="text-foreground text-body-md-bold hover:text-primary hover:underline transition-colors text-left"
                        onClick={() => {
                          if (inv.clientId) navigate(`/receivables/client-profile/${inv.clientId}`)
                        }}
                      >
                        {inv.clientName}
                      </button>
                    </div>
                  </td>
                  <td className="px-md py-sm text-on-surface-deep font-data-mono text-data-mono whitespace-nowrap">{inv.issueDate}</td>
                  <td className={`px-md py-sm font-data-mono text-data-mono whitespace-nowrap ${inv.statusColor === 'red' ? 'text-error' : 'text-foreground'}`}>
                    {inv.dueDate}
                  </td>
                  <td className="px-md py-sm text-on-surface-deep text-body-sm-bold text-right font-data-mono text-data-mono whitespace-nowrap">
                    {formatPYG(inv.originalAmt ?? 0)}
                  </td>
                  <td
                    className={`px-md py-sm text-right font-data-mono text-data-mono whitespace-nowrap ${
                      (inv.pendingAmt ?? 0) > 0 && inv.statusColor === 'red' ? 'text-error' : 'text-foreground'
                    }`}
                  >
                    {formatPYG(inv.pendingAmt ?? 0)}
                  </td>
                  <td className="px-md py-sm text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-sm py-0.5 rounded-xs text-body-sm-bold uppercase border ${STATUS_BADGE[inv.statusColor || 'gray'] ?? STATUS_BADGE.gray}`}
                    >
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="border-t border-border-subtle bg-surface-muted p-sm flex flex-col sm:flex-row gap-md items-center justify-between">
        <div className="flex items-center gap-xs text-label-caps uppercase text-on-surface-deep">
          <span>{t('receivables.master.pagination.rows_per_page', 'Filas por página', {})}</span>
          <select
            aria-label={t('receivables.master.pagination.rows_per_page', 'Filas por página', {})}
            className="bg-surface border border-border-subtle rounded-sm px-sm py-0.5 text-body-sm-bold outline-none transition-colors cursor-pointer hover:border-primary/30"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          >
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>

        <div className="flex items-center gap-md">
          <span className="text-label-caps uppercase text-on-surface-deep">
            {t('receivables.master.pagination.page_info', `Página ${page} de ${totalPages || 1}`, { page, total: totalPages || 1 })}
          </span>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              aria-label={t('bi.profitability.products.pagination.prev', 'Página anterior', {})}
              className="size-9 flex items-center justify-center rounded-button border border-border-subtle text-on-surface-deep disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:bg-surface"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label={t('bi.profitability.products.pagination.next', 'Página siguiente', {})}
              className="size-9 flex items-center justify-center rounded-button border border-border-subtle text-on-surface-deep disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:bg-surface"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterListTable
