import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Tabla de facturas recientes para el dashboard de CXC.
 * Pulida para coincidir con el diseño de Stitch (en español).
 */
const RecentInvoicesTable = ({ invoices = [] }) => {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1b2633] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] border border-[#edebe9] dark:border-[#2d3d4f] overflow-hidden transition-all hover:shadow-md">
      {/* Header interno de la tabla */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Facturas Recientes</h3>
        <button 
          onClick={() => navigate('/receivables/list')}
          className="text-[10px] font-black text-primary hover:underline uppercase tracking-[0.2em]"
        >
          Ver Todas
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/30 dark:bg-slate-800/10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800">
              <th className="px-6 py-4">ID Factura</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Fecha Emisión</th>
              <th className="px-6 py-4 text-right">Monto</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[13px]">
            {invoices.length > 0 ? (
              invoices.map((inv, idx) => {
                const badgeClasses = {
                  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50',
                  yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50',
                  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800/50',
                  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50',
                  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }
                
                const statusColor = inv.statusColor || 'default';
                const currentBadgeClass = badgeClasses[statusColor] || badgeClasses.default;

                return (
                  <tr key={inv.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-mono font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">
                      #{inv.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black border border-primary/5">
                          {inv.client?.charAt(0).toUpperCase() || '??'}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{inv.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium font-mono">
                      {inv.issueDate || 'Hoy'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatPYG(inv.balance)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${currentBadgeClass}`}>
                        {inv.status === 'OVERDUE' ? 'VENCIDO' : inv.status === 'PARTIAL' ? 'PARCIAL' : inv.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/receivables/detail/${inv.id}`)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-12 text-center text-slate-400 font-medium italic">
                  No hay facturas recientes registradas
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
