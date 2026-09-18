import { Landmark, Banknote } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Tabla de historial de pagos de una factura.
 * Migración FASE 3: .tsx + tokens; botones de filtrar/exportar/acción por
 * fila sin handler eliminados (§2.6).
 */

const getMethodIcon = (method?: string) => {
  const m = (method || '').toLowerCase();
  if (m.includes('cheque') || m.includes('check')) return Banknote;
  return Landmark;
};

interface PaymentHistoryTableProps {
  history?: Array<{ date: string; ref: string; method: string; note: string; amount: number }>
  totalPaid?: number
}

const PaymentHistoryTable = ({ history = [], totalPaid = 0 }: PaymentHistoryTableProps) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface rounded-md shadow-whisper border border-border-subtle overflow-hidden flex flex-col h-full">
      <div className="px-md py-sm border-b border-border-subtle flex justify-between items-center bg-surface-muted">
        <h3 className="text-title-md text-foreground">{t('receivables.detail.history.title', 'Historial de Pagos', {})}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted text-on-surface-deep text-label-caps uppercase border-b border-border-subtle">
              <th className="px-md py-sm">{t('receivables.detail.history.table.date', 'Fecha', {})}</th>
              <th className="px-md py-sm">{t('receivables.detail.history.table.ref', 'Referencia', {})}</th>
              <th className="px-md py-sm">{t('receivables.detail.history.table.method', 'Método', {})}</th>
              <th className="px-md py-sm">{t('receivables.detail.history.table.note', 'Nota', {})}</th>
              <th className="px-md py-sm text-right">{t('receivables.detail.history.table.amount', 'Monto', {})}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {history.map((payment, idx) => {
              const MethodIcon = getMethodIcon(payment.method);
              return (
                <tr key={idx} className="hover:bg-surface-muted transition-colors duration-150">
                  <td className="px-md py-sm text-foreground">{payment.date}</td>
                  <td className="px-md py-sm text-foreground font-data-mono text-data-mono text-body-sm">{payment.ref}</td>
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-sm">
                      <span className="text-on-surface-deep"><MethodIcon size={18} /></span>
                      <span className="text-foreground">{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-md py-sm text-on-surface-deep truncate max-w-[150px]">{payment.note}</td>
                  <td className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">
                    {formatPYG(payment.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-surface-muted border-t border-border-subtle">
            <tr>
              <td
                className="px-md py-sm text-right font-data-mono text-data-mono text-on-surface-deep text-body-sm-bold uppercase"
                colSpan={4}
              >
                {t('receivables.detail.stats.total_paid', 'Total Pagado', {})}
              </td>
              <td className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">
                {formatPYG(totalPaid)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryTable
