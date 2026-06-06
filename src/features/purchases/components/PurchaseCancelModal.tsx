import React from 'react';
import { Ban } from 'lucide-react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';

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
  if (!showCancelPreview || !cancelPreviewData || !orderToCancel) return null;

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4'>
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity'
        onClick={() => setShowCancelPreview(false)}
      ></div>
      <div className='relative bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] w-full max-w-sm rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] p-6 border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] text-center space-y-5 animate-in fade-in zoom-in-95 duration-200'>
        <div className='w-14 h-14 bg-[rgba(209,52,56,0.1)] text-[var(--fluent-semantic-danger,#D13438)] rounded-full flex items-center justify-center mx-auto'>
          <Ban size={28} />
        </div>
        <div>
          <h3 className='text-lg font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
            ¿Anular esta orden?
          </h3>
          <p className='text-sm text-[var(--fluent-text-secondary,#605E5C)] mt-2'>
            Esta acción afectará los saldos con{' '}
            <span className='font-semibold text-[var(--fluent-semantic-danger,#D13438)]'>
              {orderToCancel.supplier_name}
            </span>
            .
          </p>
          {cancelPreviewData.impact_analysis && (
            <div className='mt-4 p-3 bg-red-50 text-red-700 text-xs rounded text-left border border-red-100'>
              <p className='font-semibold mb-1'>Impacto de la anulación:</p>
              <ul className='list-disc pl-4 space-y-1'>
                {cancelPreviewData.impact_analysis.requires_payment_reversal && (
                  <li>Se reversarán {cancelPreviewData.impact_analysis.payments_to_cancel || 0} pagos.</li>
                )}
                {cancelPreviewData.impact_analysis.requires_stock_adjustment && (
                  <li>Se ajustará el stock de {cancelPreviewData.impact_analysis.stock_adjustments_required || 0} items.</li>
                )}
                <li>Total a reversar: {cancelPreviewData.impact_analysis.total_to_reverse || 0}</li>
              </ul>
            </div>
          )}
        </div>
        <div className='flex gap-3 pt-2'>
          <button
            className='flex-1 py-2.5 font-medium text-[var(--fluent-text-secondary,#605E5C)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] transition-colors text-sm'
            onClick={() => setShowCancelPreview(false)}
          >
            Cancelar
          </button>
          <button
            className='flex-1 py-2.5 bg-[var(--fluent-semantic-danger,#D13438)] hover:bg-[#B52E31] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all text-sm disabled:opacity-50 disabled:pointer-events-none'
            onClick={handleConfirmCancellation}
            disabled={!canWrite}
          >
            Sí, Anular
          </button>
        </div>
      </div>
    </div>
  );
};
