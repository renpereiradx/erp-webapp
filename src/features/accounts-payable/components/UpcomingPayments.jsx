import React from 'react';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Upcoming payments list component.
 * Displays a list of next scheduled payments.
 * 100% fidelity to Stitch design with overflow-hidden and rounded-xl.
 */
const UpcomingPayments = ({ payments = [] }) => {
  return (
    <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] rounded-xl flex flex-col h-full overflow-hidden transition-all hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)]">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
        <h3 className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">Calendario de Pagos</h3>
        <button className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Ver Todo</button>
      </div>
      
      <div className="overflow-y-auto max-h-[440px] flex-grow custom-scrollbar">
        {payments.map(payment => {
          const isUrgent = payment.status === 'Urgente';
          
          let statusClasses = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
          if (payment.statusType === 'info' || payment.status === 'Programado') {
            statusClasses = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
          } else if (isUrgent || payment.statusType === 'danger') {
            statusClasses = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
          }
          
          return (
            <div key={payment.id} className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all flex items-center gap-5 group cursor-pointer">
              <div className={`${isUrgent ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'} p-2.5 rounded-xl flex flex-col items-center justify-center min-w-[54px] border shadow-sm group-hover:scale-105 transition-transform`}>
                <span className={`text-[10px] font-black ${isUrgent ? 'text-fluent-danger' : 'text-slate-400'} uppercase tracking-tight`}>{payment.date.month}</span>
                <span className={`text-xl font-mono font-black ${isUrgent ? 'text-fluent-danger' : 'text-slate-900 dark:text-white'} leading-none mt-0.5`}>{payment.date.day}</span>
              </div>
              
              <div className="flex-grow min-w-0">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{payment.vendor}</p>
                <p className="text-[11px] font-semibold text-slate-500 flex items-center mt-0.5 uppercase tracking-wide">
                  <span className="opacity-50 mr-1">Factura:</span> <span className="font-mono font-bold">{payment.invoice}</span>
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-mono font-black text-slate-900 dark:text-white">
                  {formatPYG(payment.amount)}
                </p>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${statusClasses} font-black uppercase tracking-widest mt-1 inline-block`}>
                  {payment.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingPayments;
