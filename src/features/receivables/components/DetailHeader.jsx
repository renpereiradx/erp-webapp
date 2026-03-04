import React from 'react';
import { Download, Printer, FileBadge, User, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Encabezado detallado para una factura específica.
 * Refactorizado para 100% fidelidad visual con Stitch.
 */
const DetailHeader = ({ id, client = {}, transaction = {} }) => {
  const { t } = useI18n();

  const progressPercent = transaction.rawAmount > 0
    ? Math.round((transaction.rawPaid / transaction.rawAmount) * 100)
    : 0;

  const isOverdue = transaction.status === 'Overdue';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        {/* Left: Title & Info */}
        <div className="flex items-start gap-5">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5 shadow-sm text-primary">
            <span className="material-symbols-outlined text-3xl">domain</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900 dark:text-white uppercase flex items-center">
                Factura <span className="text-primary font-mono ml-2">#{id || transaction.invoiceNumber}</span>
              </h1>
              {isOverdue ? (
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 px-2.5 py-1 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Vencido
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 border border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {transaction.status || 'Pagado'}
                </div>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-tight">
              {client.name} <span className="mx-1 opacity-30">•</span> <span className="font-mono text-xs opacity-70">ID: {client.id || 'CLI-001'}</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <Clock size={14} className="opacity-50" />
              <span>Emitida: <span className="text-slate-600 dark:text-slate-300 font-mono">{transaction.issueDate}</span></span>
              <span className="mx-1 opacity-30">•</span>
              <span>Vence: <span className={isOverdue ? "text-fluent-danger font-black" : "text-slate-600 dark:text-slate-300"}>{transaction.dueDate}</span></span>
              
              {isOverdue && transaction.daysOverdue > 0 && (
                <>
                  <span className="mx-1 opacity-30">•</span>
                  <span className="text-fluent-danger font-black">{transaction.daysOverdue} DÍAS DE MORA</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 lg:mb-1">
          <button 
            disabled
            className="inline-flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button 
            disabled
            className="inline-flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 px-1">
        <div className="flex flex-col gap-1 group">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{t('receivables.detail.stats.total_invoiced', 'Monto Original')}</p>
          <p className="text-slate-900 dark:text-white text-2xl xl:text-3xl font-black tracking-tight font-mono">{transaction.amount}</p>
          <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 w-full opacity-30" />
          </div>
        </div>
        
        <div className="flex flex-col gap-1 group border-l-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors">{t('receivables.detail.stats.total_paid', 'Total Cobrado')}</p>
          <p className="text-emerald-600 dark:text-emerald-400 text-2xl xl:text-3xl font-black tracking-tight font-mono">{transaction.paid || (transaction.currency || 'GS') + ' 0'}</p>
          <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        
        <div className="flex flex-col gap-1 group border-l-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{t('receivables.detail.stats.balance_due', 'Saldo Pendiente')}</p>
          <p className="text-primary text-2xl xl:text-3xl font-black tracking-tight font-mono">{transaction.balance}</p>
          <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(19,127,236,0.4)]" style={{ width: `${100 - progressPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailHeader;
