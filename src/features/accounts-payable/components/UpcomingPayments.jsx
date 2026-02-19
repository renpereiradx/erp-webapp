import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Upcoming payments list component.
 * Displays a list of next scheduled payments.
 */
const UpcomingPayments = ({ payments = [] }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-lg dark:text-white">Calendario de Pagos Próximos</h3>
        <Button variant="link" size="sm" className="text-xs">Ver Todo</Button>
      </div>
      
      <div className="payment-list">
        {payments.map(payment => (
          <div key={payment.id} className="payment-list__item">
            <div className={`payment-list__date-box ${payment.status === 'Urgente' ? 'payment-list__date-box--urgent' : ''}`}>
              <span>{payment.date.month}</span>
              <span>{payment.date.day}</span>
            </div>
            
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold truncate dark:text-white">{payment.vendor}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Factura: {payment.invoice}</p>
            </div>
            
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold dark:text-white">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(payment.amount)}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                payment.statusType === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                payment.statusType === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {payment.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default UpcomingPayments;
