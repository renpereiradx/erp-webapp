/**
 * CancelSaleModal — confirmación de anulación de venta con justificativa
 * obligatoria y aviso de plazos fiscales SIFEN (FE4.1, S4.1 — MT §11.1.2).
 *
 * La cancelación de una venta fiscal genera un evento de cancelación
 * (rGeVeCan) con plazo legal: 48 h para FE, 168 h para NCE/NDE, desde la
 * aprobación de SIFEN. El backend valida el plazo (409 fuera de plazo); el
 * modal lo anticipa con la fecha de aprobación del DE (fecha_proceso).
 */
import React, { useState } from 'react';
import { Ban, AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { useSaleFiscalPanel } from '@/features/fiscal/hooks/useSaleFiscalPanel';
import { cancellationWindow } from '@/domain/fiscal/cancellation';

export interface CancelSaleModalProps {
  open: boolean;
  onClose: () => void;
  /** Venta del detalle (sale.id, sale.client_name, sale.total_amount…). */
  sale: any;
  /** Respuesta de GET /sale/{id}/preview-cancellation (impacto). */
  cancelPreviewData?: any;
  isSubmitting: boolean;
  /** Formateador de moneda del detalle (para el impacto de la anulación). */
  formatTotal?: (amount: number) => string;
  /** Se invoca con el motivo (justificativa SIFEN) al confirmar. */
  onSubmit: (motivo: string) => void;
}

const CancelSaleModal: React.FC<CancelSaleModalProps> = ({
  open,
  onClose,
  sale,
  cancelPreviewData,
  isSubmitting,
  formatTotal,
  onSubmit,
}) => {
  const { t } = useI18n();
  const [motivo, setMotivo] = useState('');

  // Estado fiscal del DE (misma queryKey que el SaleFiscalPanel → caché
  // compartida; null si la venta no es fiscal).
  const { status } = useSaleFiscalPanel(sale?.id);

  const reset = () => {
    setMotivo('');
    onClose();
  };

  const handleConfirm = () => {
    const trimmed = motivo.trim();
    if (!trimmed) return; // botón deshabilitado igualmente (guard doble)
    onSubmit(trimmed);
  };

  // Aviso fiscal: solo cuando hay DE y la venta está por cancelarse.
  const isApproved = status?.estado === 'APROBADO' || status?.estado === 'APROBADO_OBS';
  const notApproved = status && !isApproved && status.estado !== 'CANCELADO' && status.estado !== 'INUTILIZADO';
  const windowInfo = status ? cancellationWindow(status) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isSubmitting) reset(); }}>
      <DialogContent className="max-w-md rounded-xl border-border-subtle shadow-fluent-64">
        <DialogHeader className="text-center">
          <div className="mx-auto size-14 bg-error/10 text-error rounded-full flex items-center justify-center mb-2">
            <Ban size={28} />
          </div>
          <DialogTitle className="text-lg font-black uppercase tracking-tight text-center">
            {t('fiscal.cancel.title', 'Anular venta')}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary text-center">
            {sale?.client_name
              ? `${t('fiscal.cancel.reason', 'Motivo de cancelación')} — ${sale.client_name}`
              : t('fiscal.cancel.reason', 'Motivo de cancelación')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Impacto de la anulación (preview del backend) */}
          {cancelPreviewData?.impact_analysis && (
            <div className="p-3 bg-error/5 border border-error/20 text-error rounded-xl text-xs space-y-1">
              <p className="font-black uppercase tracking-widest text-[10px] mb-1">
                {t('fiscal.cancel.impactTitle', 'Impacto de la anulación')}
              </p>
              {cancelPreviewData.impact_analysis.requires_payment_reversal && (
                <p>• {t('fiscal.cancel.impactPayments', 'Se reversarán {count} cobro(s).', { count: String(cancelPreviewData.impact_analysis.payments_to_cancel || 0) })}</p>
              )}
              {cancelPreviewData.impact_analysis.requires_stock_adjustment && (
                <p>• {t('fiscal.cancel.impactStock', 'Se devolverán al stock {count} ítem(s).', { count: String(cancelPreviewData.impact_analysis.stock_adjustments_required || 0) })}</p>
              )}
              <p>• {t('fiscal.cancel.impactTotal', 'Total a devolver: {total}', { total: formatTotal ? formatTotal(cancelPreviewData.impact_analysis.total_to_reverse || 0) : String(cancelPreviewData.impact_analysis.total_to_reverse || 0) })}</p>
            </div>
          )}

          {/* Motivo obligatorio — justificativa del evento SIFEN */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-secondary">
              {t('fiscal.cancel.reason', 'Motivo de cancelación')} *
            </label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t('fiscal.cancel.reasonPlaceholder', 'Justificativa para el evento de cancelación SIFEN')}
              rows={3}
              maxLength={500}
              className="text-sm"
              autoFocus
            />
          </div>

          {/* Aviso de plazos fiscales (solo venta fiscal) */}
          {isApproved && windowInfo?.computable && windowInfo.deadline && (
            <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${windowInfo.withinDeadline ? 'bg-amber-50/50 border-amber-200/60 text-amber-800' : 'bg-error/5 border-error/20 text-error'}`}>
              <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                <AlertTriangle size={14} />
                {t('fiscal.cancel.fiscalWarning.title', 'Aviso fiscal SIFEN')}
                <Badge variant={windowInfo.withinDeadline ? 'warning' : 'destructive'} className="ml-auto">
                  {windowInfo.withinDeadline
                    ? t('fiscal.cancel.fiscalWarning.within', 'Dentro de plazo')
                    : t('fiscal.cancel.fiscalWarning.expiredShort', 'Fuera de plazo')}
                </Badge>
              </div>
              <p>
                {t('fiscal.cancel.fiscalWarning.deadline', 'Plazo del evento de cancelación: {hours} h desde la aprobación. Vence el {date}.', {
                  hours: String(windowInfo.deadlineHours),
                  date: windowInfo.deadline.toLocaleString(),
                })}
              </p>
              {!windowInfo.withinDeadline && (
                <p>{t('fiscal.cancel.fiscalWarning.expired', 'Fuera de plazo: el evento de cancelación será rechazado. Emití una NCE o gestioná un trámite administrativo SIFEN.')}</p>
              )}
            </div>
          )}
          {notApproved && (
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-text-secondary">
              <Info size={14} className="mt-0.5 shrink-0" />
              <p>{t('fiscal.cancel.fiscalWarning.notApproved', 'El DE no fue aprobado por SIFEN: el número se inutilizará localmente.')}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 font-bold uppercase text-[10px] tracking-widest"
            onClick={reset}
            disabled={isSubmitting}
          >
            {t('fiscal.cancel.keep', 'Volver')}
          </Button>
          <Button
            className="flex-1 bg-error hover:bg-error/90 text-white font-bold uppercase text-[10px] tracking-widest shadow-fluent-4"
            onClick={handleConfirm}
            disabled={isSubmitting || !motivo.trim()}
          >
            {isSubmitting
              ? t('fiscal.cancel.cancelling', 'Anulando...')
              : t('fiscal.cancel.confirm', 'Sí, anular venta')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSaleModal;
