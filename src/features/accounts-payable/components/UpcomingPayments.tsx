import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import type { PayablesPaymentCard } from '@/domain/payables/dashboard';

/**
 * Calendario de pagos próximos del dashboard de CxP.
 * Migración FASE 4: .tsx + tokens; el botón "Ver Todo" sin handler se
 * eliminó (§2.6).
 */

interface UpcomingPaymentsProps {
  payments?: PayablesPaymentCard[]
}

const UpcomingPayments = ({ payments = [] }: UpcomingPaymentsProps) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface border border-border-subtle shadow-whisper rounded-md flex flex-col h-full overflow-hidden transition-shadow hover:shadow-fluent-8">
      <div className="p-md border-b border-border-subtle flex justify-between items-center bg-surface-muted">
        <h3 className="text-body-md-bold tracking-tight text-foreground uppercase">
          {t('bi.payables.upcoming.title', 'Calendario de Pagos', {})}
        </h3>
      </div>

      <div className="overflow-y-auto max-h-[440px] grow custom-scrollbar">
        {payments.map((payment) => {
          const isUrgent = payment.status === 'Urgente';

          const statusClasses =
            payment.statusType === 'danger' || isUrgent
              ? 'bg-error/10 text-error'
              : 'bg-primary/10 text-primary';

          return (
            <div
              key={payment.id}
              className="p-sm border-b border-border-subtle hover:bg-surface-muted transition-colors duration-150 flex items-center gap-md"
            >
              <div
                className={`${
                  isUrgent ? 'bg-error/10 border-error/20 text-error' : 'bg-surface-muted border-border-subtle text-on-surface-deep'
                } p-sm rounded-md flex flex-col items-center justify-center min-w-[54px] border`}
              >
                <span className="text-label-caps uppercase tracking-tight">{payment.date.month}</span>
                <span className={`text-title-md font-data-mono text-data-mono leading-none mt-0.5 ${isUrgent ? 'text-error' : 'text-foreground'}`}>
                  {payment.date.day}
                </span>
              </div>

              <div className="grow min-w-0">
                <p className="text-body-md-bold text-foreground truncate">{payment.vendor}</p>
                <p className="text-body-sm-bold text-on-surface-deep flex items-center mt-0.5 uppercase">
                  <span className="opacity-50 mr-xs">{t('bi.payables.upcoming.invoice', 'Factura', {})}:</span>{' '}
                  <span className="font-data-mono text-data-mono">{payment.invoice}</span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-body-md-bold font-data-mono text-data-mono text-foreground">
                  {formatPYG(payment.amount ?? 0)}
                </p>
                <span className={`text-label-caps px-sm py-0.5 rounded-full ${statusClasses} uppercase mt-xs inline-block`}>
                  {payment.status}
                </span>
              </div>
            </div>
          );
        })}
        {payments.length === 0 && (
          <p className="p-lg text-center text-on-surface-deep text-body-md italic">
            {t('bi.payables.upcoming.empty', 'Sin pagos programados', {})}
          </p>
        )}
      </div>
    </div>
  );
};

export default UpcomingPayments
