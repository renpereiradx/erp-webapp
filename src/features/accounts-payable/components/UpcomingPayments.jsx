import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Upcoming payments list component.
 * Displays a list of next scheduled payments.
 */
const UpcomingPayments = ({ payments = [] }) => {
  return (
    <Card className="upcoming-payments-card flex flex-col h-full overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-lg">Calendario de Pagos Próximos</CardTitle>
        <Button variant="link" size="sm" className="upcoming-payments-card__view-all">Ver Todo</Button>
      </CardHeader>
      
      <CardContent className="p-0 overflow-y-auto max-h-[440px]">
        <div className="payment-list">
          {payments.map(payment => (
            <div key={payment.id} className="payment-list__item">
              <div className={`payment-list__date-box ${payment.status === 'Urgente' ? 'payment-list__date-box--urgent' : ''}`}>
                <span className="payment-list__month">{payment.date.month}</span>
                <span className="payment-list__day">{payment.date.day}</span>
              </div>
              
              <div className="payment-list__info">
                <p className="payment-list__vendor">{payment.vendor}</p>
                <p className="payment-list__invoice">Factura: {payment.invoice}</p>
              </div>
              
              <div className="payment-list__amount-group">
                <p className="payment-list__amount">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(payment.amount)}
                </p>
                <span className={`payment-list__status payment-list__status--${payment.statusType || 'neutral'}`}>
                  {payment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingPayments;
