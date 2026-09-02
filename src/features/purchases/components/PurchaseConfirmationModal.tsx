import React from 'react';
import { Building } from 'lucide-react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
import { useI18n } from '@/lib/i18n';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';

export type PurchaseConfirmationModalProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'showConfirmationModal'
  | 'latestPurchaseResult'
  | 'setShowConfirmationModal'
  | 'paymentCurrency'
  | 'setActiveTab'
  | 'handleFilter'
>;

export const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  showConfirmationModal,
  latestPurchaseResult,
  setShowConfirmationModal,
  paymentCurrency,
  setActiveTab,
  handleFilter,
}) => {
  const { t } = useI18n();

  // Guard de narrowing: sin resultado no hay modal (EnhancedModal ni se monta).
  if (!showConfirmationModal || !latestPurchaseResult) return null;

  const handleClose = () => setShowConfirmationModal(false);

  const handleViewHistory = () => {
    handleClose();
    setActiveTab('historial');
    handleFilter();
  };

  return (
    <EnhancedModal
      isOpen
      onClose={handleClose}
      title={t('purchases.confirmation.title', 'Compra Registrada')}
      subtitle={t('purchases.confirmation.subtitle', 'Orden de compra #{id} guardada con éxito.', {
        id: latestPurchaseResult?.id ?? '',
      })}
      variant='success'
      size='md'
      footer={
        <div className='flex justify-end gap-sm w-full'>
          <Button variant='secondary' onClick={handleViewHistory}>
            {t('purchases.confirmation.actions.history', 'Ver en Historial')}
          </Button>
          <Button variant='primary' onClick={handleClose}>
            {t('purchases.confirmation.actions.close', 'Cerrar')}
          </Button>
        </div>
      }
    >
      <div className='space-y-md'>
        <div className='grid grid-cols-2 gap-md p-md bg-surface-muted rounded-md text-left'>
          <div>
            <span className='block text-label-caps uppercase text-outline-fg'>
              {t('purchases.confirmation.total', 'Monto Total')}
            </span>
            <span className='text-data-mono font-data-mono text-foreground'>
              {formatCurrency(latestPurchaseResult.total_amount ?? 0, paymentCurrency)}
            </span>
          </div>
          <div>
            <span className='block text-label-caps uppercase text-outline-fg'>
              {t('purchases.confirmation.branch', 'Sucursal Asignada')}
            </span>
            <span className='text-body-md-bold text-foreground flex items-center gap-1 mt-0.5'>
              <Building size={14} className='text-primary' aria-hidden='true' />
              {t('purchases.confirmation.branch_value', 'Sucursal #{id}', {
                id: latestPurchaseResult.branch_id ?? '',
              })}
            </span>
          </div>
        </div>

        {latestPurchaseResult.warnings?.length > 0 && (
          <div className='p-md bg-warning/10 border border-warning/20 rounded-md text-left space-y-1.5'>
            <div className='flex items-center gap-1.5 text-body-sm-bold text-warning uppercase'>
              {t('purchases.confirmation.warnings', 'Advertencias')}
            </div>
            <ul className='list-disc pl-4 text-body-sm text-foreground space-y-1'>
              {latestPurchaseResult.warnings.map((w: any, idx: number) => (
                <li key={idx}>
                  {w.type === 'PRICE_DERIVATION_SKIPPED'
                    ? t('purchases.confirmation.warning.price', '{product}: {reason}', {
                        product: w.product_name || w.product_id || t('purchases.confirmation.fallback_product', 'Producto'),
                        reason: w.reason || t('purchases.confirmation.warning.no_price_reason', 'No se pudo derivar precio'),
                      })
                    : t('purchases.confirmation.warning.tax_rate', '{product}: Tasa observada del {rate}% difiere de la esperada.', {
                        product: w.product_name || w.name || t('purchases.confirmation.fallback_product', 'Producto'),
                        rate: w.observed_tax_rate || w.tax_rate,
                      })}
                </li>
              ))}
            </ul>
          </div>
        )}

        {latestPurchaseResult.details?.length > 0 && (
          <div className='space-y-sm text-left'>
            <span className='block text-label-caps uppercase text-outline-fg'>
              {t('purchases.confirmation.fiscal_title', 'Liquidación Fiscal por Ítem')}
            </span>
            <div className='rounded-md border border-border-subtle overflow-hidden'>
              <Table>
                <TableHeader className='bg-surface-muted'>
                  <TableRow className='hover:bg-surface-muted border-0'>
                    <TableHead className='text-label-caps uppercase text-on-surface-deep px-md py-sm'>
                      {t('purchases.confirmation.col_product', 'Producto')}
                    </TableHead>
                    <TableHead className='text-label-caps uppercase text-on-surface-deep px-sm py-sm text-center'>
                      {t('purchases.confirmation.col_qty', 'Cant.')}
                    </TableHead>
                    <TableHead className='text-label-caps uppercase text-on-surface-deep px-sm py-sm text-center'>
                      {t('purchases.confirmation.col_iva', 'IVA')}
                    </TableHead>
                    <TableHead className='text-label-caps uppercase text-on-surface-deep px-md py-sm text-right'>
                      {t('purchases.confirmation.col_source', 'Fuente')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestPurchaseResult.details.map((detail: any, idx: number) => (
                    <TableRow key={idx} className='hover:bg-surface-muted transition-colors duration-150'>
                      <TableCell className='px-md py-sm text-body-md text-foreground truncate max-w-[140px]'>
                        {detail.name || detail.product_name || `#${detail.product_id}`}
                      </TableCell>
                      <TableCell className='px-sm py-sm text-center text-data-mono font-data-mono text-foreground'>
                        {formatNumber(detail.quantity)}
                      </TableCell>
                      <TableCell className='px-sm py-sm text-center text-data-mono font-data-mono text-primary'>
                        {detail.applied_tax_rate ?? detail.tax_rate ?? 0}%
                      </TableCell>
                      <TableCell className='px-md py-sm text-right text-body-sm text-outline-fg'>
                        {detail.tax_resolution_source || 'default'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </EnhancedModal>
  );
};
