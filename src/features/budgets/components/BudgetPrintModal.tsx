/**
 * BudgetPrintModal — comprobante al aprobar un presupuesto (PLAN presupuestos:
 * impresión con impresora + PDF, espejo del modal post-cobro de ventas).
 *
 * Se abre desde BudgetDetail después de "Aprobar Presupuesto": el documento
 * queda listo para entregar al cliente sin buscarlo de nuevo. Ofrece ticket
 * térmico server-side (budgets/{id}/ticket/print) y PDF
 * (budgets/{id}/comprobante.pdf). La impresión es OPCIONAL: sin impresora
 * RECEIPT configurada el botón se deshabilita con hint (useBudgetDocuments).
 */
import { useEffect } from 'react'
import { Download, Loader2, Printer, CheckCircle2 } from 'lucide-react'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import { useBudgetDocuments } from '../hooks/useBudgetDocuments'

interface BudgetPrintModalProps {
  /** Presupuesto aprobado; null ⇒ modal cerrado. */
  budget: { id: string; total_amount: number; valid_until?: string | null } | null
  onClose: () => void
}

export const BudgetPrintModal = ({ budget, onClose }: BudgetPrintModalProps) => {
  const { t } = useI18n()
  const { canUseDocuments, printConfigured, printing, downloading, print, downloadPdf } =
    useBudgetDocuments()

  const isOpen = !!budget

  const printDisabled = !canUseDocuments || printing || printConfigured === false
  const noPrinterHint = t(
    'budgets.print.noPrinter',
    'Sin impresora configurada: registrala en Configuración → Impresoras',
  )

  // Enter = imprimir ticket (si está habilitado). Esc lo maneja EnhancedModal.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.defaultPrevented && !printDisabled) {
        e.preventDefault()
        void print(budget!.id)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, printDisabled])

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('budgets.print.title', 'Presupuesto aprobado')}
      subtitle={budget ? t('budgets.print.subtitle', 'Presupuesto #{id}', { id: budget.id }) : ''}
      variant="success"
      size="sm"
      closeOnOverlayClick={false}
      testId="budget-print-modal"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => budget && downloadPdf(budget.id)}
            disabled={downloading || !canUseDocuments}
          >
            {downloading ? (
              <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Download size={14} className="mr-2" aria-hidden="true" />
            )}
            {t('budgets.print.downloadPdf', 'Descargar PDF')}
          </Button>
          <Button
            variant="outline"
            onClick={() => budget && print(budget.id)}
            disabled={printDisabled}
            title={printConfigured === false ? noPrinterHint : undefined}
            data-testid="budget-print-ticket"
          >
            {printing ? (
              <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Printer size={14} className="mr-2" aria-hidden="true" />
            )}
            {t('budgets.print.printTicket', 'Imprimir ticket')}
          </Button>
          <Button variant="primary" onClick={onClose} data-testid="budget-print-close">
            {t('budgets.print.close', 'Listo')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
          <p className="text-body-md text-on-surface-deep">
            {t(
              'budgets.print.registered',
              'El presupuesto quedó aprobado. ¿Querés entregar el comprobante?',
            )}
          </p>
        </div>

        <dl className="rounded-md bg-surface-subtle px-4 py-3 space-y-2" data-testid="budget-print-summary">
          <div className="flex items-center justify-between text-body-sm">
            <dt className="text-on-surface-deep">{t('budgets.print.total', 'Total')}</dt>
            <dd className="font-data-mono text-foreground">
              {formatPYG(budget?.total_amount ?? 0)}
            </dd>
          </div>
          {budget?.valid_until && (
            <div className="flex items-center justify-between text-body-sm">
              <dt className="text-on-surface-deep">{t('budgets.print.validUntil', 'Válido hasta')}</dt>
              <dd className="font-data-mono text-foreground">
                {new Date(budget.valid_until).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>

        {printConfigured === false && canUseDocuments && (
          <p className="text-body-sm text-on-surface-deep">{noPrinterHint}</p>
        )}
        {!canUseDocuments && (
          <p className="text-body-sm text-on-surface-deep">
            {t('budgets.print.noPermission', 'Tu usuario no tiene permiso de comprobantes (documents).')}
          </p>
        )}
      </div>
    </EnhancedModal>
  )
}

export default BudgetPrintModal
