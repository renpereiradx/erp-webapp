/**
 * RequestCancellationModal — el vendor (sin sales:cancel) solicita la
 * anulación de una venta con motivo obligatorio (FASE C,
 * PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES). EnhancedModal variant="warning":
 * la acción no es destructiva — solo crea una solicitud pendiente.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { useI18n } from '@/lib/i18n';

interface RequestCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  submitting: boolean;
}

export const RequestCancellationModal: React.FC<RequestCancellationModalProps> = ({
  isOpen,
  onClose,
  saleId,
  reason,
  onReasonChange,
  onConfirm,
  submitting,
}) => {
  const { t } = useI18n();

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sales.cancellation.requestTitle', 'Solicitar Anulación #{id}', { id: saleId })}
      variant="warning"
      size="sm"
      closeOnOverlayClick={!submitting}
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={submitting || !reason.trim()}
            data-testid="request-cancellation-submit"
          >
            {submitting
              ? t('sales.cancellation.sending', 'Enviando...')
              : t('sales.cancellation.requestConfirm', 'Enviar Solicitud')}
          </Button>
        </div>
      }
    >
      <div className="space-y-md py-2">
        <p className="text-body-md text-on-surface-deep">
          {t(
            'sales.cancellation.requestWarning',
            'No tenés permiso para anular ventas. Podés enviar una solicitud con motivo y un rol con autorización la revisará.',
          )}
        </p>

        <div className="space-y-xs">
          <Label htmlFor="request-cancellation-reason" className="text-body-md-bold text-foreground">
            {t('sales.cancellation.requestReason', 'Motivo de la solicitud')}
          </Label>
          <Textarea
            id="request-cancellation-reason"
            data-testid="request-cancellation-reason"
            className="text-sm"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t('sales.cancellation.requestReasonPlaceholder', 'Ej: cliente se arrepintió, error de carga...')}
            rows={3}
          />
        </div>
      </div>
    </EnhancedModal>
  );
};
