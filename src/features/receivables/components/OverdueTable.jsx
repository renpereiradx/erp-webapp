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
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import { Search, ChevronDown, Phone, MessageSquare, Mail, Filter, MoreHorizontal } from 'lucide-react'

/**
 * Tabla de Cuentas Vencidas - Optimizada para evitar scroll horizontal y fiel a Stitch.
 * Todo en español.
 */
const OverdueTable = ({ accounts = [] }) => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const safeAccounts = Array.isArray(accounts) ? accounts : []

  return (
    <div className='flex flex-col gap-6 w-full'>
      {/* Barra de Búsqueda y Filtros al estilo Stitch */}
      <div className="bg-white dark:bg-[#1A2633] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
              placeholder={t('receivables.overdue.search', 'Buscar por cliente, ID de factura...')}
              type="text"
            />
          </div>
          <div className="flex gap-2 items-center">
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
              <span>Prioridad: Todas</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
              <span>Estado: Sin Resolver</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
              <span>Cobrador: Mío</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-white dark:bg-[#1A2633] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white dark:bg-[#15202B] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 w-12 text-center">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary/25 size-4 cursor-pointer" type="checkbox" />
                </th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cliente / Factura</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Monto</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Días Vencidos</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Últ. Contacto</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {safeAccounts.map((acc, idx) => {
                const isHigh = acc.priority === 'High';
                const isMedium = acc.priority === 'Medium';
                
                // Traducción de prioridades
                const priorityLabel = isHigh ? 'Prioridad Alta' : isMedium ? 'Prioridad Media' : 'Prioridad Baja';
                const daysLabel = `${acc.days} Días`;

                return (
                  <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <input className="rounded border-slate-300 text-primary focus:ring-primary/25 size-4 cursor-pointer" type="checkbox" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-9 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          idx % 3 === 0 ? 'bg-blue-100 text-blue-600' : 
                          idx % 3 === 1 ? 'bg-purple-100 text-purple-600' : 
                          'bg-teal-100 text-teal-600'
                        }`}>
                          {acc.code}
                        </div>
                        <div className="flex flex-col">
                          <span 
                            className="font-bold text-slate-700 dark:text-white text-[13px] hover:text-primary hover:underline cursor-pointer transition-colors"
                            onClick={() => navigate(`/receivables/client-profile/${acc.clientId || 'client_001'}`)}
                          >
                            {acc.client}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium tracking-tight">INV-2023-00{idx+1}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-bold text-slate-800 dark:text-white text-[13px] tracking-tight">{formatPYG(acc.amount)}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          isHigh ? 'text-red-600 bg-red-50' : 
                          isMedium ? 'text-orange-600 bg-orange-50' : 
                          'text-green-600 bg-green-50'
                        }`}>
                          {daysLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700 w-fit bg-white dark:bg-slate-800 shadow-sm">
                        <div className={`size-1.5 rounded-full ${isHigh ? 'bg-red-500 animate-pulse' : isMedium ? 'bg-orange-500' : 'bg-green-500'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${isHigh ? 'text-red-600' : isMedium ? 'text-orange-600' : 'text-green-600'}`}>
                          {priorityLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">Oct {24 - idx}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Vía Email</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-md transition-all" title="Llamar">
                          <Phone size={14} strokeWidth={2.5} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-all" title="Chat">
                          <MessageSquare size={14} strokeWidth={2.5} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="Email">
                          <Mail size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Paginación al estilo Stitch */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mostrando 1 a {safeAccounts.length} de 23 resultados</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-[11px] font-bold text-slate-400 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">Anterior</button>
            <button className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverdueTable
