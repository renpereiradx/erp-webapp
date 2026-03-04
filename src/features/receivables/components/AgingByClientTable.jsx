import React from 'react'
import { formatPYG } from '@/utils/currencyUtils'
import { MoreHorizontal } from 'lucide-react'

/**
 * Tabla detallada de antigüedad por cliente.
 * Estilo unificado con el módulo de Payables y alta densidad para 1080p.
 */
const AgingByClientTable = ({ clientsData = [] }) => {
  const safeData = Array.isArray(clientsData) ? clientsData : []

  return (
    <div className="bg-white dark:bg-[#1b2633] rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] overflow-hidden flex flex-col flex-1 transition-all hover:shadow-md">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Desglose por Cliente</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Distribución de deuda por tramos de vencimiento</p>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/30 dark:bg-slate-800/10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800">
              <th className="px-6 py-4">Cliente</th>
              <th className="px-4 py-4 text-right">Al Día</th>
              <th className="px-4 py-4 text-right">31-60 Días</th>
              <th className="px-4 py-4 text-right">61-90 Días</th>
              <th className="px-4 py-4 text-right">+90 Días</th>
              <th className="px-6 py-4 text-right">Saldo Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[13px]">
            {safeData.map((client, idx) => (
              <tr key={idx} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black border border-primary/5 shadow-sm">
                      {client.client_name?.charAt(0) || 'C'}
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{client.client_name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPYG(client.current || 0)}
                </td>
                <td className={`px-4 py-4 text-right font-mono font-medium ${client.days_31_60 > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {formatPYG(client.days_31_60 || 0)}
                </td>
                <td className={`px-4 py-4 text-right font-mono font-bold ${client.days_61_90 > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                  {formatPYG(client.days_61_90 || 0)}
                </td>
                <td className={`px-4 py-4 text-right font-mono font-black ${client.over_90_days > 0 ? 'text-fluent-danger' : 'text-slate-400'}`}>
                  {formatPYG(client.over_90_days || 0)}
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-slate-900 dark:text-white">
                  {formatPYG(client.total || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/80 dark:bg-slate-800/50 border-t-2 border-slate-100 dark:border-slate-800">
            <tr>
              <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Totales de Cartera</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600">
                {formatPYG(safeData.reduce((acc, c) => acc + (c.current || 0), 0))}
              </td>
              <td className="px-4 py-4 text-right font-mono font-bold text-amber-600">
                {formatPYG(safeData.reduce((acc, c) => acc + (c.days_31_60 || 0), 0))}
              </td>
              <td className="px-4 py-4 text-right font-mono font-bold text-orange-600">
                {formatPYG(safeData.reduce((acc, c) => acc + (c.days_61_90 || 0), 0))}
              </td>
              <td className="px-4 py-4 text-right font-mono font-bold text-fluent-danger">
                {formatPYG(safeData.reduce((acc, c) => acc + (c.over_90_days || 0), 0))}
              </td>
              <td className="px-6 py-4 text-right font-mono font-black text-primary">
                {formatPYG(safeData.reduce((acc, c) => acc + (c.total || 0), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default AgingByClientTable
