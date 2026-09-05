/**
 * CancelSaleModal — anulación de una venta del historial con preview de
 * impacto (cobros a revertir / monto). EnhancedModal variant="error" + botón
 * destructive, según DESIGN.md (acción destructiva siempre en modal y con
 * variante que comunique severidad).
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { formatCurrency } from '@/utils/currencyUtils';
import { useI18n } from '@/lib/i18n';

interface CancelSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  reason: string;
  onReasonChange: (v: string) => void;
  /** Preview devuelto por previewSaleCancellation (null mientras carga). */
  preview: Record<string, unknown> | null;
  onConfirm: () => void;
  submitting: boolean;
  /** B.5: confirm disabled without sales:cancel. */
  canCancel: boolean;
}

export const CancelSaleModal: React.FC<CancelSaleModalProps> = ({
  isOpen,
  onClose,
  saleId,
  reason,
  onReasonChange,
  preview,
  onConfirm,
  submitting,
  canCancel,
}) => {
  const { t } = useI18n();
  const impact = (preview?.impact_analysis as Record<string, number> | undefined) ?? null;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sales.cancelSale.title', 'Anular Venta #{id}', { id: saleId })}
      variant="error"
      size="sm"
      closeOnOverlayClick={!submitting}
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={submitting || !canCancel}>
            {submitting
              ? t('sales.cancelSale.cancelling', 'Anulando...')
              : t('sales.cancelSale.confirm', 'Sí, Anular')}
          </Button>
        </div>
      }
    >
      <div className="space-y-md py-2">
        <p className="text-body-md text-on-surface-deep">
          {t(
            'sales.cancelSale.warning',
            '¿Estás seguro de anular esta venta? Esta acción revertirá el stock y los cobros realizados.',
          )}
        </p>

        {impact && (
          <div className="p-3 bg-surface-muted rounded-md border border-border-subtle space-y-1" data-testid="cancel-sale-impact">
            <p className="text-label-caps text-on-surface-deep uppercase">
              {t('sales.cancelSale.impact', 'Impacto Estimado')}
            </p>
            <div className="flex justify-between text-body-sm text-foreground">
              <span>{t('sales.cancelSale.paymentsToReverse', 'Cobros a revertir:')}</span>
              <span className="font-data-mono">{impact.payments_to_cancel || 0}</span>
            </div>
            <div className="flex justify-between text-body-sm text-foreground">
              <span>{t('sales.cancelSale.totalToReverse', 'Monto total:')}</span>
              <span className="font-data-mono">{formatCurrency(impact.total_to_reverse || 0)}</span>
            </div>
          </div>
        )}

        <div className="space-y-xs">
          <Label htmlFor="cancel-sale-reason" className="text-body-md-bold text-foreground">
            {t('sales.cancelSale.reason', 'Motivo de anulación')}
          </Label>
          <Input
            id="cancel-sale-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t('sales.cancelSale.reasonPlaceholder', 'Ej: Error en facturación, devolución...')}
          />
        </div>
      </div>
    </EnhancedModal>
  );
};
