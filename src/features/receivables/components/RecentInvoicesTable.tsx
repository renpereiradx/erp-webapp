import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import type { RecentInvoice } from '../types'

/**
 * Tabla de facturas recientes para el dashboard de CxC.
 * Migración FASE 3: .tsx + tokens DESIGN + i18n.
 */
interface RecentInvoicesTableProps {
  invoices?: RecentInvoice[]
}

const STATUS_BADGE: Record<string, string> = {
  green: 'bg-success/10 text-success border border-success/20',
  yellow: 'bg-warning/10 text-warning border border-warning/20',
  red: 'bg-error/10 text-error border border-error/20',
  blue: 'bg-primary/10 text-primary border border-primary/20',
  default: 'bg-surface-subtle text-on-surface-deep border border-border-subtle',
}

const RecentInvoicesTable = ({ invoices = [] }: RecentInvoicesTableProps) => {
  const { t } = useI18n()
  const navigate = useNavigate()

  const statusLabel = (status?: string | null) =>
    status === 'OVERDUE'
      ? t('bi.receivables.status.OVERDUE', 'VENCIDO', {})
      : status === 'PARTIAL'
        ? t('bi.receivables.status.PARTIAL', 'PARCIAL', {})
        : status === 'PAID'
          ? t('bi.receivables.status.PAID', 'PAGADO', {})
          : t('bi.receivables.status.PENDING', 'PENDIENTE', {})

  return (
    <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden transition-shadow hover:shadow-fluent-8">
      {/* Header interno de la tabla */}
      <div className="flex items-center justify-between px-md py-md border-b border-border-subtle bg-surface-muted">
        <h3 className="text-title-md text-foreground tracking-tight">
          {t('bi.receivables.recent.title', 'Facturas Recientes', {})}
        </h3>
        <button
          type="button"
          onClick={() => navigate('/receivables/list')}
          className="text-label-caps text-primary hover:underline uppercase"
        >
          {t('bi.receivables.recent.viewAll', 'Ver Todas', {})}
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-muted text-label-caps uppercase text-on-surface-deep border-b border-border-subtle">
              <th className="px-md py-md">{t('bi.receivables.recent.col.id', 'ID Factura', {})}</th>
              <th className="px-md py-md">{t('bi.receivables.recent.col.client', 'Cliente', {})}</th>
              <th className="px-md py-md">{t('bi.receivables.recent.col.issueDate', 'Fecha Emisión', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.recent.col.amount', 'Monto', {})}</th>
              <th className="px-md py-md text-center">{t('bi.receivables.recent.col.status', 'Estado', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.recent.col.action', 'Acción', {})}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {invoices.length > 0 ? (
              invoices.map((inv, idx) => {
                const badgeClass = STATUS_BADGE[inv.statusColor || 'default'] ?? STATUS_BADGE.default

                return (
                  <tr
                    key={inv.id || idx}
                    className="hover:bg-surface-muted transition-colors duration-150 group cursor-pointer"
                    onClick={() => navigate(`/receivables/detail/${inv.id}`)}
                  >
                    <td className="px-md py-md font-data-mono text-data-mono text-on-surface-deep group-hover:text-primary transition-colors">
                      #{inv.id}
                    </td>
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-body-sm-bold border border-primary/5">
                          {inv.client?.charAt(0).toUpperCase() || '??'}
                        </div>
                        <span className="text-body-md-bold text-foreground group-hover:text-primary transition-colors">
                          {inv.client}
                        </span>
                      </div>
                    </td>
                    <td className="px-md py-md text-on-surface-deep font-data-mono text-data-mono">
                      {inv.issueDate || t('bi.receivables.recent.today', 'Hoy', {})}
                    </td>
                    <td className="px-md py-md text-right font-data-mono text-data-mono text-foreground">
                      {formatPYG(inv.balance ?? 0)}
                    </td>
                    <td className="px-md py-md text-center">
                      <span
                        className={`inline-flex items-center rounded-xs px-sm py-0.5 text-body-sm-bold uppercase ${badgeClass}`}
                      >
                        {statusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-md py-md text-right">
                      <button
                        type="button"
                        aria-label={t('bi.receivables.recent.viewDetail', 'Ver detalle', {})}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/receivables/detail/${inv.id}`)
                        }}
                        className="p-xs opacity-0 group-hover:opacity-100 text-on-surface-deep hover:text-primary hover:bg-primary/5 rounded-sm transition-colors duration-150"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">visibility</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-xl text-center text-on-surface-deep text-body-md italic">
                  {t('bi.receivables.recent.empty', 'No hay facturas recientes registradas', {})}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentInvoicesTable
