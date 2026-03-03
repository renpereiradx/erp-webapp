import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, Download, Printer, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Encabezado detallado para una factura específica.
 */
const DetailHeader = ({ id, client = {}, transaction = {} }) => {
  const { t } = useI18n();

  const progressPercent = transaction.rawAmount > 0
    ? Math.round((transaction.rawPaid / transaction.rawAmount) * 100)
    : 0;

  const isOverdue = transaction.status === 'Overdue';

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Left: Title & Info */}
        <div className="flex gap-4">
          <div className="size-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-border-light dark:border-border-dark">
            <span className="material-symbols-outlined text-3xl text-gray-400">domain</span>
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[#111418] dark:text-white text-2xl md:text-3xl font-bold tracking-tight">Factura #{id || transaction.invoiceNumber}</h1>
              {isOverdue ? (
                <div className="flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/20 px-2.5 py-0.5 border border-red-100 dark:border-red-800/30">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm">warning</span>
                  <span className="text-red-700 dark:text-red-300 text-xs font-semibold uppercase tracking-wide">Vencido</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 border border-emerald-100 dark:border-emerald-800/30">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm">check_circle</span>
                  <span className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wide">{transaction.status || 'Pagado'}</span>
                </div>
              )}
            </div>
            <p className="text-[#617589] dark:text-gray-400 text-base mt-1">{client.name} {client.id ? `• Client ID: ${client.id}` : ''}</p>
            <div className="flex items-center gap-2 mt-3 text-sm text-[#617589] dark:text-gray-400">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              <span>Emitida: <strong className="text-[#111418] dark:text-white">{transaction.issueDate}</strong></span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-1"></span>
              <span>Vence: <strong className="text-[#111418] dark:text-white">{transaction.dueDate}</strong></span>
              
              {isOverdue && transaction.daysOverdue > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-1"></span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{transaction.daysOverdue} {t('receivables.common.days_overdue', 'Días vencidos')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: High Level Actions */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 h-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white font-medium text-sm">
            <span className="material-symbols-outlined text-lg">download</span>
            <span>PDF</span>
          </button>
          <button className="flex items-center gap-2 px-4 h-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white font-medium text-sm">
            <span className="material-symbols-outlined text-lg">print</span>
            <span>{t('action.print', 'Imprimir')}</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col gap-1">
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">{t('receivables.detail.stats.total_invoiced', 'Total Facturado')}</p>
          <p className="text-[#111418] dark:text-white text-2xl font-bold tracking-tight">{transaction.amount}</p>
        </div>
        
        <div className="flex flex-col gap-1 relative">
          {/* Visual connector for desktop math */}
          <span className="hidden md:block absolute -left-[18px] top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 material-symbols-outlined">remove</span>
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">{t('receivables.detail.stats.total_paid', 'Total Pagado')}</p>
          <p className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold tracking-tight">{transaction.paid || (transaction.currency || 'GS') + ' 0'}</p>
        </div>
        
        <div className="flex flex-col gap-1 relative">
          <span className="hidden md:block absolute -left-[18px] top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 material-symbols-outlined">equal</span>
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">{t('receivables.detail.stats.balance_due', 'Saldo Pendiente')}</p>
          <p className="text-primary text-2xl font-bold tracking-tight">{transaction.balance}</p>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailHeader;
