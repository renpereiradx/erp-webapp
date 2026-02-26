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
    <div className="bg-surface rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col overflow-hidden h-fit">
      <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.invoices.title')}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-blue-50">
            <span className="material-symbols-outlined text-[18px] mr-2">filter_list</span> {t('common.filter') || 'Filtrar'}
          </Button>
          <Button variant="ghost" size="sm" className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-blue-50">
            <span className="material-symbols-outlined text-[18px] mr-2">sort</span> {t('common.sort') || 'Ordenar'}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-border-subtle">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.invoices.table.id')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.invoices.table.date')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.invoices.table.due')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.invoices.table.amount')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.invoices.table.balance')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right px-6">{t('receivables.invoices.table.status')}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv, idx) => (
              <TableRow key={idx} className="group hover:bg-slate-50 transition-colors border-border-subtle">
                <TableCell className="text-sm font-black text-primary hover:underline cursor-pointer uppercase tracking-tight">{inv.id}</TableCell>
                <TableCell className="text-xs font-bold text-text-secondary uppercase tracking-widest">{inv.date}</TableCell>
                <TableCell className="text-xs font-bold text-text-secondary uppercase tracking-widest">{inv.due}</TableCell>
                <TableCell className="text-sm font-bold text-text-main opacity-60 font-mono">{inv.amount}</TableCell>
                <TableCell className="text-sm font-black text-text-main font-mono">{inv.balance}</TableCell>
                <TableCell className="text-right px-6">
                  <Badge className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    inv.status.includes('Corriente') || inv.status.includes('Current') 
                      ? 'bg-success text-white' 
                      : inv.status.includes('>90') 
                        ? 'bg-error text-white' 
                        : 'bg-warning text-black'
                  }`}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-200">
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-6 py-4 bg-slate-50/50 border-t border-border-subtle flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">
          {t('receivables.invoices.showing', { shown: invoices.length, total: 12 })}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest border-border-subtle">{t('common.previous') || 'Anterior'}</Button>
          <Button variant="secondary" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest border-border-subtle">{t('common.next') || 'Siguiente'}</Button>
        </div>
      </div>
    </div>
  );
};

export default InvoicesTable;
