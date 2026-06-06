import React from 'react';
import { CheckCircle, Building, AlertCircle } from 'lucide-react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';

export type PurchaseConfirmationModalProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'showConfirmationModal'
  | 'latestPurchaseResult'
  | 'setShowConfirmationModal'
  | 'paymentCurrency'
  | 'setActiveTab'
  | 'handleFilter'
  | 'setShowInstantPayment'
>;

export const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  showConfirmationModal,
  latestPurchaseResult,
  setShowConfirmationModal,
  paymentCurrency,
  setActiveTab,
  handleFilter,
  setShowInstantPayment,
}) => {
  if (!showConfirmationModal || !latestPurchaseResult) return null;

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4'>
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity'
        onClick={() => setShowConfirmationModal(false)}
      ></div>
      <div className='relative bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] w-full max-w-lg rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] p-6 border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 duration-300'>
        <div className='flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3 shrink-0'>
          <div className='w-10 h-10 bg-[rgba(16,124,16,0.1)] text-[var(--fluent-semantic-success,#107C10)] rounded-full flex items-center justify-center'>
            <CheckCircle size={22} />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
              Compra Registrada
            </h3>
            <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
              Orden de compra #{latestPurchaseResult.id} guardada con éxito.
            </p>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto py-4 space-y-4 pr-1'>
          <div className='grid grid-cols-2 gap-4 text-left p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg'>
            <div>
              <span className='block text-[10px] font-bold text-gray-400 uppercase tracking-tight'>Monto Total</span>
              <span className='text-base font-bold text-text-main'>{formatCurrency(latestPurchaseResult.total_amount, paymentCurrency)}</span>
            </div>
            <div>
              <span className='block text-[10px] font-bold text-gray-400 uppercase tracking-tight'>Sucursal Asignada</span>
              <span className='text-sm font-semibold text-text-main flex items-center gap-1 mt-0.5'>
                <Building size={12} className="text-primary" />
                Sucursal #{latestPurchaseResult.branch_id}
              </span>
            </div>
          </div>

          {latestPurchaseResult.warnings && latestPurchaseResult.warnings.length > 0 && (
            <div className='p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg text-left space-y-1.5'>
              <div className='flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider'>
                <AlertCircle size={14} /> Advertencias Fiscales
              </div>
              <ul className='list-disc pl-4 text-xs text-amber-800 dark:text-amber-300 space-y-1'>
                {latestPurchaseResult.warnings.map((w: any, idx: number) => (
                  <li key={idx}>
                    {w.product_name || w.name || 'Producto'}: Tasa observada del {w.observed_tax_rate || w.tax_rate}% difiere de la esperada.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {latestPurchaseResult.details && latestPurchaseResult.details.length > 0 && (
            <div className='space-y-1.5 text-left'>
              <span className='block text-[10px] font-bold text-gray-400 uppercase tracking-tight'>Liquidación Fiscal por Ítem</span>
              <div className='border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden'>
                <table className='w-full text-xs text-left border-collapse'>
                  <thead className='bg-gray-50 dark:bg-gray-800/60 font-semibold text-gray-500'>
                    <tr>
                      <th className='px-3 py-2'>Producto</th>
                      <th className='px-2 py-2 text-center'>Cant.</th>
                      <th className='px-2 py-2 text-center'>IVA</th>
                      <th className='px-3 py-2 text-right'>Fuente</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100 dark:divide-gray-800'>
                    {latestPurchaseResult.details.map((detail: any, idx: number) => (
                      <tr key={idx} className='hover:bg-gray-50/50 dark:hover:bg-gray-800/20'>
                        <td className='px-3 py-2 font-medium truncate max-w-[140px]'>{detail.name || detail.product_name || `Producto #${detail.product_id}`}</td>
                        <td className='px-2 py-2 text-center'>{formatNumber(detail.quantity)}</td>
                        <td className='px-2 py-2 text-center font-semibold text-primary'>{detail.applied_tax_rate ?? detail.tax_rate ?? 0}%</td>
                        <td className='px-3 py-2 text-right text-text-secondary italic text-[10px]'>{detail.tax_resolution_source || 'default'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className='flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 shrink-0'>
          <button
            className='flex-1 py-2.5 font-medium text-[var(--fluent-text-secondary,#605E5C)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] transition-colors text-sm'
            onClick={() => {
              setShowConfirmationModal(false)
              setActiveTab('historial')
              handleFilter()
            }}
          >
            Ver en Historial
          </button>
          <button
            className='flex-1 py-2.5 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all text-sm'
            onClick={() => {
              setShowConfirmationModal(false)
              setShowInstantPayment(true)
            }}
          >
            Registrar Pago
          </button>
        </div>
      </div>
    </div>
  );
};
