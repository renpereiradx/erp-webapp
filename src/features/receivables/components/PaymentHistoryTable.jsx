import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Filter, Share2, Landmark, Banknote, MoreVertical } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

const getMethodIcon = (method) => {
  const m = (method || '').toLowerCase();
  if (m.includes('cheque') || m.includes('check')) return Banknote;
  return Landmark;
};

/**
 * Tabla de historial de pagos para una factura específica.
 */
const PaymentHistoryTable = ({ history = [], totalPaid = 0 }) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
        <h3 className="text-[#111418] dark:text-white text-lg font-bold">{t('receivables.detail.history.title', 'Historial de Pagos')}</h3>
        <div className="flex gap-2">
          <button className="p-1.5 text-gray-500 hover:text-primary rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Filtrar">
            <span className="material-symbols-outlined text-xl">filter_list</span>
          </button>
          <button className="p-1.5 text-gray-500 hover:text-primary rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Exportar CSV">
            <span className="material-symbols-outlined text-xl">ios_share</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-[#617589] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-border-light dark:border-border-dark">
              <th className="px-6 py-3">{t('receivables.detail.history.table.date', 'Fecha')}</th>
              <th className="px-6 py-3">{t('receivables.detail.history.table.ref', 'Referencia')}</th>
              <th className="px-6 py-3">{t('receivables.detail.history.table.method', 'Método')}</th>
              <th className="px-6 py-3">{t('receivables.detail.history.table.note', 'Nota')}</th>
              <th className="px-6 py-3 text-right">{t('receivables.detail.history.table.amount', 'Monto')}</th>
              <th className="px-6 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark text-sm">
            {history.map((payment, idx) => {
              const MethodIcon = getMethodIcon(payment.method);
              return (
                <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-[#111418] dark:text-gray-200">{payment.date}</td>
                  <td className="px-6 py-4 text-[#111418] dark:text-gray-200 font-mono text-xs">{payment.ref}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400"><MethodIcon size={18} /></span>
                      <span className="text-[#111418] dark:text-gray-200">{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#617589] dark:text-gray-400 truncate max-w-[150px]">{payment.note}</td>
                  <td className="px-6 py-4 text-right font-medium text-[#111418] dark:text-gray-200">{formatPYG(payment.amount)}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="invisible group-hover:visible text-gray-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800/30 border-t border-border-light dark:border-border-dark">
            <tr>
              <td className="px-6 py-3 text-right font-medium text-[#617589] dark:text-gray-400 text-xs uppercase tracking-wide" colSpan="4">
                {t('receivables.detail.stats.total_paid', 'Total Pagado')}
              </td>
              <td className="px-6 py-3 text-right font-bold text-[#111418] dark:text-white">
                {formatPYG(totalPaid)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;
