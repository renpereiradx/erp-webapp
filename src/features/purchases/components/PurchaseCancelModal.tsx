import React from 'react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
import { useI18n } from '@/lib/i18n';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { Button } from '@/components/ui/button';

export type PurchaseCancelModalProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'showCancelPreview'
  | 'cancelPreviewData'
  | 'orderToCancel'
  | 'setShowCancelPreview'
  | 'handleConfirmCancellation'
  | 'canWrite'
>;

export const PurchaseCancelModal: React.FC<PurchaseCancelModalProps> = ({
  showCancelPreview,
  cancelPreviewData,
  orderToCancel,
  setShowCancelPreview,
  handleConfirmCancellation,
  canWrite,
}) => {
  const { t } = useI18n();
  const isOpen = showCancelPreview && !!cancelPreviewData && !!orderToCancel;
  const impact = cancelPreviewData?.impact_analysis;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={() => setShowCancelPreview(false)}
      title={t('purchases.cancel.title', '¿Anular esta orden?')}
      variant='error'
      size='sm'
      footer={
        <div className='flex justify-end gap-sm w-full'>
          <Button variant='secondary' onClick={() => setShowCancelPreview(false)}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button variant='destructive' onClick={handleConfirmCancellation} disabled={!canWrite}>
            {t('purchases.cancel.confirm', 'Sí, Anular')}
          </Button>
        </div>
      }
    >
      <div className='space-y-md'>
        <p className='text-body-md text-on-surface-deep'>
          {t('purchases.cancel.body', 'Esta acción afectará los saldos con {supplier}.', {
            supplier: orderToCancel?.supplier_name ?? '',
          })}
        </p>
        {impact && (
          <div className='p-md bg-error-container text-on-error-container rounded-md text-left space-y-1'>
            <p className='text-body-sm-bold'>{t('purchases.cancel.impact_title', 'Impacto de la anulación:')}</p>
            <ul className='list-disc pl-4 text-body-sm space-y-1'>
              {impact.requires_payment_reversal && (
                <li>
                  {t('purchases.cancel.impact_payments', 'Se reversarán {count} pagos.', {
                    count: impact.payments_to_cancel || 0,
                  })}
                </li>
              )}
              {impact.requires_stock_adjustment && (
                <li>
                  {t('purchases.cancel.impact_stock', 'Se ajustará el stock de {count} items.', {
                    count: impact.stock_adjustments_required || 0,
                  })}
                </li>
              )}
              <li>
                {t('purchases.cancel.impact_total', 'Total a reversar: {amount}', {
                  amount: impact.total_to_reverse || 0,
                })}
              </li>
            </ul>
          </div>
        )}
      </div>
    </EnhancedModal>
  );
};
