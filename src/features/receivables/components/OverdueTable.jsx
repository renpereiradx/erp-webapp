import React from 'react'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Tabla optimizada para esfuerzos de cobranza.
 */
const OverdueTable = ({ accounts = [] }) => {
  const { t } = useI18n()

  // Defensive check: ensure accounts is always an array
  const safeAccounts = Array.isArray(accounts) ? accounts : []

  return (
    <div className='flex flex-col gap-6 w-full'>
      {/* Search & Filters Toolbar */}
      <div className="bg-white dark:bg-[#1A2633] p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-slate-800 border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm transition-all text-slate-900 dark:text-white placeholder:text-slate-500"
              placeholder={t('receivables.overdue.search', 'Buscar por nombre, ID de factura...')}
              type="text"
            />
          </div>
          <div className="flex gap-2 flex-wrap w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 bg-background-light dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span>{t('receivables.overdue.filter.priority', 'Prioridad: Todas')}</span>
              <span className="material-symbols-outlined !text-lg">expand_more</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-background-light dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span>{t('receivables.overdue.filter.status', 'Estado: Sin resolver')}</span>
              <span className="material-symbols-outlined !text-lg">expand_more</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-background-light dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span>{t('receivables.overdue.filter.collector', 'Cobrador: Yo')}</span>
              <span className="material-symbols-outlined !text-lg">expand_more</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#1A2633] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#15202B] border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-12 text-center">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary/25 size-4" type="checkbox" />
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('receivables.overdue.table.client_invoice', 'Cliente / Factura')}
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  {t('receivables.overdue.table.amount', 'Monto')}
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                  {t('receivables.overdue.table.overdue', 'Vencido')}
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('receivables.overdue.table.status', 'Estado')}
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('receivables.overdue.table.last_contact', 'Últ. Contacto')}
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  {t('receivables.overdue.table.actions', 'Acciones Rápidas')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {safeAccounts.map((acc, idx) => {
                const getColors = (priority) => {
                  if (priority === 'High') {
                    return {
                      bg: 'bg-red-50 dark:bg-red-900/20',
                      text: 'text-red-700 dark:text-red-400',
                      border: 'border-red-200 dark:border-red-900/50',
                      dot: 'bg-red-500 animate-pulse',
                      label: t('receivables.overdue.priority.high', 'Prioridad Alta'),
                      daysBg: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                    };
                  } else if (priority === 'Medium') {
                    return {
                      bg: 'bg-amber-50 dark:bg-amber-900/20',
                      text: 'text-amber-700 dark:text-amber-400',
                      border: 'border-amber-200 dark:border-amber-900/50',
                      dot: 'bg-amber-500',
                      label: t('receivables.overdue.priority.medium', 'Prioridad Media'),
                      daysBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    };
                  }
                  return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    text: 'text-green-700 dark:text-green-400',
                    border: 'border-green-200 dark:border-green-900/50',
                    dot: 'bg-green-500',
                    label: t('receivables.overdue.priority.low', 'Prioridad Baja'),
                    daysBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  };
                };

                const getAvatarColors = (index) => {
                  const colors = [
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                    'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
                    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
                    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  ];
                  return colors[index % colors.length];
                };

                const itemColors = getColors(acc.priority);
                
                return (
                  <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 w-12 align-middle text-center">
                      <input className="rounded border-slate-300 text-primary focus:ring-primary/25 size-4" type="checkbox" />
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColors(idx)}`}>
                          {acc.code}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{acc.client}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">#{acc.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{formatPYG(acc.amount)}</p>
                    </td>
                    <td className="p-4 align-middle text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${itemColors.daysBg}`}>
                        {acc.days} {t('common.days', 'Días')}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${itemColors.border} ${itemColors.bg} ${itemColors.text}`}>
                        <span className={`size-1.5 rounded-full ${itemColors.dot}`}></span>
                        {itemColors.label}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <p className="text-sm text-slate-600 dark:text-slate-300">{(idx + 1) * 3} {t('common.days_ago', 'Días atrás')}</p>
                      <p className="text-xs text-slate-400">Vía Email</p>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors" title={t('action.call', 'Llamar')}>
                          <span className="material-symbols-outlined !text-lg">call</span>
                        </button>
                        <button className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors" title="WhatsApp">
                          <span className="material-symbols-outlined !text-lg">chat</span>
                        </button>
                        <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors" title="Email">
                          <span className="material-symbols-outlined !text-lg">mail</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OverdueTable
