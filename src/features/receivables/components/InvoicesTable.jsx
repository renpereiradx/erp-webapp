import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la tabla de facturas pendientes.
 */
const InvoicesTable = ({ invoices, outstandingAmount }) => {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm overflow-hidden flex-1 flex flex-col h-fit">
      <div className="p-6 border-b border-[#f0f2f4] dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold text-[#111418] dark:text-white">{t('receivables.invoices.title', 'Facturas Pendientes')}</h2>
        <div className="flex gap-2">
          <button className="text-sm font-medium text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">filter_list</span> {t('common.filter', 'Filtrar')}
          </button>
          <button className="text-sm font-medium text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">sort</span> {t('common.sort', 'Ordenar')}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f9fafb] dark:bg-gray-800/50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3 font-semibold w-32">{t('receivables.invoices.table.id', 'Nº Factura')}</th>
              <th className="px-6 py-3 font-semibold">{t('receivables.invoices.table.date', 'Fecha')}</th>
              <th className="px-6 py-3 font-semibold">{t('receivables.invoices.table.due', 'Vencimiento')}</th>
              <th className="px-6 py-3 font-semibold">{t('receivables.invoices.table.amount', 'Monto')}</th>
              <th className="px-6 py-3 font-semibold">{t('receivables.invoices.table.balance', 'Saldo')}</th>
              <th className="px-6 py-3 font-semibold text-right">{t('receivables.invoices.table.status', 'Estado')}</th>
              <th className="px-6 py-3 font-semibold w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f4] dark:divide-gray-800">
            {invoices.map((inv, idx) => {
              // Priority badge styling mirroring Stitch logical classes
              let badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
              if (inv.status.includes('Corriente') || inv.status.includes('Current')) {
                badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
              } else if (inv.status.includes('>90') || inv.status.includes('Más de 90')) {
                badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
              } else if (inv.status.includes('30-60') || inv.status.includes('61-90')) {
                badgeColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
              }

              return (
                <tr key={idx} className="hover:bg-[#f9fafb] dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-primary hover:underline cursor-pointer">{inv.id}</td>
                  <td className="px-6 py-4 text-[#111418] dark:text-gray-300">{inv.date}</td>
                  <td className="px-6 py-4 text-[#111418] dark:text-gray-300">{inv.due}</td>
                  <td className="px-6 py-4 font-mono text-[#111418] dark:text-gray-200">{inv.amount}</td>
                  <td className="px-6 py-4 font-mono font-medium text-[#111418] dark:text-white">{inv.balance}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary transition-opacity">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-[#f0f2f4] dark:border-gray-800 bg-[#f9fafb] dark:bg-gray-800/30 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {t('receivables.invoices.showing', { shown: invoices.length, total: 12 }, `Mostrando ${invoices.length} de 12 facturas`)}
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs font-medium rounded bg-white dark:bg-gray-700 border border-[#f0f2f4] dark:border-gray-600 text-gray-500 hover:text-[#111418] dark:hover:text-white transition-colors">{t('common.previous', 'Anterior')}</button>
          <button className="px-3 py-1 text-xs font-medium rounded bg-white dark:bg-gray-700 border border-[#f0f2f4] dark:border-gray-600 text-gray-500 hover:text-[#111418] dark:hover:text-white transition-colors">{t('common.next', 'Siguiente')}</button>
        </div>
      </div>
    </div>
  );
};

export default InvoicesTable;
