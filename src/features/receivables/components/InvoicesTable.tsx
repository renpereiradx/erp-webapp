import { useI18n } from '@/lib/i18n';
import type { ClientCreditProfileBundle } from '../types';

/**
 * Tabla de facturas pendientes del perfil de crédito.
 * Migración FASE 3: .tsx + tokens + honestidad: fuera los filtros/orden sin
 * handler, el botón de acción por fila, la paginación muerta ("de 12" fijo)
 * y los fallbacks de fecha/monto inventados ('Oct 12, 2023', '$10,000').
 */

interface InvoicesTableProps {
  invoices?: ClientCreditProfileBundle['invoices']
}

const InvoicesTable = ({ invoices = [] }: InvoicesTableProps) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden flex-1 flex flex-col min-h-[400px]">
      <div className="p-md border-b border-border-subtle flex items-center justify-between gap-sm">
        <h2 className="text-body-md-bold text-foreground uppercase tracking-tight">
          {t('bi.receivables.profile.invoices.title', 'Facturas Pendientes', {})}
        </h2>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-body-md whitespace-nowrap">
          <thead className="bg-surface-muted text-label-caps uppercase text-on-surface-deep">
            <tr>
              <th className="px-md py-md">{t('bi.receivables.profile.invoices.col.id', 'Nº Factura', {})}</th>
              <th className="px-md py-md">{t('bi.receivables.profile.invoices.col.date', 'Fecha', {})}</th>
              <th className="px-md py-md">{t('bi.receivables.profile.invoices.col.due', 'Vencimiento', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.profile.invoices.col.amount', 'Monto Original', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.profile.invoices.col.balance', 'Saldo Pendiente', {})}</th>
              <th className="px-md py-md text-center">{t('bi.receivables.profile.invoices.col.status', 'Estado', {})}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {invoices.map((inv, idx) => {
              const overdue = inv.status?.toLowerCase().includes('overdue') || inv.status === 'Vencido'
              return (
                <tr key={idx} className="hover:bg-surface-muted transition-colors duration-150">
                  <td className="px-md py-md font-data-mono text-data-mono text-primary">{inv.id || '—'}</td>
                  <td className="px-md py-md text-foreground font-data-mono text-data-mono">{inv.date}</td>
                  <td className="px-md py-md text-foreground font-data-mono text-data-mono">{inv.due}</td>
                  <td className="px-md py-md text-right font-data-mono text-data-mono text-on-surface-deep">{inv.amount}</td>
                  <td className="px-md py-md text-right font-data-mono text-data-mono text-foreground">{inv.balance}</td>
                  <td className="px-md py-md text-center">
                    <span
                      className={`inline-flex items-center px-sm py-0.5 rounded-full text-body-sm-bold uppercase ${
                        overdue ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-md py-xl text-center text-on-surface-deep text-body-md italic">
                  {t('bi.receivables.profile.invoices.empty', 'Sin facturas pendientes', {})}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-md py-sm border-t border-border-subtle bg-surface-muted text-label-caps uppercase text-on-surface-deep">
        {t('bi.receivables.overdue.showing', 'Mostrando {n} cuentas', { n: invoices.length })}
      </div>
    </div>
  );
};

export default InvoicesTable
