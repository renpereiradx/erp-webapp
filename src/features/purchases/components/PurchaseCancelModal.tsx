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
      <div className='relative bg-surface-container-lowest w-full max-w-sm rounded-md shadow-whisper p-6 border border-surface-variant text-center space-y-5 animate-in fade-in zoom-in-95 duration-200'>
        <div className='w-14 h-14 bg-[rgba(209,52,56,0.1)] text-error rounded-full flex items-center justify-center mx-auto'>
          <Ban size={28} />
        </div>
        <div>
          <h3 className='text-lg font-semibold text-on-surface'>
            ¿Anular esta orden?
          </h3>
          <p className='text-sm text-on-surface-variant mt-2'>
            Esta acción afectará los saldos con{' '}
            <span className='font-semibold text-error'>
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
            className='flex-1 py-2.5 font-medium text-on-surface-variant hover:bg-surface-container-low rounded-md border border-surface-variant transition-colors text-sm'
            onClick={() => setShowCancelPreview(false)}
          >
            Cancelar
          </button>
          <button
            className='flex-1 py-2.5 bg-error hover:bg-[#B52E31] text-white font-semibold rounded-md shadow-whisper active:scale-[0.98] transition-all text-sm disabled:opacity-50 disabled:pointer-events-none'
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
