// ===========================================================================
// TransferTicketModal — ticket 80mm de la transferencia (guía de despacho).
// Preview + impresión local por iframe (mismo patrón que OrderTicketModal de
// counterorders: se serializa el preview ya renderizado, incluido el QR).
// El QR codifica el shipping_tracking_number (fallback: transfer_code): en
// recepción se escanea y se busca la transferencia por ese código.
// ===========================================================================

import { useRef, type CSSProperties } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { printTicketHtml } from '@/features/counterorders/utils/printTicket'
import type { BranchTransfer } from '../types'
import type { BranchTransferItem } from '@/types'

const th: CSSProperties = { textAlign: 'left', fontSize: 11, padding: '2px 0' }
const td: CSSProperties = { fontSize: 12, padding: '2px 0', verticalAlign: 'top' }

interface TransferTicketModalProps {
  open: boolean
  onClose: () => void
  transfer: BranchTransfer | null
  items: BranchTransferItem[]
  sourceLabel: string
  destinationLabel: string
}

/** Ticket en sí: SOLO estilos inline — viajan al iframe vía innerHTML. */
export function TransferTicketContent({
  transfer,
  items,
  sourceLabel,
  destinationLabel,
}: {
  transfer: BranchTransfer
  items: BranchTransferItem[]
  sourceLabel: string
  destinationLabel: string
}) {
  const { t } = useI18n()
  const tracking = transfer.shipping_tracking_number || transfer.transfer_code
  const emitted = new Date(transfer.requested_date || transfer.created_at).toLocaleString()
  const shippedAt = transfer.shipped_date
    ? new Date(transfer.shipped_date).toLocaleString()
    : null

  return (
    <div
      style={{ width: '72mm', margin: '0 auto', fontFamily: "'Courier New', ui-monospace, monospace" }}
      data-testid="transfer-ticket"
    >
      <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>
        {t('transfers.ticket.heading', 'TRANSFERENCIA')}
      </p>
      <p style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 2, margin: '0 0 2px' }}>
        {transfer.transfer_code}
      </p>
      <p style={{ textAlign: 'center', fontSize: 12, margin: '0 0 8px' }}>
        {t('transfers.ticket.tracking', 'Guía: {tracking}', { tracking })}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <QRCodeSVG value={tracking} size={96} data-testid="transfer-ticket-qr" />
      </div>
      <p style={td}>{t('transfers.ticket.route', 'Ruta: {source} → {destination}', { source: sourceLabel, destination: destinationLabel })}</p>
      <p style={td}>{t('transfers.ticket.emitted', 'Emitida: {date}', { date: emitted })}</p>
      {shippedAt && <p style={td}>{t('transfers.ticket.shipped', 'Despachada: {date}', { date: shippedAt })}</p>}
      <p style={td}>{t('transfers.ticket.requestedBy', 'Solicitada por: {name}', { name: transfer.requested_by })}</p>
      <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>{t('transfers.ticket.col_item', 'ÍTEM')}</th>
            <th style={{ ...th, textAlign: 'right' }}>{t('transfers.ticket.col_requested', 'SOLIC')}</th>
            <th style={{ ...th, textAlign: 'right' }}>{t('transfers.ticket.col_shipped', 'ENV')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td style={td}>
                {item.product_name || item.product_id}
                {item.variant_id ? ` · ${item.variant_id}` : ''}
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {String(item.quantity_requested)}
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {item.quantity_shipped ?? item.quantity_requested}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
      {transfer.notes && (
        <p style={{ ...td, marginTop: 6 }}>
          {t('transfers.ticket.notes', 'Nota: {notes}', { notes: transfer.notes })}
        </p>
      )}
      <p style={{ fontSize: 10, marginTop: 10, textAlign: 'center' }}>
        {t(
          'transfers.ticket.footer',
          'Presentá esta guía en la sucursal destino para recepcionar la transferencia.',
        )}
      </p>
    </div>
  )
}

export function TransferTicketModal({ open, onClose, transfer, items, sourceLabel, destinationLabel }: TransferTicketModalProps) {
  const { t } = useI18n()
  // Fuente única de verdad: la impresión serializa el preview ya renderizado
  // (incluye el SVG del QR) en vez de duplicar el markup para el iframe.
  const ticketRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!ticketRef.current || !transfer) return
    printTicketHtml(ticketRef.current.innerHTML, transfer.transfer_code)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-3rem)] sm:max-w-[420px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-xl border-border-subtle bg-surface shadow-fluent-16">
        <DialogHeader className="mb-0 shrink-0 space-y-xs border-b border-divider bg-surface-muted p-lg">
          <DialogTitle className="text-title-md text-foreground">
            {t('transfers.ticket.title', 'Ticket {code}', { code: transfer?.transfer_code ?? '' })}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-lg">
          {transfer ? (
            <div ref={ticketRef} className="bg-surface rounded-md border border-border-subtle p-4 overflow-x-auto">
              <TransferTicketContent
                transfer={transfer}
                items={items}
                sourceLabel={sourceLabel}
                destinationLabel={destinationLabel}
              />
            </div>
          ) : (
            <p className="text-body-md text-on-surface-deep">
              {t('transfers.ticket.empty', 'No hay transferencia para imprimir.')}
            </p>
          )}
        </div>
        <DialogFooter className="flex shrink-0 justify-end gap-sm border-t border-divider p-lg pt-md">
          <Button variant="secondary" onClick={onClose}>
            {t('common.close', 'Cerrar')}
          </Button>
          <Button onClick={handlePrint} data-testid="transfer-ticket-print" disabled={!transfer}>
            <Printer size={16} className="mr-1" />
            {t('transfers.ticket.print', 'Imprimir')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TransferTicketModal
