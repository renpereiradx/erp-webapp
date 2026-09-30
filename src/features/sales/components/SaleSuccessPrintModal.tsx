/**
 * SaleSuccessPrintModal — comprobante al terminar el cobro (PLAN impresión
 * checkout). Se abre desde SalesNew.onConfirmWizard SOLO cuando se registró
 * un cobro (completo o parcial); "Dejar pendiente" no lo abre.
 *
 * Ofrece la impresión en el momento (antes había que ir al detalle de la
 * venta): ticket térmico server-side (fiscalService.printTicket → la RECEIPT
 * default del branch) y comprobante PDF (comprobante.pdf, KuDE si la venta
 * es fiscal). La impresión es OPCIONAL: sin impresora RECEIPT configurada el
 * botón se deshabilita con hint en lugar de golpear un 404 (mismo patrón que
 * useSaleFiscalPanel.printConfigured).
 *
 * El resumen se consulta a getSalePaymentStatus (verdad del BE): en modo
 * merge el total del carrito NO es el total de la venta, y el saldo real lo
 * define el backend (venta PAID vs cobro parcial).
 */
import { useEffect, useState } from 'react'
import { Download, Loader2, Printer, CheckCircle2 } from 'lucide-react'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { formatCurrency } from '@/utils/currencyUtils'
import { salePaymentService } from '@/services/salePaymentService'
import { fiscalService } from '@/features/fiscal/services/fiscalService'
import { printersService } from '@/features/printers/services/printersService'

interface SaleSuccessPrintModalProps {
  /** Venta cobrada; null ⇒ modal cerrado. */
  saleId: string | null
  onClose: () => void
}

/** Dispara la descarga del blob en el navegador (a[download] + object URL). */
const saveBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const SaleSuccessPrintModal = ({ saleId, onClose }: SaleSuccessPrintModalProps) => {
  const { t } = useI18n()
  const toast = useToast()
  const { hasPermission } = useAuth()
  const canUseDocuments = hasPermission('documents:read')

  const [printing, setPrinting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const isOpen = !!saleId

  // Verdad del BE sobre el estado del cobro (total, pagado, saldo).
  const { data: status, isLoading } = useQuery({
    queryKey: ['sale-payment-status', saleId] as const,
    queryFn: () => salePaymentService.getSalePaymentStatus(saleId!),
    enabled: isOpen,
  })

  // Impresión opcional: hay RECEIPT activa+default? (null = indeterminado).
  const { data: printers } = useQuery({
    queryKey: ['printers-active'] as const,
    queryFn: () => printersService.list({ active: true }),
    enabled: isOpen && canUseDocuments,
  })
  const printConfigured: boolean | null = !canUseDocuments
    ? false
    : printers
      ? printers.some((p) => p.purpose === 'RECEIPT' && p.is_default)
      : null

  const handlePrint = async () => {
    if (!saleId) return
    setPrinting(true)
    try {
      const result = await fiscalService.printTicket(saleId)
      toast.success(
        t('sales.checkoutWizard.receipt.printSent', 'Ticket enviado a {printer}', { printer: result.printer }),
      )
    } catch {
      toast.error(t('sales.checkoutWizard.receipt.printError', 'No se pudo imprimir el ticket'))
    } finally {
      setPrinting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!saleId) return
    setDownloading(true)
    try {
      const { blob, filename } = await fiscalService.downloadComprobantePdf(saleId)
      saveBlob(blob, filename)
    } catch {
      toast.error(t('sales.checkoutWizard.receipt.pdfError', 'No se pudo descargar el PDF'))
    } finally {
      setDownloading(false)
    }
  }

  const balanceDue = status?.balance_due ?? 0
  const isPartial = !!status && !status.is_fully_paid && balanceDue > 0

  const printDisabled = !canUseDocuments || printing || printConfigured === false
  const noPrinterHint =
    t('sales.checkoutWizard.receipt.noPrinter', 'Sin impresora configurada: registrala en Configuración → Impresoras')

  // Enter = imprimir ticket (si está habilitado). Esc lo maneja EnhancedModal.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.defaultPrevented && !printDisabled) {
        e.preventDefault()
        void handlePrint()
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
      title={t('sales.checkoutWizard.receipt.title', 'Venta cobrada')}
      subtitle={saleId ? t('sales.checkoutWizard.receipt.subtitle', 'Venta #{id}', { id: saleId }) : ''}
      variant="success"
      size="sm"
      loading={isOpen && isLoading}
      closeOnOverlayClick={false}
      testId="sale-success-print-modal"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading || !canUseDocuments}>
            {downloading ? (
              <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Download size={14} className="mr-2" aria-hidden="true" />
            )}
            {t('sales.checkoutWizard.receipt.downloadPdf', 'Descargar PDF')}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={printDisabled}
            title={printConfigured === false ? noPrinterHint : undefined}
            data-testid="receipt-print-ticket"
          >
            {printing ? (
              <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Printer size={14} className="mr-2" aria-hidden="true" />
            )}
            {t('sales.checkoutWizard.receipt.printTicket', 'Imprimir ticket')}
          </Button>
          <Button variant="primary" onClick={onClose} data-testid="receipt-close">
            {t('sales.checkoutWizard.receipt.close', 'Listo')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
          <p className="text-body-md text-on-surface-deep">
            {t('sales.checkoutWizard.receipt.registered', 'El cobro quedó registrado. ¿Querés entregar comprobante?')}
          </p>
        </div>

        <dl className="rounded-md bg-surface-subtle px-4 py-3 space-y-2" data-testid="receipt-summary">
          <div className="flex items-center justify-between text-body-sm">
            <dt className="text-on-surface-deep">{t('sales.checkoutWizard.receipt.total', 'Total de la venta')}</dt>
            <dd className="font-data-mono text-foreground">
              {formatCurrency(status?.total_amount ?? 0)}
            </dd>
          </div>
          <div className="flex items-center justify-between text-body-sm">
            <dt className="text-on-surface-deep">{t('sales.checkoutWizard.receipt.paid', 'Cobrado')}</dt>
            <dd className="font-data-mono text-foreground">
              {formatCurrency(status?.total_paid ?? 0)}
            </dd>
          </div>
          {isPartial && (
            <div className="flex items-center justify-between text-body-sm border-t border-divider pt-2">
              <dt className="text-on-surface-deep flex items-center gap-2">
                <Badge variant="secondary" size="sm" data-testid="receipt-partial-badge">
                  {t('sales.checkoutWizard.receipt.partialBadge', 'Cobro parcial')}
                </Badge>
              </dt>
              <dd className="font-data-mono text-error" data-testid="receipt-balance">
                {t('sales.checkoutWizard.receipt.pending', 'Saldo: {amount}', {
                  amount: formatCurrency(balanceDue),
                })}
              </dd>
            </div>
          )}
        </dl>

        {printConfigured === false && canUseDocuments && (
          <p className="text-body-sm text-on-surface-deep">{noPrinterHint}</p>
        )}
        {!canUseDocuments && (
          <p className="text-body-sm text-on-surface-deep">
            {t('sales.checkoutWizard.receipt.noPermission', 'Tu usuario no tiene permiso de comprobantes (documents).')}
          </p>
        )}
      </div>
    </EnhancedModal>
  )
}

export default SaleSuccessPrintModal
