import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Tabla de facturas recientes para el dashboard.
 */
const RecentInvoicesTable = ({ debtorsData }) => {
  const { t } = useI18n();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Client</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead className="text-center">Days Overdue</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {debtorsData.map((inv, idx) => (
          <TableRow key={idx}>
            <TableCell className="col-id">{inv.invoiceId || '#INV-2023-001'}</TableCell>
            <TableCell>
              <div className="col-customer">
                <div className="customer-avatar" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                  {inv.client?.charAt(0)}
                </div>
                <span>{inv.client}</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-mono font-bold">{formatPYG(inv.balance)}</TableCell>
            <TableCell className="text-center font-bold">{inv.daysOverdue} d</TableCell>
            <TableCell>
              <span className={`status-pill status-pill--${inv.statusColor || 'warning'}`}>
                {inv.status}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="link" size="sm">View</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RecentInvoicesTable;
