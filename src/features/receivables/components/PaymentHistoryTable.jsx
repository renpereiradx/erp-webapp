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
    <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-fluent-2 flex flex-col h-fit">
      <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.detail.history.title')}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary hover:text-primary">
            <Filter size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary hover:text-primary">
            <Share2 size={16} />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-border-subtle">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.detail.history.table.date')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.detail.history.table.ref')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.detail.history.table.method')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.detail.history.table.note')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right px-6">{t('receivables.detail.history.table.amount')}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((payment, idx) => {
              const MethodIcon = getMethodIcon(payment.method);
              return (
                <TableRow key={idx} className="group hover:bg-slate-50 transition-colors border-border-subtle">
                  <TableCell className="text-sm font-bold text-text-main">{payment.date}</TableCell>
                  <TableCell className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-60 font-mono">#{payment.ref}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                      <MethodIcon size={16} className="text-primary opacity-60" />
                      <span>{payment.method}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary italic min-w-[150px]">{payment.note}</TableCell>
                  <TableCell className="text-right px-6 text-sm font-black text-text-main">
                    {formatPYG(payment.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <tfoot className="bg-slate-50/50 border-t border-border-subtle">
            <TableRow>
              <TableCell colSpan="4" className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right">
                {t('receivables.detail.stats.total_paid')}
              </TableCell>
              <TableCell className="py-4 px-6 text-base font-black text-success text-right">
                {formatPYG(totalPaid)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </tfoot>
        </Table>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;
