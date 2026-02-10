import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Tabla detallada de antigüedad por cliente.
 */
const AgingByClientTable = ({ clientsData }) => {
  const { t } = useI18n();

  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader>
        <CardTitle>{t('receivables.aging_report.top_debtors')}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm">
            <span className="material-symbols-outlined">filter_list</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('receivables.aging_report.table.client')}</TableHead>
              <TableHead className="text-right">{t('receivables.aging_report.table.total')}</TableHead>
              <TableHead className="text-right text-danger">{t('receivables.aging.90')}</TableHead>
              <TableHead className="text-center">{t('receivables.aging_report.table.risk')}</TableHead>
              <TableHead>{t('receivables.aging_report.table.last_payment')}</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsData.map((client, idx) => {
              // Calculamos riesgo ficticio basado en over_90_days
              const hasHighRisk = client.over_90_days > 0;
              
              return (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{client.client_name}</span>
                      <span className="text-tertiary" style={{ fontSize: '10px' }}>ID: {client.client_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(client.total)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-danger font-bold">
                    {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(client.over_90_days)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`status-pill ${hasHighRisk ? 'status-pill--danger' : 'status-pill--success'}`}>
                      {hasHighRisk ? 'Alto' : 'Bajo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-tertiary">
                    {/* Mock last payment date since it's not in Endpoint 9 */}
                    Oct 12, 2023 
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" size="sm">Ver</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AgingByClientTable;
