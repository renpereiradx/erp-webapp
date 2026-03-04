import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import { Search, ChevronDown, Phone, MessageSquare, Mail, Filter, MoreHorizontal } from 'lucide-react'

/**
 * Tabla de Cuentas Vencidas - Optimizada para evitar scroll horizontal y fiel a Stitch.
 * Todo en español.
 */
const OverdueTable = ({ accounts = [], toast }) => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const safeAccounts = Array.isArray(accounts) ? accounts : []

  return (
    <div className='flex flex-col gap-6 w-full'>
      {/* Barra de Búsqueda y Filtros al estilo Stitch */}
      <div className="bg-white dark:bg-[#1b2633] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-[400px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              disabled
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-transparent rounded-xl text-sm text-slate-400 placeholder:text-slate-400 font-medium cursor-not-allowed opacity-70"
              placeholder={t('receivables.overdue.search', 'Buscar por cliente, ID de factura...')}
              type="text"
            />
          </div>
          <div className="flex gap-2 items-center">
            <button 
              disabled
              onClick={() => toast.info(t('common.not_implemented'))}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-transparent cursor-not-allowed opacity-70"
            >
              <span>Prioridad</span>
              <ChevronDown className="size-3" />
            </button>
            <button 
              disabled
              onClick={() => toast.info(t('common.not_implemented'))}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-transparent cursor-not-allowed opacity-70"
            >
              <span>Estado</span>
              <ChevronDown className="size-3" />
            </button>
            <button 
              className="p-2.5 text-slate-400 hover:text-primary transition-all bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent hover:border-slate-200"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-white dark:bg-[#1b2633] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] overflow-hidden flex flex-col transition-all hover:shadow-md">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 w-12 text-center">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary/25 size-4 cursor-pointer" type="checkbox" />
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente / Factura</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Monto</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center whitespace-nowrap">Días Venc.</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Prioridad</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Últ. Contacto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[13px]">
              {safeAccounts.map((acc, idx) => {
                const isHigh = acc.priority === 'High';
                const isMedium = acc.priority === 'Medium';
                
                const priorityLabel = isHigh ? 'Crítica' : isMedium ? 'Media' : 'Baja';
                const daysLabel = `${acc.days} Días`;

                return (
                  <tr key={idx} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-center">
                      <input className="rounded border-slate-300 text-primary focus:ring-primary/25 size-4 cursor-pointer" type="checkbox" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-9 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm border border-black/5 ${
                          idx % 3 === 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 
                          idx % 3 === 1 ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' : 
                          'bg-teal-50 text-teal-600 dark:bg-teal-900/30'
                        }`}>
                          {acc.code}
                        </div>
                        <div className="flex flex-col">
                          <span 
                            className="font-extrabold text-slate-900 dark:text-white group-hover:text-primary group-hover:underline transition-colors"
                            onClick={() => navigate(`/receivables/client-profile/${acc.clientId || 'client_001'}`)}
                          >
                            {acc.client}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono font-bold tracking-tight">INV-2023-00{idx+1}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-black text-slate-900 dark:text-white font-mono">{formatPYG(acc.amount)}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-tight ${
                          isHigh ? 'text-fluent-danger bg-red-50 dark:bg-red-900/20' : 
                          isMedium ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 
                          'text-emerald-600 bg-green-50 dark:bg-emerald-900/20'
                        }`}>
                          {daysLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border w-fit bg-white dark:bg-slate-800 shadow-sm transition-all group-hover:scale-105 ${
                        isHigh ? 'border-red-100 text-fluent-danger' : 
                        isMedium ? 'border-orange-100 text-orange-600' : 
                        'border-emerald-100 text-emerald-600'
                      }`}>
                        <div className={`size-1.5 rounded-full ${isHigh ? 'bg-red-500 animate-pulse' : isMedium ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {priorityLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Oct {24 - idx}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Vía Email</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary shadow-none hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                          <Phone size={14} strokeWidth={2.5} />
                        </button>
                        <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary shadow-none hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                          <MoreHorizontal size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Mostrando 1 a {safeAccounts.length} de 142 resultados</span>
          <div className="flex items-center gap-1.5">
            <button className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
              <MoreHorizontal size={16} className="rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverdueTable
