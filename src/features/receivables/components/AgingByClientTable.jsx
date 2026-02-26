import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

/**
 * Tabla detallada de antigüedad por cliente.
 */
const AgingByClientTable = ({ clientsData }) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-fluent-2 flex flex-col h-fit">
      <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.aging_report.top_debtors')}</h3>
        <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary hover:text-primary">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-border-subtle">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.aging_report.table.client')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right px-6">{t('receivables.aging_report.table.total')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-error text-right px-6">{t('receivables.aging.90')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-center">{t('receivables.aging_report.table.risk')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{t('receivables.aging_report.table.last_payment')}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsData.map((client, idx) => {
              // Calculamos riesgo ficticio basado en over_90_days
              const hasHighRisk = client.over_90_days > 0;
              
              return (
                <TableRow key={idx} className="group hover:bg-slate-50 transition-colors border-border-subtle">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-black text-primary">
                        {client.client_name?.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors uppercase tracking-tight">{client.client_name}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">ID: {client.client_id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6 text-sm font-black text-text-main">
                    {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(client.total)}
                  </TableCell>
                  <TableCell className="text-right px-6 text-sm font-black text-error">
                    {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(client.over_90_days)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${hasHighRisk ? 'bg-error text-white' : 'bg-success text-white'}`}>
                      {hasHighRisk ? 'Alto' : 'Bajo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-text-secondary opacity-60 uppercase tracking-widest">
                    Oct 12, 2023 
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-200">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AgingByClientTable;
