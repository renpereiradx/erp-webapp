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
    <div className="bg-surface p-8 rounded-xl border border-border-subtle shadow-fluent-2 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-6">
          <div className="size-14 rounded-xl bg-blue-50 flex items-center justify-center text-primary shadow-sm border border-blue-100 flex-shrink-0">
            <Building2 size={32} />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-text-main tracking-tight uppercase">{t('receivables.detail.title', { id })}</h1>
              <Badge 
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                  isOverdue ? 'bg-error text-white' : 'bg-success text-white'
                }`}
              >
                {isOverdue
                  ? <div className="flex items-center gap-1.5"><AlertTriangle size={14} /> <span>{transaction.status}</span></div>
                  : <div className="flex items-center gap-1.5"><CheckCircle2 size={14} /> <span>{transaction.status}</span></div>
                }
              </Badge>
            </div>
            <p className="text-sm font-bold text-text-secondary">
              {client.name} {client.id ? `\u2022 ${t('receivables.profile.client_id')}: ${client.id}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">
                <Calendar size={14} />
                <span>{t('receivables.detail.issued')}: <strong className="text-text-main">{transaction.issueDate}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">
                <Calendar size={14} />
                <span>{t('receivables.detail.due')}: <strong className="text-text-main">{transaction.dueDate}</strong></span>
              </div>
              {isOverdue && transaction.daysOverdue > 0 && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-error">
                  <span className="size-1.5 rounded-full bg-error animate-pulse"></span>
                  <span>{t('receivables.detail.overdue_days', { days: transaction.daysOverdue })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" className="h-10 px-4 bg-white border-border-subtle shadow-sm font-black uppercase tracking-widest text-[11px]">
            <Download size={18} className="mr-2" />
            <span>PDF</span>
          </Button>
          <Button variant="secondary" size="md" className="h-10 px-4 bg-white border-border-subtle shadow-sm font-black uppercase tracking-widest text-[11px]">
            <Printer size={18} className="mr-2" />
            <span>{t('action.print', 'Imprimir')}</span>
          </Button>
        </div>
      </div>

      <div className="h-px bg-border-subtle opacity-50 w-full"></div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.detail.stats.total_invoiced')}</p>
          <p className="text-2xl font-black text-text-main tracking-tight">{transaction.amount}</p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.detail.stats.total_paid')}</p>
          <p className="text-2xl font-black text-success tracking-tight">{transaction.paid}</p>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.detail.stats.balance_due')}</p>
            <p className="text-2xl font-black text-primary tracking-tight">{transaction.balance}</p>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailHeader;
