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
    <Card className="p-0 overflow-hidden">
      <CardHeader className="payment-history__header">
        <CardTitle>{t('receivables.detail.history.title')}</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Filter size={16} />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('receivables.detail.history.table.date')}</TableHead>
                <TableHead>{t('receivables.detail.history.table.ref')}</TableHead>
                <TableHead>{t('receivables.detail.history.table.method')}</TableHead>
                <TableHead>{t('receivables.detail.history.table.note')}</TableHead>
                <TableHead className="text-right">{t('receivables.detail.history.table.amount')}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((payment, idx) => {
                const MethodIcon = getMethodIcon(payment.method);
                return (
                  <TableRow key={idx} className="group">
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="font-mono">{payment.ref}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MethodIcon size={16} className="text-muted-foreground" />
                        <span>{payment.method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[150px]">{payment.note}</TableCell>
                    <TableCell className="text-right font-bold">{formatPYG(payment.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <tfoot className="payment-history__footer">
              <tr>
                <td colSpan="4" className="text-right text-xs font-bold uppercase tracking-wide text-muted-foreground p-4">
                  {t('receivables.detail.stats.total_paid')}
                </td>
                <td className="text-right font-bold text-lg p-4">{formatPYG(totalPaid)}</td>
                <td></td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentHistoryTable;
