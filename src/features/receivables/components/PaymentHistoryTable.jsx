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
    <Card className="payment-history">
      <CardHeader className="payment-history__header">
        <CardTitle>{t('receivables.detail.history.title')}</CardTitle>
        <div className="payment-history__actions">
          <Button variant="ghost" size="icon">
            <Filter size={16} />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="payment-history__content">
        <div className="payment-history__table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('receivables.detail.history.table.date')}</TableHead>
                <TableHead>{t('receivables.detail.history.table.ref')}</TableHead>
                <TableHead>{t('receivables.detail.history.table.method')}</TableHead>
                <TableHead>{t('receivables.detail.history.table.note')}</TableHead>
                <TableHead className="payment-history__cell--right">{t('receivables.detail.history.table.amount')}</TableHead>
                <TableHead className="payment-history__cell--actions"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((payment, idx) => {
                const MethodIcon = getMethodIcon(payment.method);
                return (
                  <TableRow key={idx} className="payment-history__row">
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="payment-history__cell--mono">{payment.ref}</TableCell>
                    <TableCell>
                      <div className="payment-history__method">
                        <MethodIcon size={16} className="payment-history__method-icon" />
                        <span>{payment.method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="payment-history__cell--note">{payment.note}</TableCell>
                    <TableCell className="payment-history__cell--right payment-history__cell--amount">
                      {formatPYG(payment.amount)}
                    </TableCell>
                    <TableCell className="payment-history__cell--right">
                      <Button variant="ghost" size="icon" className="payment-history__action-btn">
                        <MoreVertical size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <tfoot className="payment-history__footer">
              <TableRow>
                <TableCell colSpan="4" className="payment-history__footer-label">
                  {t('receivables.detail.stats.total_paid')}
                </TableCell>
                <TableCell className="payment-history__footer-value">
                  {formatPYG(totalPaid)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentHistoryTable;
