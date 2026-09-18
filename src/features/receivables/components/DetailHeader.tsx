import { CircleDollarSign, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { ReceivableDetailData } from '../types';

/**
 * Encabezado del detalle de una cuenta por cobrar.
 * Migración FASE 3: .tsx + tokens. Botones PDF/Imprimir sin handler
 * eliminados (§2.6); sin fallback 'CLI-001'.
 */

interface DetailHeaderProps {
  id?: string
  client?: Partial<ReceivableDetailData['client']>
  transaction?: Partial<ReceivableDetailData['transaction']>
  onRegisterPayment?: () => void
}

const DetailHeader = ({ id, client = {}, transaction = {}, onRegisterPayment }: DetailHeaderProps) => {
  const { t } = useI18n();

  const rawAmount = transaction.rawAmount ?? 0
  const progressPercent = rawAmount > 0 ? Math.round(((transaction.rawPaid ?? 0) / rawAmount) * 100) : 0;

  const isOverdue = transaction.status === 'Overdue';

  return (
    <div className="bg-surface rounded-md shadow-whisper border border-border-subtle p-md">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-md">
        {/* Left: Title & Info */}
        <div className="flex items-start gap-md">
          <div className="size-16 rounded-md bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5 text-primary">
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">domain</span>
          </div>
          <div className="flex flex-col gap-xs">
            <div className="flex items-center gap-sm flex-wrap">
              <h1 className="text-headline-lg-mobile tracking-tighter text-foreground uppercase flex items-center">
                {t('bi.receivables.detail.invoice', 'Factura', {})}{' '}
                <span className="text-primary font-data-mono text-data-mono ml-sm">#{id}</span>
              </h1>
              {isOverdue ? (
                <div className="flex items-center gap-xs rounded-sm bg-error/10 px-sm py-xs border border-error/20 text-error text-body-sm-bold uppercase shadow-sm">
                  <span className="size-1.5 rounded-full bg-error animate-pulse" aria-hidden="true" />
                  {t('bi.receivables.status.OVERDUE', 'Vencido', {})}
                </div>
              ) : (
                <div className="flex items-center gap-xs rounded-sm bg-success/10 px-sm py-xs border border-success/20 text-success text-body-sm-bold uppercase shadow-sm">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
                  {transaction.status || t('bi.receivables.status.PAID', 'Pagado', {})}
                </div>
              )}
            </div>
            <p className="text-on-surface-deep text-body-md-bold uppercase tracking-tight">
              {client.name}
              {client.id && (
                <>
                  {' '}<span className="mx-xs opacity-30">•</span>{' '}
                  <span className="font-data-mono text-data-mono text-body-sm opacity-70">ID: {client.id}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-sm mt-xs text-label-caps uppercase text-on-surface-deep">
              <Clock size={14} className="opacity-50" />
              <span>
                {t('bi.receivables.detail.issued', 'Emitida', {})}:{' '}
                <span className="font-data-mono text-data-mono">{transaction.issueDate}</span>
              </span>
              <span className="mx-xs opacity-30">•</span>
              <span>
                {t('bi.receivables.detail.due', 'Vence', {})}:{' '}
                <span className={isOverdue ? 'text-error font-bold' : 'font-data-mono text-data-mono'}>
                  {transaction.dueDate}
                </span>
              </span>

              {isOverdue && (transaction.daysOverdue ?? 0) > 0 && (
                <>
                  <span className="mx-xs opacity-30">•</span>
                  <span className="text-error font-bold">
                    {t('bi.receivables.detail.daysOverdue', '{n} DÍAS DE MORA', { n: transaction.daysOverdue })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action */}
        <div className="flex flex-wrap items-center gap-sm lg:mb-xs">
          <button
            type="button"
            onClick={() => onRegisterPayment?.()}
            disabled={(transaction.rawBalance ?? 0) <= 0}
            className="inline-flex items-center px-md py-sm text-body-sm-bold uppercase rounded-button bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-whisper disabled:opacity-30 disabled:pointer-events-none"
          >
            <CircleDollarSign className="w-4 h-4 mr-2" />
            {t('bi.receivables.detail.registerPayment', 'Registrar Cobro', {})}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mt-lg pt-lg border-t border-border-subtle px-xs">
        <div className="flex flex-col gap-xs">
          <p className="text-label-caps uppercase text-on-surface-deep">
            {t('receivables.detail.stats.total_invoiced', 'Monto Original', {})}
          </p>
          <p className="text-foreground text-title-md font-data-mono text-data-mono tracking-tight">{transaction.amount}</p>
          <div className="mt-md h-1 w-full bg-surface-muted rounded-full overflow-hidden">
            <div className="h-full bg-on-surface-deep/30 w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-xs md:border-l border-border-subtle md:pl-md">
          <p className="text-label-caps uppercase text-on-surface-deep">
            {t('receivables.detail.stats.total_paid', 'Total Cobrado', {})}
          </p>
          <p className="text-success text-title-md font-data-mono text-data-mono tracking-tight">{transaction.paid}</p>
          <div className="mt-md h-1 w-full bg-surface-muted rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-xs md:border-l border-border-subtle md:pl-md">
          <p className="text-label-caps uppercase text-on-surface-deep">
            {t('receivables.detail.stats.balance_due', 'Saldo Pendiente', {})}
          </p>
          <p className="text-primary text-title-md font-data-mono text-data-mono tracking-tight">{transaction.balance}</p>
          <div className="mt-md h-1 w-full bg-surface-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${100 - progressPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailHeader;
