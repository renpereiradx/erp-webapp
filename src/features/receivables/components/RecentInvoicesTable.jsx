import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Tabla de facturas recientes para el dashboard de CXC.
 * Pulida al 100% para coincidir con el diseño de Stitch (en español).
 */
const RecentInvoicesTable = ({ invoices = [] }) => {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="rounded-xl bg-white dark:bg-surface-dark shadow-card border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header interno de la tabla (según Stitch) */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Facturas Recientes</h3>
        <button 
          onClick={() => navigate('/receivables/list')}
          className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          Ver Todas
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-text-primary-light dark:text-text-primary-dark">
            <tr>
              <th className="px-6 py-3 font-semibold">ID Factura</th>
              <th className="px-6 py-3 font-semibold">Cliente</th>
              <th className="px-6 py-3 font-semibold">Fecha</th>
              <th className="px-6 py-3 font-semibold">Monto</th>
              <th className="px-6 py-3 font-semibold">Estado</th>
              <th className="px-6 py-3 text-right font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {invoices.length > 0 ? (
              invoices.map((inv, idx) => {
                // Lógica de color de badge basada en el diseño de Stitch
                const badgeClasses = {
                  green: 'bg-green-50 text-green-700 ring-green-600/20',
                  yellow: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
                  red: 'bg-red-50 text-red-700 ring-red-600/10',
                  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
                  default: 'bg-gray-50 text-gray-700 ring-gray-600/20'
                }
                
                const statusColor = inv.statusColor || 'default';
                const currentBadgeClass = badgeClasses[statusColor] || badgeClasses.default;

                return (
                  <tr key={inv.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-3 font-medium text-text-primary-light dark:text-text-primary-dark">
                      #{inv.id}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                          {inv.client?.charAt(0).toUpperCase() || '??'}
                        </div>
                        <span className="text-text-primary-light dark:text-text-primary-dark">{inv.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {inv.issueDate || 'Hoy'}
                    </td>
                    <td className="px-6 py-3 font-mono text-text-primary-light dark:text-text-primary-dark">
                      {formatPYG(inv.balance)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${currentBadgeClass}`}>
                        {inv.status === 'OVERDUE' ? 'VENCIDO' : inv.status === 'PARTIAL' ? 'PARCIAL' : inv.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => navigate(`/receivables/detail/${inv.id}`)}
                        className="text-primary hover:text-primary-hover font-medium transition-colors"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-12 text-center text-text-secondary-light">
                  No hay facturas recientes
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
