import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la tabla de facturas pendientes.
 */
const InvoicesTable = ({ invoices, outstandingAmount }) => {
  const { t } = useI18n();

  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader>
        <CardTitle>{t('receivables.invoices.title')}</CardTitle>
        <CardAction>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm">
              <span className="material-symbols-outlined">filter_list</span> {t('common.filter') || 'Filtrar'}
            </Button>
            <Button variant="ghost" size="sm">
              <span className="material-symbols-outlined">sort</span> {t('common.sort') || 'Ordenar'}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('receivables.invoices.table.id')}</TableHead>
              <TableHead>{t('receivables.invoices.table.date')}</TableHead>
              <TableHead>{t('receivables.invoices.table.due')}</TableHead>
              <TableHead>{t('receivables.invoices.table.amount')}</TableHead>
              <TableHead>{t('receivables.invoices.table.balance')}</TableHead>
              <TableHead className="text-right">{t('receivables.invoices.table.status')}</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-bold text-primary">{inv.id}</TableCell>
                <TableCell>{inv.date}</TableCell>
                <TableCell>{inv.due}</TableCell>
                <TableCell className="font-mono">{inv.amount}</TableCell>
                <TableCell className="font-mono font-bold">{inv.balance}</TableCell>
                <TableCell className="text-right">
                  <span className={`status-pill ${
                    inv.status.includes('Corriente') || inv.status.includes('Current') 
                      ? 'status-pill--success' 
                      : inv.status.includes('>90') 
                        ? 'status-pill--danger' 
                        : 'status-pill--warning'
                  }`}>
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <span className="material-symbols-outlined">more_vert</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="bg-secondary" style={{ padding: '12px 24px' }}>
        <p className="text-tertiary" style={{ fontSize: '12px' }}>
          {t('receivables.invoices.showing', { shown: invoices.length, total: 12 })}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">{t('common.previous') || 'Anterior'}</Button>
          <Button variant="outline" size="sm">{t('common.next') || 'Siguiente'}</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InvoicesTable;
