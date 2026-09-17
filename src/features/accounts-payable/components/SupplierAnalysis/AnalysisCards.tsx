import type { PaymentHistoryColor, SupplierAnalysisData } from '../../types';

interface AnalysisCardsProps {
  rating: SupplierAnalysisData['rating'];
  terms: SupplierAnalysisData['terms'];
}

/**
 * Analysis Section (Rating & Terms). Solo datos reales del dto (auditoría
 * BI 2A): el score /100 y las 4.5 estrellas eran fabricación — se muestra
 * el enum payment_history real; el límite de crédito (×1.5 inventado) fue
 * reemplazado por conteos de facturas reales.
 */
const RATING_COLORS: Record<PaymentHistoryColor, string> = {
  emerald: 'text-success',
  blue: 'text-primary',
  amber: 'text-warning',
  rose: 'text-error',
  slate: 'text-on-surface-deep',
};

const AnalysisCards = ({ rating, terms }: AnalysisCardsProps) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in">
      {/* Payment Rating (enum real: EXCELLENT/GOOD/REGULAR/POOR) */}
      <div className="bg-surface p-6 md:p-8 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="shrink-0 text-center">
          <div className={`text-3xl md:text-4xl font-bold mb-2 ${RATING_COLORS[rating.color] || RATING_COLORS.slate}`}>
            {rating.historyLabel}
          </div>
          <p className="text-[10px] text-on-surface-deep mt-2 font-medium uppercase tracking-widest">Calificación de Pago</p>
        </div>
        <div className="hidden md:block h-16 w-px bg-surface-muted"></div>
        <div>
          <h4 className="text-base md:text-lg font-bold mb-2">Historial de Cumplimiento</h4>
          <p className="text-xs md:text-sm text-on-surface-deep leading-relaxed">
            {rating.description}
          </p>
        </div>
      </div>

      {/* Credit Terms (datos reales) */}
      <div className="bg-surface p-6 md:p-8 rounded-xl border border-border-subtle shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <h4 className="text-base md:text-lg font-bold">Términos de Crédito</h4>
        </div>
        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
          <div className="min-w-0">
            <p className="text-[10px] text-on-surface-deep uppercase truncate">Crédito Acordado</p>
            <p className="text-sm md:text-base font-bold truncate">
              {terms.creditDays != null ? `Net ${terms.creditDays} días` : '—'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-on-surface-deep uppercase truncate">Factura más antigua</p>
            <p className="text-sm md:text-base font-bold text-error truncate">{terms.oldestInvoice}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalysisCards;
